import type { AdminRequisition } from "@/lib/admin/types";

interface FinancialOverviewProps {
  requisitions: AdminRequisition[];
}

function formatRupees(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function FinancialOverview({ requisitions }: FinancialOverviewProps) {
  const now = new Date();
  const currentMonth = now.getUTCMonth();
  const currentYear = now.getUTCFullYear();

  let totalApproved = 0;
  let monthApproved = 0;
  let pendingCost = 0;

  for (const r of requisitions) {
    const cost = Number(r.estCost) || 0;
    if (r.adminApproval === "Approved") {
      totalApproved += cost;
      if (r.createdAt) {
        const d = new Date(r.createdAt);
        if (d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear) {
          monthApproved += cost;
        }
      } else {
        monthApproved += cost;
      }
    } else if (r.adminApproval === "Pending") {
      pendingCost += cost;
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <FinCard label="Total Approved" value={formatRupees(totalApproved)} tone="resolved" />
      <FinCard label="This Month" value={formatRupees(monthApproved)} tone="blue" />
      <FinCard label="Pending Cost" value={formatRupees(pendingCost)} tone="warning" />
    </div>
  );
}

function FinCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "resolved" | "blue" | "warning";
}) {
  const accent =
    tone === "resolved"
      ? "border-l-status-resolved"
      : tone === "blue"
        ? "border-l-deh-blue"
        : "border-l-urgency-high";
  return (
    <div
      className={`rounded-deh-lg border-l-4 bg-deh-white p-4 ring-1 ring-deh-border ${accent}`}
    >
      <div className="text-deh-xs uppercase tracking-wide text-deh-muted">{label}</div>
      <div className="mt-1 text-deh-xl font-semibold text-deh-text">{value}</div>
    </div>
  );
}
