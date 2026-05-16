import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings, societies, units } from "@/db/schema";

export const DEFAULT_SOCIETY = "Default Society";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function ensureDefaultSociety(tx: Tx) {
  const existing = await tx
    .select({ id: societies.id })
    .from(societies)
    .where(sql`lower(${societies.name}) = lower(${DEFAULT_SOCIETY})`)
    .limit(1);
  if (existing[0]) return existing[0];
  const inserted = await tx
    .insert(societies)
    .values({ name: DEFAULT_SOCIETY })
    .returning({ id: societies.id });
  return inserted[0]!;
}

export async function ensureBuilding(
  tx: Tx,
  societyId: string,
  name: string,
  address: string | null,
) {
  const existing = await tx
    .select({ id: buildings.id })
    .from(buildings)
    .where(
      and(
        eq(buildings.societyId, societyId),
        sql`lower(${buildings.name}) = lower(${name})`,
      ),
    )
    .limit(1);
  if (existing[0]) return existing[0];
  const inserted = await tx
    .insert(buildings)
    .values({ societyId, name, address })
    .returning({ id: buildings.id });
  return inserted[0]!;
}

export async function ensureUnit(tx: Tx, buildingId: string, wing: string, flat: string) {
  const existing = await tx
    .select({ id: units.id })
    .from(units)
    .where(
      and(
        eq(units.buildingId, buildingId),
        sql`lower(coalesce(${units.wing}, '')) = lower(${wing})`,
        sql`lower(coalesce(${units.flat}, '')) = lower(${flat})`,
      ),
    )
    .limit(1);
  if (existing[0]) return existing[0];
  const inserted = await tx
    .insert(units)
    .values({ buildingId, wing: wing || null, flat: flat || null })
    .returning({ id: units.id });
  return inserted[0]!;
}

/** Parse a "Building Name, Address" string into its parts. */
export function parseLocation(input: string): { name: string; address: string | null } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const [namePart, ...rest] = trimmed.split(",");
  const name = namePart.trim();
  if (!name) return null;
  const address = rest.join(",").trim() || null;
  return { name, address };
}
