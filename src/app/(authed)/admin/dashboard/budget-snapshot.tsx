import Link from "next/link";
import { BudgetBar } from "@/components/shared/budget-bar";
import type { BudgetSummary } from "@/lib/admin/budgets";

export function BudgetSnapshot({ summary }: { summary: BudgetSummary }) {
  const hasContent =
    summary.total.budget > 0 ||
    summary.categories.some((c) => c.budget > 0 || c.spend > 0);

  return (
    <section className="rounded-deh-lg bg-deh-white p-4 ring-1 ring-deh-border">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-deh-md font-semibold text-deh-text">Budget Snapshot</h2>
          <p className="text-deh-xs text-deh-muted">{summary.periodLabel}</p>
        </div>
        <Link
          href="/admin/budgets"
          className="text-deh-xs font-semibold text-deh-blue hover:underline"
        >
          Manage budgets →
        </Link>
      </header>

      {!hasContent ? (
        <p className="text-deh-sm text-deh-muted">
          No budget set for this month yet. Click "Manage budgets" to set one.
        </p>
      ) : (
        <>
          <BudgetBar
            budget={summary.total.budget}
            spend={summary.total.spend}
            label="Total"
          />
          <div className="mt-4 space-y-0">
            {summary.categories
              .filter((c) => c.budget > 0 || c.spend > 0)
              .sort((a, b) => b.spend - a.spend)
              .slice(0, 6)
              .map((c) => (
                <BudgetBar
                  key={c.category}
                  budget={c.budget}
                  spend={c.spend}
                  label={c.category}
                />
              ))}
          </div>
        </>
      )}
    </section>
  );
}
