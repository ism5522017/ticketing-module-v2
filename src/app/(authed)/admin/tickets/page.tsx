import { redirect } from "next/navigation";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import { listAdminTickets } from "@/lib/admin/directory";
import { DirectoryShell } from "./directory-shell";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const profile = await getAdminProfileFromSession();
  if (!profile) redirect("/login");

  const tickets = await listAdminTickets();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-deh-xl font-bold text-deh-text">Tickets Directory</h1>
        <p className="mt-1 text-deh-sm text-deh-muted">Signed in as {profile.fullName}</p>
      </header>

      <DirectoryShell tickets={tickets} />
    </div>
  );
}
