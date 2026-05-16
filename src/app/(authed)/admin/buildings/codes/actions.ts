"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { buildings } from "@/db/schema";

export type UpdateResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

const CODE_RE = /^[A-Z0-9]{2,4}$/;

export async function updateBuildingCode(
  id: string,
  codeInput: string,
): Promise<UpdateResult> {
  const code = codeInput.trim().toUpperCase();

  if (!CODE_RE.test(code)) {
    return { ok: false, error: "Code must be 2–4 letters or digits." };
  }

  const collision = await db
    .select({ id: buildings.id })
    .from(buildings)
    .where(and(sql`upper(${buildings.code}) = ${code}`, ne(buildings.id, id)))
    .limit(1);

  if (collision.length > 0) {
    return { ok: false, error: `Code "${code}" is already used by another building.` };
  }

  await db.update(buildings).set({ code }).where(eq(buildings.id, id));
  revalidatePath("/admin/buildings/codes");
  return { ok: true, code };
}
