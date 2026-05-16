/**
 * V2 Phase 1.3 — building code auto-suggest backfill.
 *
 * Idempotent: only writes to buildings.code where it IS NULL. Existing codes
 * are treated as "taken" and never overwritten — admin overrides via the
 * /admin/buildings/codes review UI.
 *
 * Run:
 *   npm run suggest-building-codes
 */

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings } from "@/db/schema";
import { suggestBuildingCode } from "@/lib/building-codes";

async function main() {
  const all = await db
    .select({ id: buildings.id, name: buildings.name, code: buildings.code })
    .from(buildings);

  const taken = new Set<string>(
    all.filter((b) => b.code).map((b) => b.code!.toUpperCase()),
  );

  const toUpdate: Array<{ id: string; code: string; name: string }> = [];
  for (const b of all) {
    if (b.code) continue;
    const code = suggestBuildingCode(b.name, taken);
    taken.add(code);
    toUpdate.push({ id: b.id, code, name: b.name });
  }

  if (toUpdate.length === 0) {
    console.log(`All ${all.length} buildings already have codes. No-op.`);
    return;
  }

  console.log(`Suggesting codes for ${toUpdate.length} of ${all.length} buildings:`);
  for (const u of toUpdate) {
    console.log(`  ${u.code.padEnd(4)} ← ${u.name}`);
  }

  await db.transaction(async (tx) => {
    for (const u of toUpdate) {
      await tx.update(buildings).set({ code: u.code }).where(eq(buildings.id, u.id));
    }
  });

  console.log(`Updated ${toUpdate.length} buildings.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
