"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { drs, tenants, units, users } from "@/db/schema";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import {
  DEFAULT_PASSWORD,
  resetStaffPassword,
  staffEmail,
  type StaffMutationResult,
} from "@/lib/admin/staff-mutations";
import { createAdminClient } from "@/lib/supabase/admin";

const ROUTE = "/admin/staff/drs";

async function gate(): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getAdminProfileFromSession();
  if (!profile) return { ok: false, error: "Not authorized." };
  return { ok: true };
}

export async function createDrAction(input: {
  buildingId: string;
  tenantId: string;
  username: string;
  password?: string;
}): Promise<StaffMutationResult<{ tempPassword: string }>> {
  const g = await gate();
  if (!g.ok) return g;

  const username = input.username.trim();
  if (username.length < 2) return { ok: false, error: "Enter a username." };
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return { ok: false, error: "Username can only contain letters, digits, dot, dash, underscore." };
  }

  // Residency check (defense-in-depth — UI filters tenants by building).
  const residencyRows = await db
    .select({ id: tenants.id })
    .from(tenants)
    .innerJoin(units, eq(units.id, tenants.unitId))
    .where(and(eq(tenants.id, input.tenantId), eq(units.buildingId, input.buildingId)))
    .limit(1);
  if (residencyRows.length === 0) {
    return { ok: false, error: "Selected tenant doesn't live in that building." };
  }

  // Username uniqueness.
  const dupes = await db.execute<{ id: string }>(
    sql`select id from public.drs where lower(username) = lower(${username}) limit 1`,
  );
  if (dupes.length > 0) return { ok: false, error: `Username "${username}" is already taken.` };

  // ≤1 active DR per building (partial unique index drs_active_building_idx).
  const activeRows = await db
    .select({ id: drs.id })
    .from(drs)
    .where(and(eq(drs.buildingId, input.buildingId), eq(drs.active, true)))
    .limit(1);
  if (activeRows.length > 0) {
    return { ok: false, error: "This building already has an active DR. Retire the current one first." };
  }

  // Tenant name → DR full_name (matches the migrate-users convention).
  const tenantRows = await db
    .select({ name: tenants.name, phone: tenants.phone })
    .from(tenants)
    .where(eq(tenants.id, input.tenantId))
    .limit(1);
  const tenantRow = tenantRows[0];
  if (!tenantRow) return { ok: false, error: "Tenant not found." };

  const tempPassword = input.password?.trim() || DEFAULT_PASSWORD;
  const supabaseAdmin = createAdminClient();
  const email = staffEmail(username);

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role: "dr", synthetic_email: true },
  });
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Couldn't create auth user." };
  }
  const userId = data.user.id;

  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        role: "dr",
        username,
        fullName: tenantRow.name,
        phone: tenantRow.phone,
        active: true,
        needsPasswordSet: true,
        needsProfileConfirm: true,
        legacyBcryptHash: null,
      });

      await tx.insert(drs).values({
        tenantId: input.tenantId,
        buildingId: input.buildingId,
        username,
        passwordDigest: "",
        active: true,
        startedAt: new Date().toISOString(),
        endedAt: null,
        mustChangePassword: true,
        userId,
      });
    });
  } catch (e) {
    await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't save DR.",
    };
  }

  revalidatePath(ROUTE);
  return { ok: true, data: { tempPassword } };
}

export async function retireDrAction(input: {
  roleId: string;
}): Promise<StaffMutationResult> {
  const g = await gate();
  if (!g.ok) return g;

  const rows = await db
    .select({ userId: drs.userId, active: drs.active })
    .from(drs)
    .where(eq(drs.id, input.roleId))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "DR not found." };
  if (!row.active) return { ok: false, error: "DR is already retired." };

  await db.transaction(async (tx) => {
    await tx
      .update(drs)
      .set({ active: false, endedAt: new Date().toISOString() })
      .where(eq(drs.id, input.roleId));
    if (row.userId) {
      await tx.update(users).set({ active: false }).where(eq(users.id, row.userId));
    }
  });

  revalidatePath(ROUTE);
  return { ok: true };
}

export async function resetDrPasswordAction(input: {
  roleId: string;
}): Promise<StaffMutationResult<{ tempPassword: string }>> {
  const g = await gate();
  if (!g.ok) return g;
  const res = await resetStaffPassword({ role: "dr", roleId: input.roleId });
  if (res.ok) revalidatePath(ROUTE);
  return res;
}

// Used by the create form to populate the tenant dropdown once a building is picked.
export async function listTenantsForBuildingAction(buildingId: string): Promise<
  { id: string; label: string }[]
> {
  const g = await gate();
  if (!g.ok) return [];
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
    .where(and(eq(units.buildingId, buildingId), eq(tenants.active, true)));

  return rows
    .map((r) => ({
      id: r.id,
      label: `${r.name} — ${r.wing ? r.wing + "-" : ""}${r.flat ?? "?"}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

