/**
 * V2 Phase 1.4 — backfill auth.users + public.users for every existing row
 * across tenants / admins / managers / drs. Idempotent: re-running is a
 * no-op once every role row has a non-null user_id.
 *
 * Run after `npm run suggest-building-codes` — synthetic tenant emails
 * embed buildings.code, so the codes must exist first.
 *
 *   npm run migrate-users
 *
 * What it does, per row:
 *   1. Skip if role_table.user_id IS NOT NULL.
 *   2. Compute email (real if available, else synthetic).
 *   3. Find-or-create auth.users with email_confirm=true + a random password.
 *   4. Insert public.users (with legacy_bcrypt_hash = password_digest).
 *   5. Update role_table.user_id to the new users.id.
 *
 * Order: tenants → admins → managers → drs. A DR's full_name is sourced
 * from the linked tenant; the DR's own auth identity is separate from the
 * tenant's (different email, different user_id).
 */

import { randomBytes } from "node:crypto";
import { eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { admins, buildings, drs, managers, tenants, units, users } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";

type Role = "tenant" | "admin" | "manager" | "dr";

const supabaseAdmin = createAdminClient();

const REAL_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isSyntheticEmail(email: string): boolean {
  if (!REAL_EMAIL_RE.test(email)) return true;
  const lower = email.toLowerCase();
  return lower.endsWith(".local") || lower.endsWith(".test");
}

function randomPassword(): string {
  return randomBytes(32).toString("base64");
}

async function loadAuthByEmail(): Promise<Map<string, string>> {
  const rows = await db.execute<{ id: string; email: string | null }>(
    sql`select id, email from auth.users where email is not null`,
  );
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.email) map.set(r.email.toLowerCase(), r.id);
  }
  return map;
}

async function findOrCreateAuthUser(
  email: string,
  metadata: { role: Role; synthetic_email: boolean },
  cache: Map<string, string>,
): Promise<string> {
  const key = email.toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: randomPassword(),
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) {
    // Race / dup: re-read auth.users and try once more from the cache.
    if (error.status === 422 || /already registered|email_exists/i.test(error.message)) {
      const refreshed = await loadAuthByEmail();
      const found = refreshed.get(key);
      if (found) {
        cache.set(key, found);
        return found;
      }
    }
    throw new Error(`createUser(${email}) failed: ${error.message}`);
  }

  if (!data.user) throw new Error(`createUser(${email}) returned no user`);
  cache.set(key, data.user.id);
  return data.user.id;
}

async function migrateTenants(cache: Map<string, string>) {
  // Already-claimed auth.users ids — any tenant row with user_id IS NOT NULL.
  // We avoid handing the same auth user id to a second tenant (tenants.user_id
  // is unique). For shared flats (HM1-504, etc.) the second tenant gets a
  // suffixed synthetic email so they end up with their own auth identity.
  const claimedRows = await db
    .select({ userId: tenants.userId })
    .from(tenants)
    .where(sql`${tenants.userId} is not null`);
  const claimed = new Set(claimedRows.map((r) => r.userId).filter((v): v is string => !!v));

  const rows = await db
    .select({
      tenant: tenants,
      flat: units.flat,
      buildingCode: buildings.code,
    })
    .from(tenants)
    .leftJoin(units, eq(tenants.unitId, units.id))
    .leftJoin(buildings, eq(units.buildingId, buildings.id))
    .where(isNull(tenants.userId));

  if (rows.length === 0) {
    console.log("tenants: nothing to migrate.");
    return;
  }
  console.log(`tenants: migrating ${rows.length}`);

  // Stable order: oldest tenant in a shared slot wins the bare BUILDING-FLAT
  // email; newer ones get a suffixed form.
  rows.sort((a, b) => a.tenant.createdAt.localeCompare(b.tenant.createdAt));

  for (const row of rows) {
    const t = row.tenant;
    const synthetic = isSyntheticEmail(t.email);

    const candidates: string[] = [];
    if (synthetic) {
      if (!row.buildingCode) {
        throw new Error(
          `tenant ${t.id} (${t.name}) has a synthetic email but no building.code. Run 'npm run suggest-building-codes' first.`,
        );
      }
      if (!row.flat) {
        throw new Error(`tenant ${t.id} (${t.name}) has no unit/flat — cannot synthesize email.`);
      }
      const code = row.buildingCode.toUpperCase();
      const flat = row.flat;
      // Flat strings sometimes contain spaces/slashes (e.g. "516 / 1D-SBP1").
      // Email locals can't include those — normalize to a single token.
      const flatSlug = flat
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const suffix = t.id.slice(0, 8);
      candidates.push(`${code.toLowerCase()}-${flatSlug}@tenants.local`);
      candidates.push(`${code.toLowerCase()}-${flatSlug}-${suffix}@tenants.local`);
    } else {
      candidates.push(t.email.toLowerCase());
    }

    // Pick the first candidate that is either unknown to auth.users OR maps
    // to an auth.users row that is NOT already claimed by another tenant.
    let email: string | null = null;
    for (const c of candidates) {
      const existingId = cache.get(c);
      if (!existingId || !claimed.has(existingId)) {
        email = c;
        break;
      }
    }
    if (!email) {
      throw new Error(
        `tenant ${t.id} (${t.name}): could not find a free synthetic email (tried ${candidates.join(", ")}). This shouldn't happen — investigate manually.`,
      );
    }

    const userId = await findOrCreateAuthUser(
      email,
      { role: "tenant", synthetic_email: synthetic },
      cache,
    );

    // Defensive: if findOrCreateAuthUser returned an id that's already claimed
    // (because the email was real and another tenant also has it), skip and
    // surface — better than silently corrupting data.
    if (claimed.has(userId)) {
      throw new Error(
        `tenant ${t.id} (${t.name}) resolved to auth.users ${userId} which is already claimed by another tenant. Check for duplicate emails.`,
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .insert(users)
        .values({
          id: userId,
          role: "tenant",
          username: null,
          fullName: t.name,
          phone: t.phone,
          active: t.active,
          needsPasswordSet: true,
          needsProfileConfirm: true,
          legacyBcryptHash: t.passwordDigest,
        })
        .onConflictDoNothing();

      await tx.update(tenants).set({ userId }).where(eq(tenants.id, t.id));
    });

    claimed.add(userId);
    console.log(`  tenant ${t.id} → user ${userId} (${email})`);
  }
}

