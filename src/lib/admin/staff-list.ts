import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { admins, buildings, drs, managers, tenants, units, users } from "@/db/schema";

export interface StaffListRow {
  id: string;
  userId: string | null;
  username: string;
  fullName: string;
  active: boolean;
  needsPasswordSet: boolean;
  createdAt: string;
}

export async function listAdmins(): Promise<StaffListRow[]> {
  const rows = await db
    .select({
      id: admins.id,
      userId: admins.userId,
      username: admins.username,
      fullName: users.fullName,
      adminActive: admins.active,
      userActive: users.active,
      needsPasswordSet: users.needsPasswordSet,
      createdAt: admins.createdAt,
    })
    .from(admins)
    .leftJoin(users, eq(users.id, admins.userId))
    .orderBy(asc(admins.username));

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    username: r.username,
    fullName: r.fullName ?? "—",
    active: r.adminActive && (r.userActive ?? true),
    needsPasswordSet: r.needsPasswordSet ?? false,
    createdAt: String(r.createdAt),
  }));
}

export async function listManagers(): Promise<StaffListRow[]> {
  const rows = await db
    .select({
      id: managers.id,
      userId: managers.userId,
      username: managers.username,
      fullName: users.fullName,
      managerActive: managers.active,
      userActive: users.active,
      needsPasswordSet: users.needsPasswordSet,
      createdAt: managers.createdAt,
    })
    .from(managers)
    .leftJoin(users, eq(users.id, managers.userId))
    .orderBy(asc(managers.username));

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    username: r.username,
    fullName: r.fullName ?? "—",
    active: r.managerActive && (r.userActive ?? true),
    needsPasswordSet: r.needsPasswordSet ?? false,
    createdAt: String(r.createdAt),
  }));
}

export interface DrListRow {
  id: string;
  userId: string | null;
  username: string;
  tenantName: string;
  buildingId: string;
  buildingName: string;
  active: boolean;
  startedAt: string;
  endedAt: string | null;
  needsPasswordSet: boolean;
}

export async function listDrs(): Promise<DrListRow[]> {
  const rows = await db
    .select({
      id: drs.id,
      userId: drs.userId,
      username: drs.username,
      tenantName: tenants.name,
      buildingId: drs.buildingId,
      buildingName: buildings.name,
      drActive: drs.active,
      startedAt: drs.startedAt,
      endedAt: drs.endedAt,
      needsPasswordSet: users.needsPasswordSet,
    })
    .from(drs)
    .leftJoin(tenants, eq(tenants.id, drs.tenantId))
    .leftJoin(buildings, eq(buildings.id, drs.buildingId))
    .leftJoin(users, eq(users.id, drs.userId))
    .orderBy(asc(buildings.name));

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    username: r.username,
    tenantName: r.tenantName ?? "—",
    buildingId: r.buildingId,
    buildingName: r.buildingName ?? "—",
    active: r.drActive,
    startedAt: String(r.startedAt),
    endedAt: r.endedAt ? String(r.endedAt) : null,
    needsPasswordSet: r.needsPasswordSet ?? false,
  }));
}

export interface BuildingTenant {
  id: string;
  name: string;
  flat: string | null;
  wing: string | null;
  active: boolean;
}

export async function listTenantsForBuilding(buildingId: string): Promise<BuildingTenant[]> {
  const rows = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      flat: units.flat,
      wing: units.wing,
      active: tenants.active,
    })
    .from(tenants)
    .innerJoin(units, eq(units.id, tenants.unitId))
    .where(eq(units.buildingId, buildingId))
    .orderBy(asc(units.flat));
  return rows;
}
