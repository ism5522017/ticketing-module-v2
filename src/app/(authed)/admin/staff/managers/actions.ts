"use server";

import { revalidatePath } from "next/cache";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import {
  createStaffMember,
  resetStaffPassword,
  setStaffActive,
  updateStaffName,
  type StaffMutationResult,
} from "@/lib/admin/staff-mutations";

const ROUTE = "/admin/staff/managers";

async function gate(): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getAdminProfileFromSession();
  if (!profile) return { ok: false, error: "Not authorized." };
  return { ok: true };
}

export async function createManagerAction(input: {
  username: string;
  fullName: string;
  password?: string;
}): Promise<StaffMutationResult<{ tempPassword: string }>> {
  const g = await gate();
  if (!g.ok) return g;
  const res = await createStaffMember({
    role: "manager",
    username: input.username,
    fullName: input.fullName,
    password: input.password,
  });
  if (res.ok) revalidatePath(ROUTE);
  return res.ok ? { ok: true, data: { tempPassword: res.data!.tempPassword } } : res;
}

export async function renameManagerAction(input: {
  roleId: string;
  fullName: string;
}): Promise<StaffMutationResult> {
  const g = await gate();
  if (!g.ok) return g;
  const res = await updateStaffName({ role: "manager", roleId: input.roleId, fullName: input.fullName });
  if (res.ok) revalidatePath(ROUTE);
  return res;
}

export async function resetManagerPasswordAction(input: {
  roleId: string;
}): Promise<StaffMutationResult<{ tempPassword: string }>> {
  const g = await gate();
  if (!g.ok) return g;
  const res = await resetStaffPassword({ role: "manager", roleId: input.roleId });
  if (res.ok) revalidatePath(ROUTE);
  return res;
}

export async function disableManagerAction(input: {
  roleId: string;
}): Promise<StaffMutationResult> {
  const g = await gate();
  if (!g.ok) return g;
  const res = await setStaffActive({ role: "manager", roleId: input.roleId, active: false });
  if (res.ok) revalidatePath(ROUTE);
  return res;
}

export async function enableManagerAction(input: {
  roleId: string;
}): Promise<StaffMutationResult> {
  const g = await gate();
  if (!g.ok) return g;
  const res = await setStaffActive({ role: "manager", roleId: input.roleId, active: true });
  if (res.ok) revalidatePath(ROUTE);
  return res;
}
