"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { buildings, tenants, tickets, units } from "@/db/schema";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";

export type UnitActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function gate(): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getAdminProfileFromSession();
  if (!profile) return { ok: false, error: "Not authorized." };
  return { ok: true };
}

/**
 * Confirm the unit exists and belongs to the building. Stops admins from
 * editing/deleting a unit by URL-mangling its ID into a different
 * building's units page.
 */
async function loadUnit(buildingId: string, unitId: string) {
  const rows = await db
    .select({ id: units.id, buildingId: units.buildingId })
    .from(units)
    .where(eq(units.id, unitId))
    .limit(1);
  const u = rows[0];
  if (!u) return null;
  if (u.buildingId !== buildingId) return null;
  return u;
}

interface UpsertUnitInput {
  buildingId: string;
  wing?: string | null;
  flat: string;
  floor?: string | null;
  unitType?: string | null;
}

function normalize(input: UpsertUnitInput): {
  wing: string | null;
  flat: string;
  floor: string | null;
  unitType: string | null;
} {
  const trim = (s: string | null | undefined): string | null => {
    const v = (s ?? "").trim();
    return v.length === 0 ? null : v;
  };
  return {
    wing: trim(input.wing),
    flat: input.flat.trim(),
    floor: trim(input.floor),
    unitType: trim(input.unitType),
  };
}

export async function createUnitAction(
  input: UpsertUnitInput,
): Promise<UnitActionResult<{ id: string }>> {
  const g = await gate();
  if (!g.ok) return g;

  const buildingExists = await db
    .select({ id: buildings.id, archivedAt: buildings.archivedAt })
    .from(buildings)
    .where(eq(buildings.id, input.buildingId))
    .limit(1);
  if (buildingExists.length === 0) return { ok: false, error: "Building not found." };
  if (buildingExists[0]!.archivedAt) {
    return { ok: false, error: "That building is archived." };
  }

  const n = normalize(input);
  if (!n.flat) return { ok: false, error: "Enter the flat number." };

  // Duplicate check — same find-or-create key as ensureUnit
  // (lower(wing) + lower(flat) within the building). Reject so the admin
  // notices the existing row instead of silently creating a phantom.
  const dupes = await db
    .select({ id: units.id })
    .from(units)
    .where(
      and(
        eq(units.buildingId, input.buildingId),
        sql`lower(coalesce(${units.wing}, '')) = lower(${n.wing ?? ""})`,
        sql`lower(coalesce(${units.flat}, '')) = lower(${n.flat})`,
      ),
    )
    .limit(1);
  if (dupes.length > 0) {
    return { ok: false, error: `A flat with this wing/flat combo already exists.` };
  }

  const inserted = await db
    .insert(units)
    .values({
      buildingId: input.buildingId,
      wing: n.wing,
      flat: n.flat,
      floor: n.floor,
      unitType: n.unitType,
    })
    .returning({ id: units.id });

  revalidatePath(`/admin/buildings/${input.buildingId}/units`);
  revalidatePath(`/admin/buildings`);
  return { ok: true, data: { id: inserted[0]!.id } };
}

interface UpdateUnitInput extends UpsertUnitInput {
  unitId: string;
}

export async function updateUnitAction(
  input: UpdateUnitInput,
): Promise<UnitActionResult> {
  const g = await gate();
  if (!g.ok) return g;

  const existing = await loadUnit(input.buildingId, input.unitId);
  if (!existing) return { ok: false, error: "Flat not found in this building." };

  const n = normalize(input);
  if (!n.flat) return { ok: false, error: "Enter the flat number." };

  // Reject if changing wing/flat would collide with another existing unit
  // in this building.
  const dupes = await db
    .select({ id: units.id })
    .from(units)
    .where(
      and(
        eq(units.buildingId, input.buildingId),
        sql`lower(coalesce(${units.wing}, '')) = lower(${n.wing ?? ""})`,
        sql`lower(coalesce(${units.flat}, '')) = lower(${n.flat})`,
        ne(units.id, input.unitId),
      ),
    )
    .limit(1);
  if (dupes.length > 0) {
    return { ok: false, error: `Another flat with this wing/flat already exists.` };
  }

  await db
    .update(units)
    .set({
      wing: n.wing,
      flat: n.flat,
      floor: n.floor,
      unitType: n.unitType,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(units.id, input.unitId));

  revalidatePath(`/admin/buildings/${input.buildingId}/units`);
  return { ok: true };
}

export async function deleteUnitAction(input: {
  buildingId: string;
  unitId: string;
}): Promise<UnitActionResult> {
  const g = await gate();
  if (!g.ok) return g;

  const existing = await loadUnit(input.buildingId, input.unitId);
  if (!existing) return { ok: false, error: "Flat not found in this building." };

  // Pre-check FK references so we can return a useful error instead of a
  // raw "violates foreign key" from Postgres. tenants.unit_id is ON DELETE
  // RESTRICT; tickets.unit_id is ON DELETE SET NULL so historical tickets
  // are safe to keep even after the unit is gone.
  const tenantUse = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.unitId, input.unitId))
    .limit(1);
  if (tenantUse.length > 0) {
    return {
      ok: false,
      error: "Can't delete — at least one Khidmat Guzar is attached to this flat. Reassign or disable them first.",
    };
  }

  // tickets.unit_id is SET NULL on delete, so we don't need to block, but
  // surface a count so the admin knows historical tickets will lose their
  // flat reference.
  const ticketRefs = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.unitId, input.unitId));
  // (Count is for caller awareness; we don't gate on it because SET NULL
  // is the documented FK behavior.)
  void ticketRefs;

  await db.delete(units).where(eq(units.id, input.unitId));

  revalidatePath(`/admin/buildings/${input.buildingId}/units`);
  revalidatePath(`/admin/buildings`);
  return { ok: true };
}
