"use server";

import { revalidatePath } from "next/cache";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import { upsertBudget } from "@/lib/admin/budgets";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const profile = await getAdminProfileFromSession();
  if (!profile) throw new Error("Forbidden");
  return profile;
}

export async function saveBudget(
  category: string,
  amountStr: string,
  period?: string | null,
): Promise<ActionResult> {
  await requireAdmin();
  const amount = Number(amountStr);
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: "Enter a non-negative amount." };
  }
  try {
    await upsertBudget(category, amount, period);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed.";
    return { ok: false, error: message };
  }
  revalidatePath("/admin/budgets");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}
