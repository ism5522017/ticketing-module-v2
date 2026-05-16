import { redirect } from "next/navigation";
import { getTenantProfileFromSession } from "@/lib/tenant-profile";
import { TICKET_CATEGORIES } from "@/lib/triage";
import { TicketForm } from "./ticket-form";

export const dynamic = "force-dynamic";

export default async function NewTicketPage() {
  const profile = await getTenantProfileFromSession();
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-deh-xl font-bold text-deh-text">Raise a ticket</h1>
        <p className="mt-1 text-deh-sm text-deh-muted">
          We&apos;ll route this to maintenance and follow up on your dashboard.
        </p>
      </header>

      <section className="rounded-deh-lg bg-deh-white p-5 ring-1 ring-deh-border">
        <h2 className="mb-3 text-deh-md font-semibold text-deh-text">Your details</h2>
        <dl className="grid grid-cols-1 gap-2 text-deh-sm sm:grid-cols-3">
          <div>
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Name</dt>
            <dd className="text-deh-text">{profile.fullName}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Location</dt>
            <dd className="text-deh-text">{profile.location}</dd>
          </div>
          <div className="sm:col-span-3">
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Unit</dt>
            <dd className="text-deh-text">
              Wing {profile.wing || "—"}, Flat {profile.flat || "—"}
            </dd>
          </div>
        </dl>
      </section>

      <TicketForm categories={[...TICKET_CATEGORIES]} />
    </div>
  );
}
