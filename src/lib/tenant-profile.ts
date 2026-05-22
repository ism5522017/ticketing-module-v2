import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings, tenants, units, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export interface TenantProfile {
  userId: string;
  tenantId: string;
  email: string;
  fullName: string;
  contact: string;
  /** "Building Name, Address" — wire format compatible with the old app. */
  location: string;
  wing: string;
  flat: string;
  buildingName: string;
  buildingId: string;
  unitId: string;
  societyId: string;
  /** True if the tenant has edited their location/wing/flat since onboarding. */
  locationEdited: boolean;
}

/**
 * Builds the "currentUser"-shaped profile expected by tenant flows, by
 * joining users + tenants + units + buildings. Returns null if the signed-in
 * user isn't a tenant, has no unit assigned, or doesn't exist in public.users.
 */
export async function getTenantProfileFromSession(): Promise<TenantProfile | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const locationEdited =
    (authUser.user_metadata as { location_edited?: boolean } | null)?.location_edited === true;

  const rows = await db
    .select({
      userId: users.id,
      role: users.role,
      fullName: users.fullName,
      phone: users.phone,
      tenantId: tenants.id,
      tenantEmail: tenants.email,
      tenantContact: tenants.contact,
      unitId: units.id,
      wing: units.wing,
      flat: units.flat,
      buildingId: buildings.id,
      buildingName: buildings.name,
      buildingAddress: buildings.address,
      buildingArchivedAt: buildings.archivedAt,
      societyId: buildings.societyId,
    })
    .from(users)
    .innerJoin(tenants, eq(tenants.userId, users.id))
    .leftJoin(units, eq(units.id, tenants.unitId))
    .leftJoin(buildings, eq(buildings.id, units.buildingId))
    .where(eq(users.id, authUser.id))
    .limit(1);

  const r = rows[0];
  if (!r || r.role !== "tenant") return null;
  if (!r.buildingId || !r.unitId || !r.societyId) return null;
  // If the Khidmat Guzar's building has been archived, treat them as
  // orphaned — dashboard refuses to render so they get bounced out.
  if (r.buildingArchivedAt) return null;

  const location = r.buildingAddress
    ? `${r.buildingName}, ${r.buildingAddress}`
    : r.buildingName ?? "";

  return {
    userId: r.userId,
    tenantId: r.tenantId,
    email: r.tenantEmail,
    fullName: r.fullName,
    contact: r.tenantContact ?? r.phone ?? "",
    location,
    wing: r.wing ?? "",
    flat: r.flat ?? "",
    buildingName: r.buildingName ?? "",
    buildingId: r.buildingId,
    unitId: r.unitId,
    societyId: r.societyId,
    locationEdited,
  };
}
