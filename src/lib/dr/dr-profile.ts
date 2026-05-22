import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings, drs, tenants, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export interface DrProfile {
  userId: string;
  drId: string;
  fullName: string;
  contact: string;
  buildingId: string;
  buildingName: string;
  societyId: string;
}

/**
 * Returns the DR profile for the currently signed-in user, or null if the
 * caller isn't an active DR. DR identity is keyed on users.id — the linked
 * drs row carries building_id; we also pull the tenant row for contact info
 * since the old app sourced DR contact from drs.tenant.contact.
 */
export async function getDrProfileFromSession(): Promise<DrProfile | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const rows = await db
    .select({
      userId: users.id,
      role: users.role,
      fullName: users.fullName,
      userPhone: users.phone,
      drId: drs.id,
      drActive: drs.active,
      buildingId: buildings.id,
      buildingName: buildings.name,
      buildingArchivedAt: buildings.archivedAt,
      societyId: buildings.societyId,
      tenantContact: tenants.contact,
      tenantPhone: tenants.phone,
    })
    .from(users)
    .innerJoin(drs, eq(drs.userId, users.id))
    .innerJoin(buildings, eq(buildings.id, drs.buildingId))
    .leftJoin(tenants, eq(tenants.id, drs.tenantId))
    .where(eq(users.id, authUser.id))
    .limit(1);

  const r = rows[0];
  if (!r || r.role !== "dr" || !r.drActive) return null;
  // If the DR's building is archived, treat them as orphaned so the
  // dashboard refuses to render and middleware can bounce them out.
  if (r.buildingArchivedAt) return null;

  const contact = r.tenantContact ?? r.tenantPhone ?? r.userPhone ?? "";

  return {
    userId: r.userId,
    drId: r.drId,
    fullName: r.fullName,
    contact,
    buildingId: r.buildingId,
    buildingName: r.buildingName,
    societyId: r.societyId,
  };
}
