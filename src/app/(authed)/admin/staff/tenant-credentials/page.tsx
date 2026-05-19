import { redirect } from "next/navigation";
import { and, asc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings, tenants, units, users } from "@/db/schema";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import { listBuildings } from "@/lib/buildings/list";
import { FilterBar } from "../tenants/filter-bar";

export const dynamic = "force-dynamic";

interface CredentialRow {
  tenantId: string;
  tenantName: string;
  building: string;
  wing: string | null;
  flat: string | null;
  email: string;
  passwordStatus: "Default" | "Custom" | "Awaiting first sign-in";
  active: boolean;
}

export default async function TenantCredentialsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await getAdminProfileFromSession();
  if (!profile) redirect("/login");

  const sp = await searchParams;
  const buildingId = typeof sp.building_id === "string" ? sp.building_id : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const conditions: SQL[] = [eq(tenants.active, true)];
  if (buildingId) conditions.push(eq(units.buildingId, buildingId));
  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      or(
        ilike(tenants.name, pattern),
        ilike(tenants.email, pattern),
        ilike(units.flat, pattern),
      )!,
    );
  }

  const buildingsList = await listBuildings();

  const rows = await db
    .select({
      tenantId: tenants.id,
      tenantName: tenants.name,
      email: tenants.email,
      phone: tenants.phone,
      active: tenants.active,
      mustChangePassword: tenants.mustChangePassword,
      needsPasswordSet: users.needsPasswordSet,
      buildingName: buildings.name,
      wing: units.wing,
      flat: units.flat,
    })
    .from(tenants)
    .leftJoin(units, eq(units.id, tenants.unitId))
    .leftJoin(buildings, eq(buildings.id, units.buildingId))
    .leftJoin(users, eq(users.id, tenants.userId))
    .where(and(...conditions))
    .orderBy(asc(buildings.name), asc(units.flat));

  const credentialRows: CredentialRow[] = rows.map((r) => {
    const status: CredentialRow["passwordStatus"] = r.needsPasswordSet
      ? "Awaiting first sign-in"
      : r.mustChangePassword
        ? "Default"
        : "Custom";
    return {
      tenantId: r.tenantId,
      tenantName: r.tenantName,
      building: r.buildingName ?? "—",
      wing: r.wing,
      flat: r.flat,
      email: r.email,
      passwordStatus: status,
      active: r.active,
    };
  });

  // Total count for the header summary line.
  const totalCountRows = await db.execute<{ n: number }>(
    sql`select count(*)::int as n from public.tenants where active = true`,
  );
  const totalCount = totalCountRows[0]?.n ?? 0;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-deh-xl font-bold text-deh-dark">Tenant credentials</h1>
        <p className="text-deh-sm text-deh-muted">
          Tenants sign in by picking their building and typing their flat number. Default password is{" "}
          <span className="font-mono">1234</span> until the tenant signs in for the first time.
        </p>
        <p className="mt-1 text-deh-xs text-deh-muted">
          Showing {credentialRows.length} of {totalCount} active tenants.
        </p>
      </header>

      <FilterBar buildings={buildingsList} />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-deh-base">
          <thead className="text-deh-xs uppercase tracking-wide text-deh-muted">
            <tr className="border-b border-deh-border">
              <th className="px-3 py-2 text-left font-semibold">Tenant</th>
              <th className="px-3 py-2 text-left font-semibold">Building</th>
              <th className="px-3 py-2 text-left font-semibold">Wing/Flat</th>
              <th className="px-3 py-2 text-left font-semibold">Email</th>
              <th className="px-3 py-2 text-left font-semibold">Password</th>
            </tr>
          </thead>
          <tbody>
            {credentialRows.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-4 text-deh-sm italic text-deh-muted">No tenants match these filters.</td></tr>
            ) : credentialRows.map((r) => (
              <tr key={r.tenantId} className="border-b border-deh-border">
                <td className="px-3 py-3 font-medium text-deh-text">{r.tenantName}</td>
                <td className="px-3 py-3 text-deh-sm">{r.building}</td>
                <td className="px-3 py-3 text-deh-sm">
                  {r.wing ? r.wing + " / " : ""}{r.flat ?? "—"}
                </td>
                <td className="px-3 py-3 text-deh-sm text-deh-muted">{r.email}</td>
                <td className="px-3 py-3 text-deh-sm">
                  <span
                    className={`rounded-deh-pill px-2 py-0.5 text-deh-xs font-medium ${
                      r.passwordStatus === "Default"
                        ? "bg-deh-yellow/20 text-deh-dark"
                        : r.passwordStatus === "Custom"
                          ? "bg-status-resolved/15 text-status-resolved"
                          : "bg-deh-muted/20 text-deh-muted"
                    }`}
                  >
                    {r.passwordStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
