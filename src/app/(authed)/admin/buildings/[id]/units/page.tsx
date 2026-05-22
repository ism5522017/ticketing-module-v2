import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import { getBuildingHeader, listBuildingUnits } from "@/lib/admin/building-units-list";
import { NewUnitForm } from "./new-unit-form";
import { UnitRow } from "./unit-row";

export const dynamic = "force-dynamic";

export default async function BuildingUnitsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getAdminProfileFromSession();
  if (!profile) redirect("/login");

  const { id } = await params;
  const header = await getBuildingHeader(id);
  if (!header) notFound();

  const rows = await listBuildingUnits(id);
  const archived = header.archivedAt !== null;
  const subtitle = [header.locality, header.city].filter(Boolean).join(", ");

  return (
    <div>
      <header className="mb-6">
        <Link
          href="/admin/buildings"
          className="inline-flex items-center gap-1 text-deh-xs font-medium text-deh-blue hover:underline"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          All properties
        </Link>
        <h1 className="mt-1 text-deh-xl font-bold text-deh-dark">
          {header.name}
          {archived ? (
            <span className="ml-2 align-middle rounded-deh-pill bg-deh-muted/20 px-2 py-0.5 text-deh-xs font-medium text-deh-muted">
              Archived
            </span>
          ) : null}
        </h1>
        {subtitle ? <p className="text-deh-sm text-deh-muted">{subtitle}</p> : null}
        <p className="mt-1 text-deh-sm text-deh-muted">
          Manage flats. Delete is blocked when a flat has any Khidmat Guzar attached —
          reassign or disable them first.
        </p>
      </header>

      {archived ? (
        <p className="mb-4 rounded-deh-md bg-deh-yellow/10 px-3 py-2 text-deh-sm text-deh-dark">
          This property is archived — flats are read-only until it&apos;s restored
          from the <Link href="/admin/buildings?status=archived" className="font-semibold text-deh-blue hover:underline">archived properties</Link> list.
        </p>
      ) : (
        <NewUnitForm buildingId={id} />
      )}

      <div className="mb-2 text-deh-sm text-deh-muted">
        Showing {rows.length} {rows.length === 1 ? "flat" : "flats"}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-deh-base">
          <thead className="text-deh-xs uppercase tracking-wide text-deh-muted">
            <tr className="border-b border-deh-border">
              <th className="px-3 py-2 text-left font-semibold">Wing</th>
              <th className="px-3 py-2 text-left font-semibold">Flat</th>
              <th className="px-3 py-2 text-left font-semibold">Floor</th>
              <th className="px-3 py-2 text-left font-semibold">Type</th>
              <th className="px-3 py-2 text-left font-semibold">Active KGs / Tickets</th>
              <th className="px-3 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-deh-sm italic text-deh-muted">
                  No flats yet. {archived ? "" : "Add one above."}
                </td>
              </tr>
            ) : (
              rows.map((r) => <UnitRow key={r.id} buildingId={id} row={r} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
