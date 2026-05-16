import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings, units } from "@/db/schema";

export interface UnitRow {
  id: string;
  buildingId: string;
  buildingName: string;
  wing: string | null;
  flat: string | null;
  floor: string | null;
  unitType: string | null;
  residentName: string | null;
}

/**
 * Read-only units lookup for admin forms (tenant create unit dropdown, DR
 * residency check). Filter by building when known. Ordered building name →
 * wing → flat (matches the old StaffUnitsController).
 */
export async function listUnits(buildingId?: string): Promise<UnitRow[]> {
  const base = db
    .select({
      id: units.id,
      buildingId: units.buildingId,
      buildingName: buildings.name,
      wing: units.wing,
      flat: units.flat,
      floor: units.floor,
      unitType: units.unitType,
      residentName: units.residentName,
    })
    .from(units)
    .innerJoin(buildings, eq(buildings.id, units.buildingId));

  const rows = buildingId
    ? await base.where(eq(units.buildingId, buildingId)).orderBy(asc(units.wing), asc(units.flat))
    : await base.orderBy(asc(buildings.name), asc(units.wing), asc(units.flat));

  return rows;
}
