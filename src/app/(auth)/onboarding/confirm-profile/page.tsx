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
    <div className="w-full max-w-lg">
      <div className="mb-6 flex items-center justify-center gap-3 text-deh-dark">
        <span className="flex h-11 w-11 items-center justify-center rounded-deh-md bg-deh-dark text-deh-yellow shadow-deh-card">
          <span className="font-display text-deh-md font-bold">✓</span>
        </span>
        <p className="font-display text-deh-xl font-bold tracking-tight">
          DEH Maintenance
        </p>
      </div>

      <div className="rounded-3xl bg-white px-6 py-10 shadow-deh-card sm:px-10">
        <header className="mb-6 text-center">
          <h1 className="font-display text-deh-2xl font-bold text-deh-dark">
            Confirm your details
          </h1>
          <p className="mt-1.5 text-deh-sm text-deh-muted">
            Add a phone number and your real email, then verify your name and
            address. We&apos;ll use these on every ticket.
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
    </div>
  );
}
