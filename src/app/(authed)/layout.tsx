import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/shared/app-header";
import { Sidebar } from "@/components/shared/sidebar";
import { db } from "@/db/client";
import { buildings, drs, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rows = await db
    .select({ role: users.role, fullName: users.fullName })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const me = rows[0];
  if (!me) redirect("/login");

  let buildingLabel: string | null = null;
  if (me.role === "dr") {
    const drBuilding = await db
      .select({ name: buildings.name })
      .from(drs)
      .leftJoin(buildings, eq(drs.buildingId, buildings.id))
      .where(eq(drs.userId, user.id))
      .limit(1);
    buildingLabel = drBuilding[0]?.name ?? null;
  }

  return (
    <div className="min-h-screen">
      <AppHeader role={me.role} fullName={me.fullName} buildingLabel={buildingLabel} />
      <div className="flex">
        <Sidebar role={me.role} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
