import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { buildings, tenants, units, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { ConfirmProfileForm } from "./confirm-profile-form";

export const dynamic = "force-dynamic";

function looksSynthetic(email: string | null | undefined): boolean {
  if (!email) return true;
  const lower = email.toLowerCase();
  return (
    lower.endsWith("@tenants.local")
    || lower.endsWith("@staff.local")
    || lower.endsWith("@deh.local")
    || lower.endsWith(".local")
    || lower.endsWith(".test")
  );
}

export default async function ConfirmProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const rows = await db
    .select({
      role: users.role,
      fullName: users.fullName,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);
  const me = rows[0];
  if (!me) redirect("/login");

  let tenantContext: {
    building: string;
    buildingAddress: string | null;
    wing: string | null;
    flat: string | null;
    email: string | null;
  } | null = null;

  if (me.role === "tenant") {
    const ctxRows = await db
      .select({
        building: buildings.name,
        buildingAddress: buildings.address,
        wing: units.wing,
        flat: units.flat,
        email: tenants.email,
      })
      .from(tenants)
      .leftJoin(units, eq(tenants.unitId, units.id))
      .leftJoin(buildings, eq(units.buildingId, buildings.id))
      .where(eq(tenants.userId, authUser.id))
      .limit(1);
    const ctx = ctxRows[0];
    if (ctx?.building) {
      tenantContext = {
        building: ctx.building,
        buildingAddress: ctx.buildingAddress,
        wing: ctx.wing,
        flat: ctx.flat,
        email: looksSynthetic(ctx.email) ? null : ctx.email,
      };
    }
  }

  // For staff, use auth.users.email as a starting point if it's not synthetic.
  const staffInitialEmail =
    me.role !== "tenant" && !looksSynthetic(authUser.email) ? (authUser.email ?? "") : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-deh-gray-bg px-4 py-12">
      <div className="w-full max-w-md rounded-deh-lg border border-deh-border bg-white p-8 shadow-sm">
        <header className="mb-6">
          <h1 className="text-deh-xl font-bold text-deh-dark">Confirm your details</h1>
          <p className="text-deh-sm text-deh-muted mt-1">
            Add a phone number and your real email, then verify your name and address.
            We&apos;ll use these on every ticket.
          </p>
        </header>
        <ConfirmProfileForm
          role={me.role}
          initialFullName={me.fullName}
          initialPhone={me.phone ?? ""}
          initialEmail={tenantContext?.email ?? staffInitialEmail}
          tenantContext={tenantContext}
        />
      </div>
    </main>
  );
}