async function migrateStaff(
  table: typeof admins | typeof managers,
  role: "admin" | "manager",
  cache: Map<string, string>,
) {
  const rows = await db
    .select()
    .from(table)
    .where(isNull(table.userId));

  if (rows.length === 0) {
    console.log(`${role}s: nothing to migrate.`);
    return;
  }
  console.log(`${role}s: migrating ${rows.length}`);

  for (const r of rows) {
    const email = `${r.username.toLowerCase()}@staff.local`;
    const userId = await findOrCreateAuthUser(
      email,
      { role, synthetic_email: true },
      cache,
    );

    await db.transaction(async (tx) => {
      await tx
        .insert(users)
        .values({
          id: userId,
          role,
          username: r.username,
          fullName: r.name,
          phone: null,
          active: r.active,
          needsPasswordSet: true,
          needsProfileConfirm: true,
          legacyBcryptHash: r.passwordDigest,
        })
        .onConflictDoNothing();

      await tx.update(table).set({ userId }).where(eq(table.id, r.id));
    });

    console.log(`  ${role} ${r.id} → user ${userId} (${email})`);
  }
}

async function migrateDRs(cache: Map<string, string>) {
  // DRs have no `name` column. Source full_name from the linked tenant.
  const rows = await db
    .select({
      dr: drs,
      tenantName: tenants.name,
      tenantPhone: tenants.phone,
    })
    .from(drs)
    .leftJoin(tenants, eq(drs.tenantId, tenants.id))
    .where(isNull(drs.userId));

  if (rows.length === 0) {
    console.log("drs: nothing to migrate.");
    return;
  }
  console.log(`drs: migrating ${rows.length}`);

  for (const row of rows) {
    const d = row.dr;
    if (!row.tenantName) {
      throw new Error(`dr ${d.id} (${d.username}) has no linked tenant — cannot derive full_name.`);
    }

    const email = `${d.username.toLowerCase()}@staff.local`;
    const userId = await findOrCreateAuthUser(
      email,
      { role: "dr", synthetic_email: true },
      cache,
    );

    await db.transaction(async (tx) => {
      await tx
        .insert(users)
        .values({
          id: userId,
          role: "dr",
          username: d.username,
          fullName: row.tenantName!,
          phone: row.tenantPhone,
          active: d.active,
          needsPasswordSet: true,
          needsProfileConfirm: true,
          legacyBcryptHash: d.passwordDigest,
        })
        .onConflictDoNothing();

      await tx.update(drs).set({ userId }).where(eq(drs.id, d.id));
    });

    console.log(`  dr ${d.id} → user ${userId} (${email})`);
  }
}

async function main() {
  console.log("Loading existing auth.users…");
  const cache = await loadAuthByEmail();
  console.log(`  ${cache.size} existing auth users cached`);

  await migrateTenants(cache);
  await migrateStaff(admins, "admin", cache);
  await migrateStaff(managers, "manager", cache);
  await migrateDRs(cache);

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
