import { desc, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { db } from "@/db/client";
import { tickets } from "@/db/schema";
import { getTenantProfileFromSession } from "@/lib/tenant-profile";
import { greetingFor } from "@/lib/format";
import { TicketRow } from "@/components/shared/ticket-row";
import { ProfileCard } from "./profile-card";

export const dynamic = "force-dynamic";

export default async function TenantDashboardPage() {
  const profile = await getTenantProfileFromSession();
  if (!profile) redirect("/login");

  const myTickets = await db
    .select({
      referenceCode: tickets.referenceCode,
      type: tickets.type,
      status: tickets.status,
      submittedAt: tickets.submittedAt,
      attachments: tickets.attachments,
    })
    .from(tickets)
    .where(sql`lower(${tickets.tenantEmail}) = lower(${profile.email})`)
    .orderBy(desc(tickets.submittedAt));

  return (
    <div className="space-y-8">
      <header>
        <p className="text-deh-xs font-semibold uppercase tracking-widest text-deh-blue">
          {greetingFor()}
        </p>
        <h1 className="mt-1 font-display text-deh-2xl font-bold text-deh-dark">
          Hello, {profile.fullName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-deh-sm text-deh-muted">
          {profile.buildingName} — Wing {profile.wing || "—"}, Flat {profile.flat || "—"}
        </p>
      </header>

      <ProfileCard profile={profile} />

      <section className="rounded-deh-xl bg-white p-5 shadow-deh-card ring-1 ring-deh-border">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-deh-lg font-semibold text-deh-dark">My tickets</h2>
          <Link
            href="/tenant/tickets/new"
            className="inline-flex items-center gap-1.5 rounded-deh-pill bg-deh-blue px-4 py-2 text-deh-sm font-semibold text-white shadow-deh-card-hover transition-colors hover:bg-deh-dark-blue"
          >
            <PlusCircle className="h-4 w-4" />
            Raise a ticket
          </Link>
        </div>

        {myTickets.length === 0 ? (
          <p className="rounded-deh-md border border-dashed border-deh-border px-4 py-8 text-center text-deh-sm text-deh-muted">
            No tickets yet.{" "}
            <Link href="/tenant/tickets/new" className="text-deh-blue underline">
              Raise a ticket
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-2">
            {myTickets.map((t) => (
              <li key={t.referenceCode}>
                <TicketRow
                  ticket={t}
                  href={`/tenant/tickets/${encodeURIComponent(t.referenceCode)}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
