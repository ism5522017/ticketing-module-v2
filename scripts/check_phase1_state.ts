/**
 * Diagnostic: prints whether Phase 1 backfill + RLS have been applied.
 * Run with: npx tsx --env-file=.env.local scripts/check_phase1_state.ts
 */
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");

const sql = postgres(url, { prepare: false });

async function main() {
  const usersByRole = await sql`
    select role, count(*)::int as n from public.users group by role order by role
  `;
  const roleTables = await sql`
    select 'tenants' as t,
           count(*)::int as total,
           count(user_id)::int as with_user_id
      from public.tenants
    union all
    select 'admins', count(*)::int, count(user_id)::int from public.admins
    union all
    select 'managers', count(*)::int, count(user_id)::int from public.managers
    union all
    select 'drs', count(*)::int, count(user_id)::int from public.drs
  `;
  const buildingsWithCode = await sql`
    select count(*)::int as total,
           count(code)::int as with_code
      from public.buildings
  `;
  const rls = await sql`
    select c.relname as table_name, c.relrowsecurity as rls_enabled
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind = 'r'
     order by c.relname
  `;
  const policies = await sql`
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
     order by tablename, policyname
  `;

  console.log("\n=== public.users by role ===");
  console.table(usersByRole);

  console.log("=== role tables: user_id populated ===");
  console.table(roleTables);

  console.log("=== buildings.code populated ===");
  console.table(buildingsWithCode);

  console.log("=== RLS status by table ===");
  console.table(rls);

  console.log(`=== Policies (count: ${policies.length}) ===`);
  console.table(policies);

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
