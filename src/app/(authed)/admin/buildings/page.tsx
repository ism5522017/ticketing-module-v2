import { redirect } from "next/navigation";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import {
  listAdminBuildings,
  listBuildingLocations,
  type BuildingSort,
} from "@/lib/admin/buildings-list";
import { BuildingRow } from "./building-row";
import { BuildingsFilterBar } from "./filter-bar";
import { CsvImport } from "./csv-import";
import { NewBuildingForm } from "./new-building-form";

export const dynamic = "force-dynamic";

const VALID_SORTS: BuildingSort[] = [
  "name_asc",
  "name_desc",
  "created_desc",
  "created_asc",
  "units_desc",
  "units_asc",
  "tickets_desc",
  "tickets_asc",
];

function parseSort(v: string | string[] | undefined): BuildingSort {
  if (typeof v === "string" && VALID_SORTS.includes(v as BuildingSort)) {
    return v as BuildingSort;
  }
  return "name_asc";
}

function parseStatus(v: string | string[] | undefined): "active" | "archived" | "all" {
  if (v === "archived") return "archived";
  if (v === "all") return "all";
  return "active";
}

export default async function BuildingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await getAdminProfileFromSession();
  if (!profile) redirect("/login");

  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const city = typeof sp.city === "string" ? sp.city : undefined;
  const locality = typeof sp.locality === "string" ? sp.locality : undefined;
  const search = typeof sp.q === "string" && sp.q.trim().length > 0 ? sp.q.trim() : undefined;
  const sort = parseSort(sp.sort);

  const [rows, locations] = await Promise.all([
    listAdminBuildings({ status, city, locality, search, sort }),
    listBuildingLocations(),
  ]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-deh-xl font-bold text-deh-dark">Properties</h1>
        <p className="text-deh-sm text-deh-muted">
          Add, edit, archive, and bulk-import properties. Archived properties
          are hidden from login and create dropdowns but their tickets and
          units stay intact.
        </p>
      </header>

      <BuildingsFilterBar cities={locations.cities} localities={locations.localities} />
      <NewBuildingForm />
      <CsvImport />

      <div className="mb-2 text-deh-sm text-deh-muted">
        Showing {rows.length} {rows.length === 1 ? "property" : "properties"}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-deh-base">
          <thead className="text-deh-xs uppercase tracking-wide text-deh-muted">
            <tr className="border-b border-deh-border">
              <th className="px-3 py-2 text-left font-semibold">Name</th>
              <th className="px-3 py-2 text-left font-semibold">Locality</th>
              <th className="px-3 py-2 text-left font-semibold">City</th>
              <th className="px-3 py-2 text-left font-semibold">Address</th>
              <th className="px-3 py-2 text-left font-semibold">Units</th>
              <th className="px-3 py-2 text-left font-semibold">Tickets</th>
              <th className="px-3 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-deh-sm italic text-deh-muted">
                  No properties match these filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => <BuildingRow key={r.id} row={r} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
