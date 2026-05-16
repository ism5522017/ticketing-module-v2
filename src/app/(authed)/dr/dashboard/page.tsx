import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { getDrProfileFromSession } from "@/lib/dr/dr-profile";
import { getBuildingStats, listTicketsForDr } from "@/lib/dr/building-stats";
import { StatsRow } from "./stats-row";
import { UrgencyBreakdown } from "./urgency-breakdown";
import { TicketList } from "./ticket-list";

export const dynamic = "force-dynamic";

export default async function DrDashboardPage() {
  const profile = await getDrProfileFromSession();
  if (!profile) redirect("/login");

  const [stats, tickets] = await Promise.all([
    getBuildingStats(profile.buildingId),
    listTicketsForDr({ drId: profile.drId, buildingId: profile.buildingId }),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-deh-xs font-semibold uppercase tracking-widest text-deh-blue">
            {profile.buildingName}
          </p>
          <h1 className="mt-1 font-display text-deh-2xl font-bold text-deh-dark">
            Building overview
          </h1>
          <p className="mt-1 text-deh-sm text-deh-muted">
            Welcome back, {profile.fullName}.
          </p>
        </div>
        <Link
          href="/dr/tickets/new"
          className="inline-flex items-center gap-2 rounded-deh-pill bg-deh-blue px-4 py-2 text-deh-sm font-semibold text-white shadow-deh-card-hover transition-colors hover:bg-deh-dark-blue"
        >
          <PlusCircle className="h-4 w-4" />
          Raise an issue
        </Link>
      </header>

      <StatsRow stats={stats} />

      <section className="rounded-deh-xl bg-white p-5 shadow-deh-card ring-1 ring-deh-border">
        <h2 className="mb-3 font-display text-deh-md font-semibold text-deh-dark">
          Active urgency
        </h2>
        <UrgencyBreakdown byUrgency={stats.by_urgency} />
      </section>

      <section className="rounded-deh-xl bg-white p-5 shadow-deh-card ring-1 ring-deh-border">
        <h2 className="mb-3 font-display text-deh-lg font-semibold text-deh-dark">
          Tickets
        </h2>
        <TicketList tickets={tickets} />
      </section>
    </div>
  );
}
