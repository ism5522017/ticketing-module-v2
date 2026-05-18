/**
 * Emergency staff-password reset.
 *
 * Use when an admin/manager/DR cannot log in and therefore cannot reach the
 * in-app /admin/staff/* reset button (the catch-22 case).
 *
 * What it does:
 *   1. Looks up public.users by username (case-insensitive).
 *   2. Refuses to act on tenants (use /admin/staff/tenants instead).
 *   3. Resets the Supabase Auth password to a random throwaway string
 *      (irrelevant — user goes through the first-login flow next).
 *   4. Flips needs_password_set = true AND needs_profile_confirm = true so
 *      the next login routes the user to /onboarding/set-password.
 *   5. Clears legacy_bcrypt_hash defensively.
 *
 * Run:
 *   npm run reset-staff -- <username>
 *   npm run reset-staff -- admin
 *
 * Exit codes:
 *   0  success
 *   1  user not found
 *   2  user is a tenant (refuse)
 *   3  Supabase Auth update failed
 */

import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";

function fail(code: number, msg: string): never {
  console.error(`\n  ✗ ${msg}\n`);
  process.exit(code);
}

async function main() {
  const usernameArg = process.argv[2];
  if (!usernameArg) {
    console.error(
      "\nUsage:  npm run reset-staff -- <username>" +
        "\nExample: npm run reset-staff -- admin\n",
    );
    process.exit(64);
  }
  const usernameLower = usernameArg.trim().toLowerCase();

  console.log(`\n🔍 Looking up staff user '${usernameArg}'…`);

  const rows = await db
    .select({
      id: users.id,
      role: users.role,
      username: users.username,
      fullName: users.fullName,
    })
    .from(users)
    .where(sql`lower(${users.username}) = ${usernameLower}`)
    .limit(1);

  const user = rows[0];
  if (!user) {
    fail(
      1,
      `No user with username '${usernameArg}'. ` +
        `Note: this script doesn't reset tenants — they log in by BUILDING-FLAT, not username.`,
    );
  }

  if (user.role === "tenant") {
    fail(
      2,
      `User '${user.username}' is a tenant. Reset tenants from /admin/staff/tenants instead.`,
    );
  }

  console.log(
    `   Found:   ${user.fullName} (role=${user.role}, id=${user.id.slice(0, 8)}…)`,
  );

  const admin = createAdminClient();

  // Step 1 — reset Supabase Auth password to something random (user will set
  // their own via the first-login flow anyway; this is just to invalidate
  // any old hash that might exist).
  const throwaway = randomBytes(24).toString("base64url");
  console.log(`\n🔐 Resetting Supabase Auth password (throwaway value)…`);
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password: throwaway,
  });
  if (updateError) {
    fail(3, `Supabase Auth update failed: ${updateError.message}`);
  }
  console.log(`   ✓ done`);

  // Step 2 — flip onboarding flags so the next login goes to set-password.
  console.log(`\n🚩 Flipping onboarding flags…`);
  await db
    .update(users)
    .set({
      needsPasswordSet: true,
      needsProfileConfirm: true,
      legacyBcryptHash: null,
    })
    .where(eq(users.id, user.id));
  console.log(`   ✓ done`);

  console.log(`\n✅ Reset complete for ${user.fullName} (${user.username}).`);
  console.log(`\nTell them to:`);
  console.log(`   1. Open the site.`);
  console.log(`   2. Click the 'Staff' tab.`);
  console.log(`   3. Type their username (${user.username}) and click Continue.`);
  console.log(`   4. They'll be sent straight to 'Choose your password' —`);
  console.log(`      no password prompt will appear.`);
  console.log(`   5. Pick a new password, confirm details, done.\n`);
}

main().catch((err) => {
  console.error(`\n  ✗ Unexpected error:`, err);
  process.exit(1);
});
