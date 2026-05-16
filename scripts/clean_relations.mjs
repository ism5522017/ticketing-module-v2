/**
 * Post-process step for `npm run db:pull`.
 *
 * Drizzle-kit, when it sees an FK from public.users → auth.users, emits a
 * cross-schema `usersInAuth` table reference into relations.ts that isn't
 * exported from schema.ts (because schemaFilter limits us to "public").
 * The result fails typecheck.
 *
 * We don't model auth.users in Drizzle — it's owned by Supabase Auth and
 * queried through the Auth client, not via SQL. So we just strip the three
 * offending references after every pull.
 */

import { readFileSync, writeFileSync } from "node:fs";

const path = "src/db/relations.ts";
const original = readFileSync(path, "utf8");

let out = original;

// 1. Drop usersInAuth from the import list — handle both "in the middle" and
// "at the end" positions.
out = out.replace(/,\s*usersInAuth\s*,/, ",");
out = out.replace(/,\s*usersInAuth(\s*\}\s*from\s*"\.\/schema";)/, "$1");
out = out.replace(/usersInAuth\s*,\s*/, "");

// 2. Remove the usersInAuth: one(...) block from usersRelations.
out = out.replace(
  /\n\s*usersInAuth:\s*one\(usersInAuth,\s*\{[^}]*\}\),\n/,
  "\n",
);

// 3. Remove the standalone usersInAuthRelations export.
out = out.replace(
  /\nexport const usersInAuthRelations[\s\S]*?\}\)\);\s*$/,
  "\n",
);

// 4. If usersRelations no longer needs `one`, simplify the destructure.
out = out.replace(
  /export const usersRelations = relations\(users, \(\{one,\s*many\}\) => \(\{(\s*tenants: many\(tenants\),\s*admins: many\(admins\),\s*managers: many\(managers\),\s*drs: many\(drs\),\s*)\}\)\);/,
  "export const usersRelations = relations(users, ({many}) => ({$1}));",
);

if (out === original) {
  console.log("clean_relations: nothing to clean.");
} else {
  writeFileSync(path, out);
  console.log("clean_relations: stripped usersInAuth references.");
}
