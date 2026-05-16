import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import { listAdminTenants } from "@/lib/admin/tenants-list";
import { listBuildings } from "@/lib/buildings/list";
import { FilterBar } from "./filter-bar";
import { NewTenantForm } from "./new-tenant-form";
import { TenantRow } from "./tenant-row";

export const dynamic = "force-dynamic";

function num(v: string | string[] | undefined, fallback: number): number {
  if (typeof v !== "string") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function activeFlag(v: string | string[] | undefined): "true" | "false" | "all" {
  if (v === "false") return "false";
  if (v === "all") return "all";
  return "true";
}

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await getAdminProfileFromSession();
  if (!profile) redirect("/login");

  const sp = await searchParams;
  const buildingId = typeof sp.building_id === "string" ? sp.building_id : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const active = activeFlag(sp.active);
  const page = num(sp.page, 1);
  const perPage = num(sp.per_page, 50);

  const [{ rows, total }, buildings] = await Promise.all([
    listAdminTenants({ buildingId, q, active, page, perPage }),
    listBuildings(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  function pageUrl(targetPage: number): string {
    const next = new URLSearchParams();
    if (buildingId) next.set("building_id", buildingId);
    if (q) next.set("q", q);
    if (active !== "true") next.set("active", active);
    if (perPage !== 50) next.set("per_page", String(perPage));
    next.set("page", String(targetPage));
    return `?${next.toString()}`;
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-deh-xl font-bold text-deh-dark">Tenants</h1>
        <p className="text-deh-sm text-deh-muted">
          Manage tenant accounts. Search filters work on name, email, wing, and flat.
          Disabling soft-deletes — auth identity stays, login blocked.
        </p>
      </header>

      <FilterBar buildings={buildings} />
      <NewTenantForm buildings={buildings} />

      <div className="mb-2 text-deh-sm text-deh-muted">
        Showing {from}–{to} of {total}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-deh-base">
          <thead className="text-deh-xs uppercase tracking-wide text-deh-muted">
            <tr className="border-b border-deh-border">
              <th className="px-3 py-2 text-left font-semibold">Name</th>
              <th className="px-3 py-2 text-left font-semibold">Email</th>
              <th className="px-3 py-2 text-left font-semibold">Wing</th>
              <th className="px-3 py-2 text-left font-semibold">Flat</th>
              <th className="px-3 py-2 text-left font-semibold">Building</th>
              <th className="px-3 py-2 text-left font-semibold">Phone</th>
              <th className="px-3 py-2 text-left font-semibold">Status</th>
              <th className="px-3 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-4 text-deh-sm italic text-deh-muted">No tenants match these filters.</td></tr>
            ) : rows.map((r) => <TenantRow key={r.id} row={r} />)}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-deh-sm">
          <Link
            href={pageUrl(Math.max(1, page - 1))}
            className={`rounded-md border border-deh-border px-3 py-1 ${page === 1 ? "pointer-events-none opacity-40" : "hover:bg-deh-card"}`}
          >
            ← Prev
          </Link>
          <span className="text-deh-muted">
            Page {page} of {totalPages}
          </span>
          <Link
            href={pageUrl(Math.min(totalPages, page + 1))}
            className={`rounded-md border border-deh-border px-3 py-1 ${page === totalPages ? "pointer-events-none opacity-40" : "hover:bg-deh-card"}`}
          >
            Next →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
