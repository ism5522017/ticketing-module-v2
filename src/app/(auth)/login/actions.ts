"use server";

import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { authenticateWithPassword } from "@/lib/auth/legacy-rehash";
import { signToken, verifyToken, type Role } from "@/lib/auth/onboarding-token";

export type ResolveResult =
  | { status: "first_login"; setPasswordPath: string }
  | { status: "has_password"; continuationToken: string }
  | { status: "error"; error: string };

export type SignInResult =
  | { status: "ok" }
  | { status: "error"; error: string };

const GENERIC_RESOLVE_ERROR = "No account matches those details.";
const GENERIC_SIGN_IN_ERROR = "Invalid login. Check your details and try again.";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const USERNAME_RE = /^[A-Za-z0-9._-]{2,40}$/;

type ResolvedUser = Record<string, unknown> & {
  id: string;
  email: string;
  role: Role;
  needs_password_set: boolean;
  active: boolean;
};

async function lookupTenant(buildingId: string, flat: string): Promise<ResolvedUser | null> {
  const rows = await db.execute<ResolvedUser>(
    sql`
      select u.id, au.email, u.role::text as role,
             u.needs_password_set, u.active
      from public.users u
      join auth.users au on au.id = u.id
      join public.tenants t on t.user_id = u.id
      join public.units un on un.id = t.unit_id
      where un.building_id = ${buildingId}::uuid
        and lower(un.flat) = lower(${flat})
        and u.role = 'tenant'
        and u.active
      limit 1
    `,
  );
  return rows[0] ?? null;
}

async function lookupStaff(input: string): Promise<ResolvedUser | null> {
  const username = input.trim();
  if (!USERNAME_RE.test(username)) return null;

  const rows = await db.execute<ResolvedUser>(
    sql`
      select u.id, au.email, u.role::text as role,
             u.needs_password_set, u.active
      from public.users u
      join auth.users au on au.id = u.id
      where lower(u.username) = lower(${username})
        and u.role in ('admin','manager','dr')
        and u.active
      limit 1
    `,
  );
  return rows[0] ?? null;
}

function resolveForUser(user: ResolvedUser): ResolveResult {
  if (user.needs_password_set) {
    const token = signToken(
      { type: "first_login", uid: user.id, email: user.email, role: user.role },
      60 * 15,
    );
    return {
      status: "first_login",
      setPasswordPath: `/onboarding/set-password?token=${encodeURIComponent(token)}`,
    };
  }

  const continuationToken = signToken(
    { type: "login_continue", uid: user.id, email: user.email, role: user.role },
    60 * 5,
  );
  return { status: "has_password", continuationToken };
}

export async function resolveTenantLogin(
  buildingId: string,
  flat: string,
): Promise<ResolveResult> {
  if (!UUID_RE.test(buildingId.trim())) {
    return { status: "error", error: "Please pick your building from the list." };
  }
  if (!flat.trim()) {
    return { status: "error", error: "Enter your flat number." };
  }

  const user = await lookupTenant(buildingId.trim(), flat.trim());
  if (!user) return { status: "error", error: GENERIC_RESOLVE_ERROR };
  return resolveForUser(user);
}

export async function resolveStaffLogin(input: string): Promise<ResolveResult> {
  if (!USERNAME_RE.test(input.trim())) {
    return { status: "error", error: "Enter your staff username." };
  }

  const user = await lookupStaff(input);
  if (!user) return { status: "error", error: GENERIC_RESOLVE_ERROR };
  return resolveForUser(user);
}

export async function signInWithContinuation(
  continuationToken: string,
  password: string,
): Promise<SignInResult> {
  const payload = verifyToken(continuationToken, "login_continue");
  if (!payload) return { status: "error", error: GENERIC_SIGN_IN_ERROR };

  if (!password || password.length < 1) {
    return { status: "error", error: GENERIC_SIGN_IN_ERROR };
  }

  const result = await authenticateWithPassword(payload.email, password);
  if (!result.ok) return { status: "error", error: GENERIC_SIGN_IN_ERROR };

  // Middleware (1.9) handles role-based + onboarding-flag routing on next nav.
  redirect("/");
}
