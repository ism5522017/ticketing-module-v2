import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings } from "@/db/schema";

export interface BuildingSummary {
  id: string;
  name: string;
  code: string | null;
  locality: string | null;
  city: string | null;
}

const TAG = "buildings";

/**
 * Cached buildings list for any UI dropdown (admin tenant create, DR create,
 * etc.). 5-minute revalidation matches the old app's HTTP cache. Bust via
 * `revalidateBuildings()` after any code/name edit in admin tools.
 */
export const listBuildings = unstable_cache(
  async (): Promise<BuildingSummary[]> => {
    const rows = await db
      .select({
        id: buildings.id,
        name: buildings.name,
        code: buildings.code,
        locality: buildings.locality,
        city: buildings.city,
      })
      .from(buildings)
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
