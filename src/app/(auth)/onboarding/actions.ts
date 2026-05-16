"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { tenants, users } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { verifyToken } from "@/lib/auth/onboarding-token";
import {
  ensureBuilding,
  ensureDefaultSociety,
  ensureUnit,
  parseLocation,
} from "@/lib/tenants/ensure-unit";

const MIN_PASSWORD = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function setPassword(
  token: string,
  newPassword: string,
  confirmPassword: string,
): Promise<ActionResult> {
  const payload = verifyToken(token, "first_login");
  if (!payload) {
    return { ok: false, error: "Your first-login link has expired. Start over from sign-in." };
  }

  if (newPassword.length < MIN_PASSWORD) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD} characters.` };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "Passwords don't match." };
  }

  const admin = createAdminClient();
  const { error: updateError } = await admin.auth.admin.updateUserById(payload.uid, {
    password: newPassword,
  });
  if (updateError) {
    return { ok: false, error: "Couldn't set your password. Try again." };
  }

  await db
    .update(users)
    .set({ needsPasswordSet: false, legacyBcryptHash: null })
    .where(eq(users.id, payload.uid));

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: newPassword,
  });
  if (signInError) {
    return { ok: false, error: "Password saved. Please sign in again." };
  }

  const rows = await db
    .select({ role: users.role, needsProfileConfirm: users.needsProfileConfirm })
    .from(users)
    .where(eq(users.id, payload.uid))
    .limit(1);
  const row = rows[0];
  if (!row) redirect("/login");

  if (row.needsProfileConfirm) redirect("/onboarding/confirm-profile");
  redirect(`/${row.role}/dashboard`);
}

interface ConfirmProfileInput {
  fullName: string;
  phone: string;
  email: string;
  /** Tenant-only: "Building Name, Address" string. */
  location?: string;
  /** Tenant-only. */
  wing?: string;
  /** Tenant-only. */
  flat?: string;
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  // Drop India country code if present, then keep last 10.
  const withoutCc = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  const last10 = withoutCc.slice(-10);
  return last10.length === 10 ? last10 : null;
}

export async function confirmProfile(input: ConfirmProfileInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { ok: false, error: "Your session has expired. Please sign in again." };

  const fullName = input.fullName.trim();
  if (fullName.length < 2) return { ok: false, error: "Enter your full name." };

  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "Enter a valid 10-digit phone number." };

  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };

  const roleRows = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);
  const role = roleRows[0]?.role;
  if (!role) return { ok: false, error: "Your account could not be found." };

  // Tenant-only: update unit assignment if location/wing/flat changed.
  if (role === "tenant") {
    const tenantRows = await db
      .select({ tenantId: tenants.id })
      .from(tenants)
      .where(eq(tenants.userId, authUser.id))
      .limit(1);
    const tenantId = tenantRows[0]?.tenantId;
    if (!tenantId) return { ok: false, error: "No tenant record linked to your account." };

    const location = (input.location ?? "").trim();
    const wing = (input.wing ?? "").trim();
    const flat = (input.flat ?? "").trim();

    if (!location) return { ok: false, error: "Enter your building name and address." };
    if (!flat) return { ok: false, error: "Enter your flat number." };

    const parsed = parseLocation(location);
    if (!parsed) return { ok: false, error: "Enter a building name before the comma." };

    try {
      await db.transaction(async (tx) => {
        const society = await ensureDefaultSociety(tx);
        const building = await ensureBuilding(tx, society.id, parsed.name, parsed.address);
        const unit = await ensureUnit(tx, building.id, wing, flat);
        await tx
          .update(tenants)
          .set({ unitId: unit.id, email, phone })
          .where(eq(tenants.id, tenantId));
      });
    } catch {
      return { ok: false, error: "Couldn't save your details. Try again." };
    }
  }

  await db
    .update(users)
    .set({ fullName, phone, needsProfileConfirm: false })
    .where(eq(users.id, authUser.id));

  // Update auth.users.email if it changed (synthetic → real).
  const admin = createAdminClient();
  const currentEmail = (authUser.email ?? "").toLowerCase();
  const previousMeta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const nextMeta = {
    ...previousMeta,
    synthetic_email: false,
    ...(role === "tenant" ? { location_edited: true } : {}),
  };

  if (currentEmail !== email) {
    const { error: emailError } = await admin.auth.admin.updateUserById(authUser.id, {
      email,
      email_confirm: true,
      user_metadata: nextMeta,
    });
    if (emailError) {
      // Most common cause: email already in use by another auth.users row.
      return {
        ok: false,
        error: emailError.message.toLowerCase().includes("already")
          ? "That email is already linked to another account."
          : "Couldn't save your email. Try a different one.",
      };
    }
  } else {
    await admin.auth.admin.updateUserById(authUser.id, { user_metadata: nextMeta });
  }

  redirect(`/${role}/dashboard`);
}
