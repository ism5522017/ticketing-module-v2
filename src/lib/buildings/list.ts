import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { asc, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings } from "@/db/schema";

export interface BuildingSummary {
  id: string;
  name: string;
  locality: string | null;
  city: string | null;
}

const TAG = "buildings";

/**
 * Cached active-buildings list for every UI dropdown (login picker,
 * admin tenant/DR create, credentials filter). Archived rows are excluded
 * so they disappear from selectable surfaces immediately after the admin
 * archives one. The admin /admin/buildings page reads its own non-cached
 * list (including archived) directly.
 */
export const listBuildings = unstable_cache(
  async (): Promise<BuildingSummary[]> => {
    const rows = await db
      .select({
        id: buildings.id,
        name: buildings.name,
        locality: buildings.locality,
        city: buildings.city,
      })
      .from(buildings)
      .where(isNull(buildings.archivedAt))
      .orderBy(asc(buildings.name));
    return rows;
  },
  ["buildings-list"],
  { revalidate: 300, tags: [TAG] },
);

export function revalidateBuildings() {
  // Next 16's revalidateTag requires an explicit cache profile; "default"
  // matches the framework's standard 5-minute revalidation policy.
  revalidateTag(TAG, "default");
}
