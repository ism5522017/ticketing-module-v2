import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  type LucideIcon,
  Ticket,
} from "lucide-react";
import type { DrStats } from "@/lib/dr/building-stats";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent: string;
  icon: LucideIcon;
}

function StatCard({ label, value, hint, accent, icon: Icon }: StatCardProps) {
  return (
    <div className="relative flex flex-col gap-3 overflow-hidden rounded-deh-xl bg-white p-5 shadow-deh-card ring-1 ring-deh-border">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-deh-md text-white ${accent}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-deh-xs font-semibold uppercase tracking-wide text-deh-muted">
          {label}
        </div>
        <div className="mt-0.5 font-display text-deh-2xl font-bold text-deh-dark">
          {value}
        </div>
        {hint ? (
          <div className="mt-0.5 text-deh-xs text-deh-muted">{hint}</div>
        ) : null}
      </div>
    </div>
  );
}

export function StatsRow({ stats }: { stats: DrStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard label="Total" value={stats.total} accent="bg-deh-gradient-sky" icon={Ticket} />
      <StatCard label="Open" value={stats.open} accent="bg-deh-gradient-rose" icon={AlertTriangle} />
      <StatCard label="In progress" value={stats.progress} accent="bg-deh-gradient-sun" icon={Loader2} />
      <StatCard label="Resolved" value={stats.resolved} accent="bg-deh-gradient-leaf" icon={CheckCircle2} />
      <StatCard
        label="Avg resolution"
        value={stats.avg_resolution_hours > 0 ? stats.avg_resolution_hours.toFixed(1) : "—"}
        hint={stats.avg_resolution_hours > 0 ? "hours" : undefined}
        accent="bg-deh-gradient-warm"
        icon={Clock}
      />
    </div>
  );
}
