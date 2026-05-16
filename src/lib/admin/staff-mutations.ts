import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { admins, drs, managers, users } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";

export const DEFAULT_PASSWORD = "1234";

export interface StaffMutationFailure {
  ok: false;
  error: string;
}
export interface StaffMutationSuccess<T = undefined> {
  ok: true;
  data?: T;
}
export type StaffMutationResult<T = undefined> =
  | StaffMutationSuccess<T>
  | StaffMutationFailure;

/** Phase 1.4 staff email convention — `{username}@staff.local`. */
export function staffEmail(username: string): string {
  return `${username.trim().toLowerCase()}@staff.local`;
}

/** Verifies that there's at least one OTHER active admin besides the given one. */
export async function hasAnotherActiveAdmin(excludeAdminId: string): Promise<boolean> {
  const rows = await db
    .select({ id: admins.id })
    .from(admins)
    .innerJoin(users, eq(users.id, admins.userId))
    .where(
      and(
        eq(admins.active, true),
        eq(users.active, true),
        ne(admins.id, excludeAdminId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

interface CreateStaffArgs {
  role: "admin" | "manager";
  username: string;
  fullName: string;
  password?: string;
}

export async function createStaffMember(args: CreateStaffArgs): Promise<
  StaffMutationResult<{ tempPassword: string; userId: string }>
> {
  const username = args.username.trim();
  const fullName = args.fullName.trim();
  if (username.length < 2) return { ok: false, error: "Enter a username." };
  if (fullName.length < 2) return { ok: false, error: "Enter the staff member's full name." };
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return { ok: false, error: "Username can only contain letters, digits, dot, dash, underscore." };
  }

  const dupes = await db.execute<{ id: string }>(
    args.role === "admin"
      ? sql`select id from public.admins where lower(username) = lower(${username}) limit 1`
      : sql`select id from public.managers where lower(username) = lower(${username}) limit 1`,
  );
  if (dupes.length > 0) return { ok: false, error: `Username "${username}" is already taken.` };

  const tempPassword = args.password?.trim() || DEFAULT_PASSWORD;
  const supabaseAdmin = createAdminClient();
  const email = staffEmail(username);

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role: args.role, synthetic_email: true },
  });
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Couldn't create auth user." };
  }

  const userId = data.user.id;

  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        role: args.role,
        username,
        fullName,
        phone: null,
        active: true,
        needsPasswordSet: true,
        needsProfileConfirm: true,
        legacyBcryptHash: null,
      });

      if (args.role === "admin") {
        await tx.insert(admins).values({
          name: fullName,
          username,
          passwordDigest: "",
          mustChangePassword: true,
          active: true,
          userId,
        });
      } else {
        await tx.insert(managers).values({
          name: fullName,
          username,
          passwordDigest: "",
          mustChangePassword: true,
          active: true,
          userId,
        });
      }
    });
  } catch (e) {
    await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Couldn't save staff member.",
    };
  }

  return { ok: true, data: { tempPassword, userId } };
}

export async function updateStaffName(args: {
  role: "admin" | "manager";
  roleId: string;
  fullName: string;
}): Promise<StaffMutationResult> {
  const fullName = args.fullName.trim();
  if (fullName.length < 2) return { ok: false, error: "Enter a name." };

  const userId = await resolveStaffUserId(args.role, args.roleId);
  if (!userId) return { ok: false, error: "Staff record not found." };

  await db.transaction(async (tx) => {
    await tx.update(users).set({ fullName }).where(eq(users.id, userId));
    if (args.role === "admin") {
      await tx.update(admins).set({ name: fullName }).where(eq(admins.id, args.roleId));
    } else {
      await tx.update(managers).set({ name: fullName }).where(eq(managers.id, args.roleId));
    }
  });

  return { ok: true };
}

export async function resetStaffPassword(args: {
  role: "admin" | "manager" | "dr";
  roleId: string;
}): Promise<StaffMutationResult<{ tempPassword: string }>> {
  const userId = await resolveStaffUserId(args.role, args.roleId);
  if (!userId) return { ok: false, error: "Staff record not found." };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: DEFAULT_PASSWORD,
  });
  if (error) return { ok: false, error: error.message };

  await db
    .update(users)
    .set({ needsPasswordSet: true, legacyBcryptHash: null })
    .where(eq(users.id, userId));

  return { ok: true, data: { tempPassword: DEFAULT_PASSWORD } };
}

export async function setStaffActive(args: {
  role: "admin" | "manager";
  roleId: string;
  active: boolean;
}): Promise<StaffMutationResult> {
  const userId = await resolveStaffUserId(args.role, args.roleId);
  if (!userId) return { ok: false, error: "Staff record not found." };

  await db.transaction(async (tx) => {
    await tx.update(users).set({ active: args.active }).where(eq(users.id, userId));
    if (args.role === "admin") {
      await tx.update(admins).set({ active: args.active }).where(eq(admins.id, args.roleId));
    } else {
      await tx.update(managers).set({ active: args.active }).where(eq(managers.id, args.roleId));
    }
  });
  return { ok: true };
}

async function resolveStaffUserId(
  role: "admin" | "manager" | "dr",
  roleId: string,
): Promise<string | null> {
  if (role === "admin") {
    const rows = await db.select({ userId: admins.userId }).from(admins).where(eq(admins.id, roleId)).limit(1);
    return rows[0]?.userId ?? null;
  }
  if (role === "manager") {
    const rows = await db.select({ userId: managers.userId }).from(managers).where(eq(managers.id, roleId)).limit(1);
    return rows[0]?.userId ?? null;
  }
  const rows = await db.select({ userId: drs.userId }).from(drs).where(eq(drs.id, roleId)).limit(1);
  return rows[0]?.userId ?? null;
}
