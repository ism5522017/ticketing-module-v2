import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { managers, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export interface ManagerProfile {
  userId: string;
  managerId: string;
  fullName: string;
}

export async function getManagerProfileFromSession(): Promise<ManagerProfile | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const rows = await db
    .select({
      userId: users.id,
      role: users.role,
      userActive: users.active,
      fullName: users.fullName,
      managerId: managers.id,
      managerActive: managers.active,
    })
    .from(users)
    .innerJoin(managers, eq(managers.userId, users.id))
    .where(eq(users.id, authUser.id))
    .limit(1);

  const r = rows[0];
  if (!r || r.role !== "manager" || !r.userActive || !r.managerActive) return null;

  return { userId: r.userId, managerId: r.managerId, fullName: r.fullName };
}
