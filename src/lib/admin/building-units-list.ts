import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings, units } from "@/db/schema";

export interface BuildingUnitRow {
  id: string;
  wing: string | null;
  flat: string | null;
  floor: string | null;
  unitType: string | null;
  tenantCount: number;
  ticketCount: number;
  createdAt: string;
}

/**
 * Correlated subqueries — same pattern as buildings-list.ts. Literal
 * `public.*` names because Drizzle drops table qualifiers when an `sql`
 * chunk is emitted inside a `.select()` projection.
 */
const tenantCountSql = sql<number>`(select count(*)::int from public.tenants where public.tenants.unit_id = public.units.id and public.tenants.active)`;
const ticketCountSql = sql<number>`(select count(*)::int from public.tickets where public.tickets.unit_id = public.units.id)`;

export interface BuildingHeader {
  id: string;
  name: string;
  locality: string | null;
  city: string | null;
  archivedAt: string | null;
}

export async function getBuildingHeader(buildingId: string): Promise<BuildingHeader | null> {
  const rows = await db
    .select({
      id: buildings.id,
      name: buildings.name,
      locality: buildings.locality,
      city: buildings.city,
      archivedAt: buildings.archivedAt,
    })
    .from(buildings)
    .where(eq(buildings.id, buildingId))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    locality: r.locality,
    city: r.city,
    archivedAt: r.archivedAt ? String(r.archivedAt) : null,
  };
}

export async function listBuildingUnits(buildingId: string): Promise<BuildingUnitRow[]> {
  const rows = await db
    .select({
      id: units.id,
      wing: units.wing,
      flat: units.flat,
      floor: units.floor,
      unitType: units.unitType,
      tenantCount: tenantCountSql,
      ticketCount: ticketCountSql,
      createdAt: units.createdAt,
    })
    .from(units)
    .where(eq(units.buildingId, buildingId))
    .orderBy(asc(units.wing), asc(units.flat));

  return rows.map((r) => ({
    id: r.id,
    wing: r.wing,
    flat: r.flat,
    floor: r.floor,
    unitType: r.unitType,
    tenantCount: Number(r.tenantCount ?? 0),
    ticketCount: Number(r.ticketCount ?? 0),
    createdAt: String(r.createdAt),
  }));
}
