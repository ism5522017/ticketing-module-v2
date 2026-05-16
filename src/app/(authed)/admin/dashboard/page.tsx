import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Loader2,
  type LucideIcon,
  Ticket,
} from "lucide-react";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import { listAdminTickets } from "@/lib/admin/directory";
import { getBudgetSummary } from "@/lib/admin/budgets";
import { FinancialOverview } from "./financial-overview";
import { BudgetSnapshot } from "./budget-snapshot";
import { BuildingHeatmap } from "./building-heatmap";
import { IssueTypeChart, ResolvedChart, StatusChart, UrgencyChart } from "./charts";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const profile = await getAdminProfileFromSession();
  if (!profile) redirect("/login");

  const [tickets, budgetSummary] = await Promise.all([
    listAdminTickets(),
    getBudgetSummary(),
  ]);

  const requisitions = tickets
    .map((t) => t.requisition)
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    progress: tickets.filter((t) => t.status === "progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-deh-xs font-semibold uppercase tracking-widest text-deh-blue">
            Overview
          </p>
          <h1 className="mt-1 font-display text-deh-2xl font-bold text-deh-dark">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-deh-sm text-deh-muted">
            Welcome back, {profile.fullName}.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatLink
          href="/admin/tickets?filter=All"
          label="Total tickets"
          value={stats.total}
          accent="bg-deh-gradient-sky"
          icon={Ticket}
        />
        <StatLink
          href="/admin/tickets?filter=Open"
          label="Open"
          value={stats.open}
          accent="bg-deh-gradient-rose"
          icon={AlertTriangle}
        />
        <StatLink
          href="/admin/tickets?filter=In%20Progress"
          label="In progress"
          value={stats.progress}
          accent="bg-deh-gradient-sun"
          icon={Loader2}
        />
        <StatLink
          href="/admin/tickets?filter=Resolved"
          label="Resolved"
          value={stats.resolved}
          accent="bg-deh-gradient-leaf"
          icon={CheckCircle2}
        />
      </div>

      <FinancialOverview requisitions={requisitions} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BudgetSnapshot summary={budgetSummary} />
        <section className="rounded-deh-xl bg-white p-5 shadow-deh-card ring-1 ring-deh-border">
          <h2 className="mb-3 font-display text-deh-lg font-semibold text-deh-dark">
            Building Heatmap
          </h2>
          <BuildingHeatmap tickets={tickets} />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Urgency Breakdown (Active)">
          <UrgencyChart tickets={tickets} />
        </ChartCard>
        <ChartCard title="Tickets Over Time">
          <StatusChart tickets={tickets} />
        </ChartCard>
        <ChartCard title="Issue Types (Active)">
          <IssueTypeChart tickets={tickets} />
        </ChartCard>
        <ChartCard title="Resolved Cumulative">
          <ResolvedChart tickets={tickets} />
        </ChartCard>
      </div>
    </div>
  );
}

function StatLink({
  href,
  label,
  value,
  accent,
  icon: Icon,
}: {
  href: string;
  label: string;
  value: number;
  accent: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-deh-xl bg-white p-5 shadow-deh-card shadow-deh-card-hover ring-1 ring-deh-border"
    >
      <div className="flex items-start justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-deh-md text-white ${accent}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <CircleDashed className="h-4 w-4 text-deh-muted-light opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div>
        <div className="text-deh-xs font-semibold uppercase tracking-wide text-deh-muted">
          {label}
        </div>
        <div className="mt-0.5 font-display text-deh-3xl font-bold text-deh-dark">
          {value}
        </div>
      </div>
      <span className="text-deh-xs font-medium text-deh-blue opacity-80 transition-opacity group-hover:opacity-100">
        View tickets →
      </span>
    </Link>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-deh-xl bg-white p-5 shadow-deh-card ring-1 ring-deh-border">
      <h2 className="mb-3 font-display text-deh-lg font-semibold text-deh-dark">
        {title}
      </h2>
      {children}
    </section>
  );
}
