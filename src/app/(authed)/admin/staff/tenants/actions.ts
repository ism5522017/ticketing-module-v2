"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { buildings, tenants, units, users } from "@/db/schema";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import {
  DEFAULT_PASSWORD,
  type StaffMutationResult,
} from "@/lib/admin/staff-mutations";
import { createAdminClient } from "@/lib/supabase/admin";

const ROUTE = "/admin/staff/tenants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function gate(): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getAdminProfileFromSession();
  if (!profile) return { ok: false, error: "Not authorized." };
  return { ok: true };
}

/**
 * Mirrors the old Rails TenantsController#normalize_phone:
 *   strip non-digits → drop "91" country code (if 12 digits) → last 10.
 */
function normalizePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const withoutCc = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  const last10 = withoutCc.slice(-10);
  return last10.length === 10 ? last10 : null;
}

function slugForEmail(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

/**
 * Synthesize a stable email when the admin leaves it blank during create.
 * Format: `{flat-slug}.{building-slug}@deh.local` (matches the old app).
 */
function synthesizeTenantEmail(buildingName: string, flat: string | null): string {
  const flatSlug = slugForEmail(flat ?? "x");
  const buildingSlug = slugForEmail(buildingName);
  return `${flatSlug}.${buildingSlug}@deh.local`;
}

interface CreateTenantInput {
  buildingId: string;
  unitId: string;
  name: string;
  email?: string;
  phone?: string;
  contact?: string;
  password?: string;
}

export async function createTenantAction(
  input: CreateTenantInput,
): Promise<StaffMutationResult<{ tempPassword: string; email: string }>> {
  const g = await gate();
  if (!g.ok) return g;

  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Enter the tenant's name." };

  // Validate unit belongs to building (defense-in-depth — UI filters by building).
  const unitRows = await db
    .select({
      id: units.id,
      flat: units.flat,
      buildingId: units.buildingId,
      buildingName: buildings.name,
    })
    .from(units)
    .innerJoin(buildings, eq(buildings.id, units.buildingId))
    .where(eq(units.id, input.unitId))
    .limit(1);
  const unitRow = unitRows[0];
  if (!unitRow) return { ok: false, error: "Unit not found." };
  if (unitRow.buildingId !== input.buildingId) {
    return { ok: false, error: "Selected unit doesn't belong to that building." };
  }

  const rawEmail = (input.email ?? "").trim().toLowerCase();
  let email = rawEmail;
  if (email) {
    if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email or leave blank." };
  } else {
    email = synthesizeTenantEmail(unitRow.buildingName, unitRow.flat);
  }

  const dupes = await db.execute<{ id: string }>(
    sql`select id from public.tenants where lower(email) = lower(${email}) limit 1`,
  );
  if (dupes.length > 0) {
    return { ok: false, error: `A tenant with email "${email}" already exists.` };
  }

  const phone = normalizePhone(input.phone);
  if (input.phone && !phone) {
    return { ok: false, error: "Enter a valid 10-digit phone number or leave blank." };
  }

  const tempPassword = input.password?.trim() || DEFAULT_PASSWORD;
  const supabaseAdmin = createAdminClient();
  const synthetic = email.endsWith(".local");

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role: "tenant", synthetic_email: synthetic },
  });
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Couldn't create auth user." };
  }
  const userId = data.user.id;

  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        role: "tenant",
        username: null,
        fullName: name,
        phone,
        active: true,
        needsPasswordSet: true,
        needsProfileConfirm: true,
        legacyBcryptHash: null,
      });
      await tx.insert(tenants).values({
        name,
        email,
        contact: input.contact?.trim() || null,
        passwordDigest: "",
        unitId: input.unitId,
        mustChangePassword: true,
        phone,
        active: true,
        userId,
      });
    });
  } catch (e) {
    await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't save tenant." };
  }

  revalidatePath(ROUTE);
  return { ok: true, data: { tempPassword, email } };
}

interface UpdateTenantInput {
  tenantId: string;
  name?: string;
  email?: string;
  phone?: string;
  contact?: string;
  unitId?: string;
}

