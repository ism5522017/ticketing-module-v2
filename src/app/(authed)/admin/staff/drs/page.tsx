import { redirect } from "next/navigation";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import { listDrs } from "@/lib/admin/staff-list";
import { listBuildings } from "@/lib/buildings/list";
import { DrRow } from "./dr-row";
import { NewDrForm } from "./new-dr-form";

export const dynamic = "force-dynamic";

export default async function DrsPage() {
  const profile = await getAdminProfileFromSession();
  if (!profile) redirect("/login");

  const [rows, buildings] = await Promise.all([listDrs(), listBuildings()]);
  const active = rows.filter((r) => r.active);
  const retired = rows.filter((r) => !r.active);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-deh-xl font-bold text-deh-dark">Designated Residents</h1>
        <p className="text-deh-sm text-deh-muted">
          One active DR per building. The DR must be a Khidmat Guzar of the building they represent.
        </p>
      </header>

      <NewDrForm buildings={buildings} />

      <section className="mb-8">
        <h2 className="mb-2 text-deh-lg font-semibold text-deh-dark">Active</h2>
        <table className="w-full border-collapse text-deh-base">
          <thead className="text-deh-xs uppercase tracking-wide text-deh-muted">
            <tr className="border-b border-deh-border">
              <th className="px-3 py-2 text-left font-semibold">Building</th>
              <th className="px-3 py-2 text-left font-semibold">Khidmat Guzar</th>
              <th className="px-3 py-2 text-left font-semibold">Username</th>
              <th className="px-3 py-2 text-left font-semibold">Status</th>
              <th className="px-3 py-2 text-left font-semibold">Period</th>
              <th className="px-3 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {active.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-deh-sm italic text-deh-muted">No active DRs.</td></tr>
            ) : active.map((r) => <DrRow key={r.id} row={r} />)}
          </tbody>
        </table>
      </section>

      {retired.length > 0 ? (
        <section>
          <h2 className="mb-2 text-deh-lg font-semibold text-deh-dark">Past DRs</h2>
          <table className="w-full border-collapse text-deh-base">
            <thead className="text-deh-xs uppercase tracking-wide text-deh-muted">
              <tr className="border-b border-deh-border">
                <th className="px-3 py-2 text-left font-semibold">Building</th>
                <th className="px-3 py-2 text-left font-semibold">Khidmat Guzar</th>
                <th className="px-3 py-2 text-left font-semibold">Username</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-left font-semibold">Period</th>
                <th className="px-3 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {retired.map((r) => <DrRow key={r.id} row={r} />)}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
