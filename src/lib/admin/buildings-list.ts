import "server-only";
import { asc, desc, eq, isNotNull, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings, tickets, units } from "@/db/schema";

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

function orderClause(sort: BuildingSort): SQL {
  switch (sort) {
    case "name_desc":
      return desc(buildings.name);
    case "created_desc":
      return desc(buildings.createdAt);
    case "created_asc":
      return asc(buildings.createdAt);
    case "units_desc":
      return sql`unit_count desc nulls last`;
    case "units_asc":
      return sql`unit_count asc nulls last`;
    case "tickets_desc":
      return sql`ticket_count desc nulls last`;
    case "tickets_asc":
      return sql`ticket_count asc nulls last`;
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

  const whereClause = conditions.length === 0
    ? sql`true`
    : sql.join(conditions, sql` and `);

  const rows = await db.execute<{
    id: string;
    name: string;
    locality: string | null;
    city: string | null;
    state: string | null;
    address: string | null;
    category: string | null;
    code: string | null;
    unit_count: number;
    ticket_count: number;
    created_at: string;
    archived_at: string | null;
  }>(
    sql`
      select
        b.id,
        b.name,
        b.locality,
        b.city,
        b.state,
        b.address,
        b.category,
        b.code,
        coalesce(u.unit_count, 0)::int as unit_count,
        coalesce(t.ticket_count, 0)::int as ticket_count,
        b.created_at,
        b.archived_at
      from ${buildings} b
      left join (
        select building_id, count(*)::int as unit_count
        from ${units}
        group by building_id
      ) u on u.building_id = b.id
      left join (
        select building_id, count(*)::int as ticket_count
        from ${tickets}
        where building_id is not null
        group by building_id
      ) t on t.building_id = b.id
      where ${whereClause}
      order by ${orderClause(sort)}
    `,
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    locality: r.locality,
    city: r.city,
    state: r.state,
    address: r.address,
    category: r.category,
    code: r.code,
    unitCount: r.unit_count,
    ticketCount: r.ticket_count,
    createdAt: String(r.created_at),
    archivedAt: r.archived_at ? String(r.archived_at) : null,
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