export async function updateTenantAction(
  input: UpdateTenantInput,
): Promise<StaffMutationResult> {
  const g = await gate();
  if (!g.ok) return g;

  const rows = await db
    .select({
      id: tenants.id,
      userId: tenants.userId,
      email: tenants.email,
      unitId: tenants.unitId,
    })
    .from(tenants)
    .where(eq(tenants.id, input.tenantId))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "Tenant not found." };

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 2) return { ok: false, error: "Enter the tenant's name." };
    patch.name = name;
  }
  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    if (email && !EMAIL_RE.test(email)) return { ok: false, error: "Invalid email." };
    if (email && email !== row.email) {
      const dupes = await db.execute<{ id: string }>(
        sql`select id from public.tenants where lower(email) = lower(${email}) and id != ${input.tenantId} limit 1`,
      );
      if (dupes.length > 0) return { ok: false, error: "Email already in use." };
      patch.email = email;
    } else if (email) {
      patch.email = email;
    }
  }
  if (input.phone !== undefined) {
    const phone = normalizePhone(input.phone);
    if (input.phone && !phone) {
      return { ok: false, error: "Enter a valid 10-digit phone number." };
    }
    patch.phone = phone;
  }
  if (input.contact !== undefined) patch.contact = input.contact.trim() || null;
  if (input.unitId !== undefined && input.unitId !== row.unitId) {
    const unitExists = await db
      .select({ id: units.id })
      .from(units)
      .where(eq(units.id, input.unitId))
      .limit(1);
    if (unitExists.length === 0) return { ok: false, error: "Unit not found." };
    patch.unitId = input.unitId;
  }

  if (Object.keys(patch).length === 0) return { ok: true };

  await db.transaction(async (tx) => {
    await tx.update(tenants).set(patch).where(eq(tenants.id, input.tenantId));
    if (row.userId && (patch.name !== undefined || patch.phone !== undefined)) {
      const userPatch: Record<string, unknown> = {};
      if (patch.name !== undefined) userPatch.fullName = patch.name;
      if (patch.phone !== undefined) userPatch.phone = patch.phone;
      await tx.update(users).set(userPatch).where(eq(users.id, row.userId));
    }
  });

  // Sync auth.users email if it changed and the user_id is linked.
  if (row.userId && patch.email !== undefined) {
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.auth.admin
      .updateUserById(row.userId, { email: patch.email as string, email_confirm: true })
      .catch(() => {
        // Best-effort. If it collides, the tenants.email update above is already
        // committed — caller can retry the email change after fixing the conflict.
      });
  }

  revalidatePath(ROUTE);
  return { ok: true };
}

export async function setTenantActiveAction(input: {
  tenantId: string;
  active: boolean;
}): Promise<StaffMutationResult> {
  const g = await gate();
  if (!g.ok) return g;
  const rows = await db
    .select({ userId: tenants.userId })
    .from(tenants)
    .where(eq(tenants.id, input.tenantId))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "Tenant not found." };

  await db.transaction(async (tx) => {
    await tx.update(tenants).set({ active: input.active }).where(eq(tenants.id, input.tenantId));
    if (row.userId) {
      await tx.update(users).set({ active: input.active }).where(eq(users.id, row.userId));
    }
  });
  revalidatePath(ROUTE);
  return { ok: true };
}

export async function resetTenantPasswordAction(input: {
  tenantId: string;
}): Promise<StaffMutationResult<{ tempPassword: string }>> {
  const g = await gate();
  if (!g.ok) return g;
  const rows = await db
    .select({ userId: tenants.userId })
    .from(tenants)
    .where(eq(tenants.id, input.tenantId))
    .limit(1);
  const userId = rows[0]?.userId;
  if (!userId) return { ok: false, error: "Tenant has no linked auth user. Re-run migrate-users." };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: DEFAULT_PASSWORD,
  });
  if (error) return { ok: false, error: error.message };
  await db
    .update(users)
    .set({ needsPasswordSet: true, legacyBcryptHash: null })
    .where(eq(users.id, userId));
  revalidatePath(ROUTE);
  return { ok: true, data: { tempPassword: DEFAULT_PASSWORD } };
}

// Used by the create/edit forms to load the unit dropdown for a chosen building.
export async function listUnitsForBuildingAction(buildingId: string): Promise<
  { id: string; label: string }[]
> {
  const g = await gate();
  if (!g.ok) return [];
  const rows = await db
    .select({ id: units.id, wing: units.wing, flat: units.flat })
    .from(units)
    .where(eq(units.buildingId, buildingId));
  return rows
    .map((r) => ({
      id: r.id,
      label: `${r.wing ? r.wing + "-" : ""}${r.flat ?? "?"}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
