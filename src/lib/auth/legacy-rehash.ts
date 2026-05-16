import { compare } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * V2 Phase 1.8 — transparent BCrypt → Supabase Auth rehash.
 *
 * Flow:
 *   1. Try Supabase Auth signInWithPassword. If success: done.
 *   2. On failure, look up public.users by email. If legacy_bcrypt_hash IS
 *      NULL: return failure.
 *   3. bcryptjs.compare the plaintext to legacy_bcrypt_hash. If no match:
 *      return failure (generic, no info leak).
 *   4. If match: silently call admin.updateUserById to set the password in
 *      Supabase Auth, clear legacy_bcrypt_hash, then re-call
 *      signInWithPassword to establish the session.
 *
 * Sets the session cookie via the SSR server client when successful.
 * Returns ok=false for ANY failure — the caller surfaces a generic message.
 */

export type AuthResult = { ok: true } | { ok: false };

type LegacyLookupRow = Record<string, unknown> & {
  id: string;
  legacy_bcrypt_hash: string | null;
};

export async function authenticateWithPassword(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = await createClient();

  const first = await supabase.auth.signInWithPassword({ email, password });
  if (!first.error) return { ok: true };

  const rows = await db.execute<LegacyLookupRow>(
    sql`
      select u.id, u.legacy_bcrypt_hash
      from public.users u
      join auth.users au on au.id = u.id
      where lower(au.email) = lower(${email})
      limit 1
    `,
  );

  const row = rows[0];
  if (!row || !row.legacy_bcrypt_hash) return { ok: false };

  let bcryptMatch = false;
  try {
    bcryptMatch = await compare(password, row.legacy_bcrypt_hash);
  } catch {
    return { ok: false };
  }
  if (!bcryptMatch) return { ok: false };

  const admin = createAdminClient();
  const { error: updateError } = await admin.auth.admin.updateUserById(row.id, {
    password,
  });
  if (updateError) return { ok: false };

  await db.update(users).set({ legacyBcryptHash: null }).where(eq(users.id, row.id));

  const second = await supabase.auth.signInWithPassword({ email, password });
  if (second.error) return { ok: false };
  return { ok: true };
}
