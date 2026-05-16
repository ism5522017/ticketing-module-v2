import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  ClipboardList,
  Hourglass,
  type LucideIcon,
  XCircle,
} from "lucide-react";
import { getManagerProfileFromSession } from "@/lib/manager/manager-profile";
import { computeManagerStats, listManagerTickets } from "@/lib/manager/directory";
import { DirectoryShell } from "./directory-shell";

export const dynamic = "force-dynamic";

export default async function ManagerDashboardPage() {
  const profile = await getManagerProfileFromSession();
  if (!profile) redirect("/login");

  const rows = await listManagerTickets();
  const stats = computeManagerStats(rows);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-deh-xs font-semibold uppercase tracking-widest text-deh-blue">
            Manager workspace
          </p>
          <h1 className="mt-1 font-display text-deh-2xl font-bold text-deh-dark">
            Tickets Directory
          </h1>
          <p className="mt-1 text-deh-sm text-deh-muted">
            Welcome back, {profile.fullName}.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatLink
          filter="Pending"
          label="Pending"
          value={stats.pending}
          accent="bg-deh-gradient-rose"
          icon={ClipboardList}
        />
        <StatLink
          filter="Awaiting Admin"
          label="Awaiting admin"
          value={stats.awaiting}
          accent="bg-deh-gradient-sun"
          icon={Hourglass}
        />
        <StatLink
          filter="Approved"
          label="Approved"
          value={stats.approved}
          accent="bg-deh-gradient-leaf"
          icon={CheckCircle2}
        />
        <StatLink
          filter="Rejected"
          label="Rejected"
          value={stats.rejected}
          accent="bg-deh-gradient-warm"
          icon={XCircle}
        />
      </div>

      <DirectoryShell tickets={rows} />
    </div>
  );
}

function StatLink({
  filter,
  label,
  value,
  accent,
  icon: Icon,
}: {
  filter: string;
  label: string;
  value: number;
  accent: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={`/manager/dashboard?filter=${encodeURIComponent(filter)}`}
      scroll
      className="group relative flex flex-col gap-3 overflow-hidden rounded-deh-xl bg-white p-5 shadow-deh-card shadow-deh-card-hover ring-1 ring-deh-border"
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-deh-md text-white ${accent}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-deh-xs font-semibold uppercase tracking-wide text-deh-muted">
          {label}
        </div>
        <div className="mt-0.5 font-display text-deh-3xl font-bold text-deh-dark">
          {value}
        </div>
      </div>
      <span className="text-deh-xs font-medium text-deh-blue opacity-80 transition-opacity group-hover:opacity-100">
        Filter ↓
      </span>
    </Link>
  );
}
