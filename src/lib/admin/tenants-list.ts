import "server-only";
import { and, asc, desc, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings, tenants, units, users } from "@/db/schema";

export interface AdminTenantRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  contact: string | null;
  active: boolean;
  unitId: string | null;
  buildingId: string | null;
  buildingName: string | null;
  wing: string | null;
  flat: string | null;
  needsPasswordSet: boolean;
  userId: string | null;
  createdAt: string;
}

export interface AdminTenantListInput {
  buildingId?: string;
  q?: string;
  active?: "true" | "false" | "all";
  page?: number;
  perPage?: number;
}

export interface AdminTenantListResult {
  rows: AdminTenantRow[];
  total: number;
  page: number;
  perPage: number;
}

const DEFAULT_PER_PAGE = 50;
const MAX_PER_PAGE = 200;

export async function listAdminTenants(input: AdminTenantListInput): Promise<AdminTenantListResult> {
  const page = Math.max(1, input.page ?? 1);
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, input.perPage ?? DEFAULT_PER_PAGE));
  const offset = (page - 1) * perPage;

  const conditions: SQL[] = [];
  // Hide Khidmat Guzars in archived buildings entirely. Tenants whose unit
  // is missing (legacy orphans) keep showing — they have no building to
  // gate on.
  conditions.push(or(isNull(units.buildingId), isNull(buildings.archivedAt))!);
  if (input.buildingId) {
    conditions.push(eq(units.buildingId, input.buildingId));
  }
  if (input.active && input.active !== "all") {
    conditions.push(eq(tenants.active, input.active === "true"));
  }
  if (input.q) {
    const q = `%${input.q}%`;
    conditions.push(
      or(
        ilike(tenants.name, q),
        ilike(tenants.email, q),
        ilike(units.flat, q),
        ilike(units.wing, q),
      )!,
    );
  }

  const whereExpr = conditions.length > 0 ? and(...conditions) : undefined;

  const rowsQ = db
    .select({
      id: tenants.id,
      name: tenants.name,
      email: tenants.email,
      phone: tenants.phone,
      contact: tenants.contact,
      active: tenants.active,
      unitId: tenants.unitId,
      buildingId: units.buildingId,
      buildingName: buildings.name,
      wing: units.wing,
      flat: units.flat,
      needsPasswordSet: users.needsPasswordSet,
      userId: tenants.userId,
      createdAt: tenants.createdAt,
    })
    .from(tenants)
    .leftJoin(units, eq(units.id, tenants.unitId))
    .leftJoin(buildings, eq(buildings.id, units.buildingId))
    .leftJoin(users, eq(users.id, tenants.userId));

  const rows = whereExpr
    ? await rowsQ
        .where(whereExpr)
        .orderBy(asc(buildings.name), asc(units.wing), asc(units.flat), desc(tenants.createdAt))
        .limit(perPage)
        .offset(offset)
    : await rowsQ
        .orderBy(asc(buildings.name), asc(units.wing), asc(units.flat), desc(tenants.createdAt))
        .limit(perPage)
        .offset(offset);

  // Count must mirror the row query's joins: archived-building filter
  // references both `units` AND `buildings`, so both leftJoins are needed.
  const countRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(tenants)
    .leftJoin(units, eq(units.id, tenants.unitId))
    .leftJoin(buildings, eq(buildings.id, units.buildingId))
    .where(whereExpr);
  const total = countRows[0]?.n ?? 0;

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      contact: r.contact,
      active: r.active,
      unitId: r.unitId,
      buildingId: r.buildingId,
      buildingName: r.buildingName,
      wing: r.wing,
      flat: r.flat,
      needsPasswordSet: r.needsPasswordSet ?? false,
      userId: r.userId,
      createdAt: String(r.createdAt),
    })),
    total,
    page,
    perPage,
  };
}
