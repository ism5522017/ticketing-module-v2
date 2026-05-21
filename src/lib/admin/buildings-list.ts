import "server-only";
import { and, asc, desc, eq, isNotNull, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings } from "@/db/schema";

export interface AdminBuildingRow {
  id: string;
  name: string;
  locality: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  category: string | null;
  code: string | null;
  unitCount: number;
  ticketCount: number;
  createdAt: string;
  archivedAt: string | null;
}

export type BuildingSort =
  | "name_asc"
  | "name_desc"
  | "created_desc"
  | "created_asc"
  | "units_desc"
  | "units_asc"
  | "tickets_desc"
  | "tickets_asc";

export interface ListBuildingsParams {
  /** "active" hides archived, "archived" shows only archived, "all" shows both. */
  status?: "active" | "archived" | "all";
  city?: string;
  locality?: string;
  sort?: BuildingSort;
}

/**
 * Correlated subqueries for the unit/ticket counts. Literal `public.*`
 * names because Drizzle drops table qualifiers when an `sql` chunk is
 * emitted inside a `.select()` projection — `${units.buildingId} =
 * ${buildings.id}` would collapse to `"building_id" = "id"` and the
 * subquery would resolve both columns against `units`, returning 0.
 */
const unitCountSql = sql<number>`(select count(*)::int from public.units where public.units.building_id = public.buildings.id)`;
const ticketCountSql = sql<number>`(select count(*)::int from public.tickets where public.tickets.building_id = public.buildings.id)`;

function orderClause(sort: BuildingSort): SQL {
  switch (sort) {
    case "name_desc":
      return desc(buildings.name);
    case "created_desc":
      return desc(buildings.createdAt);
    case "created_asc":
      return asc(buildings.createdAt);
    case "units_desc":
      return sql`${unitCountSql} desc nulls last`;
    case "units_asc":
      return sql`${unitCountSql} asc nulls last`;
    case "tickets_desc":
      return sql`${ticketCountSql} desc nulls last`;
    case "tickets_asc":
      return sql`${ticketCountSql} asc nulls last`;
    case "name_asc":
    default:
      return asc(buildings.name);
  }
}

export async function listAdminBuildings(
  params: ListBuildingsParams = {},
): Promise<AdminBuildingRow[]> {
  const status = params.status ?? "active";
  const sort = params.sort ?? "name_asc";

  const conditions: SQL[] = [];
  if (status === "active") conditions.push(isNull(buildings.archivedAt));
  if (status === "archived") conditions.push(isNotNull(buildings.archivedAt));
  if (params.city) conditions.push(eq(buildings.city, params.city));
  if (params.locality) conditions.push(eq(buildings.locality, params.locality));

  const rows = await db
    .select({
      id: buildings.id,
      name: buildings.name,
      locality: buildings.locality,
      city: buildings.city,
      state: buildings.state,
      address: buildings.address,
      category: buildings.category,
      code: buildings.code,
      unitCount: unitCountSql,
      ticketCount: ticketCountSql,
      createdAt: buildings.createdAt,
      archivedAt: buildings.archivedAt,
    })
    .from(buildings)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderClause(sort));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    locality: r.locality,
    city: r.city,
    state: r.state,
    address: r.address,
    category: r.category,
    code: r.code,
    unitCount: Number(r.unitCount ?? 0),
    ticketCount: Number(r.ticketCount ?? 0),
    createdAt: String(r.createdAt),
    archivedAt: r.archivedAt ? String(r.archivedAt) : null,
  }));
}

/** Distinct city/locality values for filter dropdowns (active rows only). */
export async function listBuildingLocations(): Promise<{
  cities: string[];
  localities: string[];
}> {
  const rows = await db
    .select({ city: buildings.city, locality: buildings.locality })
    .from(buildings)
    .where(isNull(buildings.archivedAt));

  const cities = new Set<string>();
  const localities = new Set<string>();
  for (const r of rows) {
    if (r.city) cities.add(r.city);
    if (r.locality) localities.add(r.locality);
  }
  return {
    cities: Array.from(cities).sort(),
    localities: Array.from(localities).sort(),
  };
}
