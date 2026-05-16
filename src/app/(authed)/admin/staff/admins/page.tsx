import { redirect } from "next/navigation";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import { listAdmins } from "@/lib/admin/staff-list";
import { AdminRow } from "./admin-row";
import { NewAdminForm } from "./new-admin-form";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const profile = await getAdminProfileFromSession();
  if (!profile) redirect("/login");

  const rows = await listAdmins();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-deh-xl font-bold text-deh-dark">Admins</h1>
        <p className="text-deh-sm text-deh-muted">
          Manage admin accounts. You can&apos;t disable your own account, and at least one active admin must remain at all times.
        </p>
      </header>

      <NewAdminForm />

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
            <AdminRow key={r.id} row={r} selfAdminId={profile.adminId} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
