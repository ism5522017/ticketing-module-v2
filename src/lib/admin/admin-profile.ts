import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { admins, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export interface AdminProfile {
  userId: string;
  adminId: string;
  fullName: string;
}

export async function getAdminProfileFromSession(): Promise<AdminProfile | null> {
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
      adminId: admins.id,
      adminActive: admins.active,
    })
    .from(users)
    .innerJoin(admins, eq(admins.userId, users.id))
    .where(eq(users.id, authUser.id))
    .limit(1);

  const r = rows[0];
  if (!r || r.role !== "admin" || !r.userActive || !r.adminActive) return null;

  return { userId: r.userId, adminId: r.adminId, fullName: r.fullName };
}
