import { redirect } from "next/navigation";
import { getDrProfileFromSession } from "@/lib/dr/dr-profile";
import { TICKET_CATEGORIES } from "@/lib/triage";
import { DrTicketForm } from "./dr-ticket-form";

export const dynamic = "force-dynamic";

export default async function DrNewTicketPage() {
  const profile = await getDrProfileFromSession();
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-deh-xl font-bold text-deh-text">Raise an issue</h1>
        <p className="mt-1 text-deh-sm text-deh-muted">
          Building-level concerns route to maintenance; society-level queries go to the
          admin desk.
        </p>
      </header>

      <section className="rounded-deh-lg bg-deh-white p-5 ring-1 ring-deh-border">
        <h2 className="mb-3 text-deh-md font-semibold text-deh-text">Your details</h2>
        <dl className="grid grid-cols-1 gap-2 text-deh-sm sm:grid-cols-2">
          <div>
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">DR</dt>
            <dd className="text-deh-text">{profile.fullName}</dd>
          </div>
          <div>
            <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Building</dt>
            <dd className="text-deh-text">{profile.buildingName}</dd>
          </div>
        </dl>
      </section>

      <DrTicketForm categories={[...TICKET_CATEGORIES]} />
    </div>
  );
}
