"use server";

import { revalidatePath } from "next/cache";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import {
  createStaffMember,
  hasAnotherActiveAdmin,
  resetStaffPassword,
  setStaffActive,
  updateStaffName,
  type StaffMutationResult,
} from "@/lib/admin/staff-mutations";

const ROUTE = "/admin/staff/admins";

async function gate(): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getAdminProfileFromSession();
  if (!profile) return { ok: false, error: "Not authorized." };
  return { ok: true };
}

export async function createAdminAction(input: {
  username: string;
  fullName: string;
  password?: string;
}): Promise<StaffMutationResult<{ tempPassword: string }>> {
  const g = await gate();
  if (!g.ok) return g;
  const res = await createStaffMember({
    role: "admin",
    username: input.username,
    fullName: input.fullName,
    password: input.password,
  });
  if (res.ok) revalidatePath(ROUTE);
  return res.ok ? { ok: true, data: { tempPassword: res.data!.tempPassword } } : res;
}

export async function renameAdminAction(input: {
  roleId: string;
  fullName: string;
}): Promise<StaffMutationResult> {
  const g = await gate();
  if (!g.ok) return g;
  const res = await updateStaffName({ role: "admin", roleId: input.roleId, fullName: input.fullName });
  if (res.ok) revalidatePath(ROUTE);
  return res;
}

export async function resetAdminPasswordAction(input: {
  roleId: string;
}): Promise<StaffMutationResult<{ tempPassword: string }>> {
  const g = await gate();
  if (!g.ok) return g;
  const res = await resetStaffPassword({ role: "admin", roleId: input.roleId });
  if (res.ok) revalidatePath(ROUTE);
  return res;
}

export async function disableAdminAction(input: {
  roleId: string;
}): Promise<StaffMutationResult> {
  const profile = await getAdminProfileFromSession();
  if (!profile) return { ok: false, error: "Not authorized." };
  if (profile.adminId === input.roleId) {
    return { ok: false, error: "You cannot disable your own admin account." };
  }
  const stillOne = await hasAnotherActiveAdmin(input.roleId);
  if (!stillOne) {
    return { ok: false, error: "At least one active admin must remain." };
  }
  const res = await setStaffActive({ role: "admin", roleId: input.roleId, active: false });
  if (res.ok) revalidatePath(ROUTE);
  return res;
}

export async function enableAdminAction(input: {
  roleId: string;
}): Promise<StaffMutationResult> {
  const g = await gate();
  if (!g.ok) return g;
  const res = await setStaffActive({ role: "admin", roleId: input.roleId, active: true });
  if (res.ok) revalidatePath(ROUTE);
  return res;
}
