"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { buildings, tenants, units, users } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  ensureBuilding,
  ensureDefaultSociety,
  ensureUnit,
  parseLocation,
} from "@/lib/tenants/ensure-unit";

interface UpdateInput {
  location?: string;
  wing?: string;
  flat?: string;
}

export type UpdateResult = { ok: true } | { ok: false; error: string };

export async function updateTenantProfile(input: UpdateInput): Promise<UpdateResult> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { ok: false, error: "Your session expired. Please sign in again." };

  const meRows = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);
  if (meRows[0]?.role !== "tenant") {
    return { ok: false, error: "Only tenants can edit their profile from here." };
  }

  const tenantRows = await db
    .select({
      tenantId: tenants.id,
      unitId: tenants.unitId,
      wing: units.wing,
      flat: units.flat,
      buildingName: buildings.name,
      buildingAddress: buildings.address,
      societyId: buildings.societyId,
    })
    .from(tenants)
    .leftJoin(units, eq(units.id, tenants.unitId))
    .leftJoin(buildings, eq(buildings.id, units.buildingId))
    .where(eq(tenants.userId, authUser.id))
    .limit(1);
  const current = tenantRows[0];
  if (!current) return { ok: false, error: "No tenant record found for your account." };

  const currentLocation = current.buildingAddress
    ? `${current.buildingName ?? ""}, ${current.buildingAddress}`
    : current.buildingName ?? "";
  const currentWing = current.wing ?? "";
  const currentFlat = current.flat ?? "";

  const desiredLocation = (input.location ?? currentLocation).trim();
  const desiredWing = (input.wing ?? currentWing).trim();
  const desiredFlat = (input.flat ?? currentFlat).trim();

  if (
    desiredLocation === currentLocation &&
    desiredWing === currentWing &&
    desiredFlat === currentFlat
  ) {
    return { ok: true };
  }

  if (!desiredLocation) {
    return { ok: false, error: "Location can't be empty." };
  }

  const parsed = parseLocation(desiredLocation);
  if (!parsed) {
    return { ok: false, error: "Enter a building name before the comma." };
  }

  try {
    await db.transaction(async (tx) => {
      const society = await ensureDefaultSociety(tx);
      const building = await ensureBuilding(tx, society.id, parsed.name, parsed.address);
      const unit = await ensureUnit(tx, building.id, desiredWing, desiredFlat);
      await tx.update(tenants).set({ unitId: unit.id }).where(eq(tenants.id, current.tenantId));
    });
  } catch {
    return { ok: false, error: "Couldn't save your details. Try again." };
  }

  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(authUser.id, {
    user_metadata: {
      ...(authUser.user_metadata ?? {}),
      location_edited: true,
    },
  });

  revalidatePath("/tenant/dashboard");
  return { ok: true };
}
