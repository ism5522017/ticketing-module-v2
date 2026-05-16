"use server";

import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MIN_PASSWORD = 6;

export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<ChangePasswordResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { ok: false, error: "Your session expired. Please sign in again." };
  }

  if (newPassword.length < MIN_PASSWORD) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD} characters.` };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "Passwords don't match." };
  }

  // Verify the current password with a throwaway anon-key client so the
  // user's real session cookie is never touched by the probe.
  const probe = createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error: probeError } = await probe.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (probeError) {
    return { ok: false, error: "Current password is incorrect." };
  }

  const admin = createAdminClient();
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });
  if (updateError) {
    return { ok: false, error: "Couldn't update your password. Try again." };
  }

  return { ok: true };
}
