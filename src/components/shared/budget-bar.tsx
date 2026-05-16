import { cn } from "@/lib/utils";

interface BudgetBarProps {
  budget: number;
  spend: number;
  label: string;
}

function formatRupees(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function BudgetBar({ budget, spend, label }: BudgetBarProps) {
  const safeBudget = Number.isFinite(budget) ? budget : 0;
  const safeSpend = Number.isFinite(spend) ? spend : 0;
  const pct =
    safeBudget > 0 ? Math.min(100, (safeSpend / safeBudget) * 100) : safeSpend > 0 ? 100 : 0;
  const overBudget = safeBudget > 0 && safeSpend > safeBudget;
  const barClass = overBudget
    ? "bg-urgency-critical"
    : pct > 80
      ? "bg-urgency-high"
      : "bg-status-resolved";

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-deh-xs">
        <span className="font-semibold text-deh-text">{label}</span>
        <span className="text-deh-muted">
          ₹{formatRupees(safeSpend)} /{" "}
          {safeBudget > 0 ? `₹${formatRupees(safeBudget)}` : "no budget set"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-deh-gray-200">
        <div
          className={cn("h-full transition-all duration-300", barClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {overBudget ? (
        <div className="mt-1 text-[11px] text-urgency-critical">
          Over budget by ₹{formatRupees(safeSpend - safeBudget)}
        </div>
      ) : null}
    </div>
  );
}
