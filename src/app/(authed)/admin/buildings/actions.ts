"use server";

import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { buildings } from "@/db/schema";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import { revalidateBuildings } from "@/lib/buildings/list";
import { ensureDefaultSociety } from "@/lib/tenants/ensure-unit";

const ROUTE = "/admin/buildings";

export type BuildingActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function gate(): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getAdminProfileFromSession();
  if (!profile) return { ok: false, error: "Not authorized." };
  return { ok: true };
}

interface BuildingInput {
  name: string;
  locality?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  category?: string | null;
}

function normalize(input: BuildingInput): {
  name: string;
  locality: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  category: string | null;
} {
  const trim = (s: string | null | undefined): string | null => {
    const v = (s ?? "").trim();
    return v.length === 0 ? null : v;
  };
  return {
    name: input.name.trim(),
    locality: trim(input.locality),
    city: trim(input.city),
    state: trim(input.state),
    address: trim(input.address),
    category: trim(input.category),
  };
}

export async function createBuildingAction(
  input: BuildingInput,
): Promise<BuildingActionResult<{ id: string }>> {
  const g = await gate();
  if (!g.ok) return g;

  const n = normalize(input);
  if (n.name.length < 2) return { ok: false, error: "Enter the building name." };

  const result = await db.transaction(async (tx) => {
    const society = await ensureDefaultSociety(tx);
    const dupes = await tx.execute<{ id: string }>(
      sql`select id from public.buildings
          where society_id = ${society.id}
            and lower(name) = lower(${n.name})
          limit 1`,
    );
    if (dupes.length > 0) {
      return { ok: false as const, error: `A building named "${n.name}" already exists.` };
    }
    const inserted = await tx
      .insert(buildings)
      .values({
        societyId: society.id,
        name: n.name,
        locality: n.locality,
        city: n.city,
        state: n.state,
        address: n.address,
        category: n.category,
      })
      .returning({ id: buildings.id });
    return { ok: true as const, id: inserted[0]!.id };
  });

  if (!result.ok) return result;

  revalidateBuildings();
  revalidatePath(ROUTE);
  return { ok: true, data: { id: result.id } };
}

interface UpdateBuildingInput extends BuildingInput {
  id: string;
}

export async function updateBuildingAction(
  input: UpdateBuildingInput,
): Promise<BuildingActionResult> {
  const g = await gate();
  if (!g.ok) return g;

  const n = normalize(input);
  if (n.name.length < 2) return { ok: false, error: "Enter the building name." };

  const rows = await db
    .select({ id: buildings.id, societyId: buildings.societyId })
    .from(buildings)
    .where(eq(buildings.id, input.id))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "Building not found." };

  // Same-society name collision check (excluding self).
  const dupes = await db
    .select({ id: buildings.id })
    .from(buildings)
    .where(
      and(
        eq(buildings.societyId, row.societyId),
        sql`lower(${buildings.name}) = lower(${n.name})`,
        ne(buildings.id, input.id),
      ),
    )
    .limit(1);
  if (dupes.length > 0) {
    return { ok: false, error: `Another building is already named "${n.name}".` };
  }

  await db
    .update(buildings)
    .set({
      name: n.name,
      locality: n.locality,
      city: n.city,
      state: n.state,
      address: n.address,
      category: n.category,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(buildings.id, input.id));

  revalidateBuildings();
  revalidatePath(ROUTE);
  return { ok: true };
}

export async function archiveBuildingAction(input: {
  id: string;
}): Promise<BuildingActionResult> {
  const g = await gate();
  if (!g.ok) return g;

  await db
    .update(buildings)
    .set({ archivedAt: new Date().toISOString() })
    .where(and(eq(buildings.id, input.id), isNull(buildings.archivedAt)));

  revalidateBuildings();
  revalidatePath(ROUTE);
  return { ok: true };
}

export async function restoreBuildingAction(input: {
  id: string;
}): Promise<BuildingActionResult> {
  const g = await gate();
  if (!g.ok) return g;

  await db
    .update(buildings)
    .set({ archivedAt: null })
    .where(eq(buildings.id, input.id));

  revalidateBuildings();
  revalidatePath(ROUTE);
  return { ok: true };
}

/**
 * Parse a single CSV line respecting quoted fields. We hand-roll this
 * (instead of pulling in papaparse) because the format is fixed and the
 * file is admin-uploaded, not user-supplied — keeps the bundle smaller.
 */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ",") {
        out.push(cur);
        cur = "";
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export interface CsvImportResult {
  inserted: number;
  skipped: { line: number; reason: string }[];
}

export async function importBuildingsCsvAction(
  csv: string,
): Promise<BuildingActionResult<CsvImportResult>> {
  const g = await gate();
  if (!g.ok) return g;

  const text = csv.replace(/^﻿/, "").trim();
  if (!text) return { ok: false, error: "CSV is empty." };

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { ok: false, error: "CSV needs a header row plus at least one row of data." };
  }

  const headerCells = parseCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const requiredHeader = "name";
  const headerIdx: Record<string, number> = {};
  for (let i = 0; i < headerCells.length; i++) {
    headerIdx[headerCells[i]!] = i;
  }
  if (headerIdx[requiredHeader] === undefined) {
    return {
      ok: false,
      error: `Header row must include "name". Optional columns: locality, city, state, address, category.`,
    };
  }

  const society = await db.transaction(async (tx) => ensureDefaultSociety(tx));

  // Cache existing names (lower-cased) for this society so we skip dupes
  // without N round-trips.
  const existing = await db
    .select({ name: buildings.name })
    .from(buildings)
    .where(eq(buildings.societyId, society.id));
  const existingLower = new Set(existing.map((r) => r.name.toLowerCase()));

  const skipped: { line: number; reason: string }[] = [];
  const toInsert: {
    societyId: string;
    name: string;
    locality: string | null;
    city: string | null;
    state: string | null;
    address: string | null;
    category: string | null;
  }[] = [];
  const seenInCsv = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]!);
    const get = (key: string): string | null => {
      const idx = headerIdx[key];
      if (idx === undefined) return null;
      const v = (cells[idx] ?? "").trim();
      return v.length === 0 ? null : v;
    };
    const name = get("name");
    if (!name) {
      skipped.push({ line: i + 1, reason: "missing name" });
      continue;
    }
    const lower = name.toLowerCase();
    if (existingLower.has(lower)) {
      skipped.push({ line: i + 1, reason: `"${name}" already exists` });
      continue;
    }
    if (seenInCsv.has(lower)) {
      skipped.push({ line: i + 1, reason: `"${name}" duplicated in CSV` });
      continue;
    }
    seenInCsv.add(lower);
    toInsert.push({
      societyId: society.id,
      name,
      locality: get("locality"),
      city: get("city"),
      state: get("state"),
      address: get("address"),
      category: get("category"),
    });
  }

  if (toInsert.length > 0) {
    await db.insert(buildings).values(toInsert);
  }

  revalidateBuildings();
  revalidatePath(ROUTE);
  return { ok: true, data: { inserted: toInsert.length, skipped } };
}
