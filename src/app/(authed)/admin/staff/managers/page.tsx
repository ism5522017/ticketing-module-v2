import { redirect } from "next/navigation";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import { listManagers } from "@/lib/admin/staff-list";
import { ManagerRow } from "./manager-row";
import { NewManagerForm } from "./new-manager-form";

export const dynamic = "force-dynamic";

export default async function ManagersPage() {
  const profile = await getAdminProfileFromSession();
  if (!profile) redirect("/login");

  const rows = await listManagers();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-deh-xl font-bold text-deh-dark">Managers</h1>
        <p className="text-deh-sm text-deh-muted">
          Managers see every ticket, update statuses, and submit requisitions for admin approval.
        </p>
      </header>

      <NewManagerForm />

      <table className="w-full border-collapse text-deh-base">
        <thead className="text-deh-xs uppercase tracking-wide text-deh-muted">
          <tr className="border-b border-deh-border">
            <th className="px-3 py-2 text-left font-semibold">Name</th>
            <th className="px-3 py-2 text-left font-semibold">Username</th>
            <th className="px-3 py-2 text-left font-semibold">Status</th>
            <th className="px-3 py-2 text-left font-semibold">Created</th>
            <th className="px-3 py-2 text-left font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <ManagerRow key={r.id} row={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
