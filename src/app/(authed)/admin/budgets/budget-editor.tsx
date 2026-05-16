"use client";

import { useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { BudgetBar } from "@/components/shared/budget-bar";
import type { BudgetSummary, BudgetCategoryRow } from "@/lib/admin/budgets";
import { saveBudget } from "./actions";

const BUDGET_CATEGORIES = [
  "Water leak",
  "Electricity problem",
  "AC not working",
  "Broken door / window",
  "Plumbing issue",
  "Elevator issue",
  "Pest / insects",
  "Sewage / flooding",
  "Fire or safety hazard",
  "Gas leak",
  "Broken window / latch",
  "Common area maintenance",
  "Security / access",
  "Society query",
  "Other",
];

function formatRupees(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function BudgetEditor({ summary }: { summary: BudgetSummary }) {
  const allCategories = useMemo(() => {
    const byKey = new Map<string, BudgetCategoryRow>();
    for (const c of summary.categories) byKey.set(c.category.toLowerCase(), c);
    const list: BudgetCategoryRow[] = [];
    for (const name of BUDGET_CATEGORIES) {
      const found = byKey.get(name.toLowerCase());
      list.push(found ?? { category: name, budget: 0, spend: 0, remaining: 0 });
      byKey.delete(name.toLowerCase());
    }
    for (const extra of byKey.values()) list.push(extra);
    return list;
  }, [summary]);

  return (
    <div className="space-y-6">
      <section className="rounded-deh-lg bg-deh-white p-4 ring-1 ring-deh-border">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-deh-md font-semibold text-deh-text">Total Budget</h2>
            <p className="text-deh-xs text-deh-muted">{summary.periodLabel}</p>
          </div>
        </header>
        <BudgetBar
          budget={summary.total.budget}
          spend={summary.total.spend}
          label="Overall"
        />
        <SaveRow
          initialAmount={summary.total.budget}
          category="total"
          label="Total monthly budget"
          period={summary.periodStart}
        />
      </section>

      <section className="overflow-hidden rounded-deh-lg bg-deh-white ring-1 ring-deh-border">
        <header className="bg-deh-gray-bg px-4 py-2 text-deh-sm font-semibold text-deh-text">
          Per-category budgets
        </header>
        <table className="w-full text-deh-sm">
          <thead>
            <tr className="border-b border-deh-border text-left text-deh-xs uppercase tracking-wide text-deh-muted">
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Budget (₹)</th>
              <th className="px-4 py-2 text-right">Spend</th>
              <th className="px-4 py-2 text-right">Remaining</th>
              <th className="px-4 py-2 text-right">Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-deh-border">
            {allCategories.map((c) => (
              <CategoryRow key={c.category} row={c} period={summary.periodStart} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function CategoryRow({ row, period }: { row: BudgetCategoryRow; period: string }) {
  const remainingClass =
    row.remaining < 0 ? "text-urgency-critical font-semibold" : "text-deh-text";
  return (
    <tr>
      <td className="px-4 py-2 text-deh-text">{row.category}</td>
      <td className="px-4 py-2">
        <SaveRow
          inline
          initialAmount={row.budget}
          category={row.category}
          period={period}
        />
      </td>
      <td className="px-4 py-2 text-right text-deh-text">₹{formatRupees(row.spend)}</td>
      <td className={cn("px-4 py-2 text-right", remainingClass)}>
        ₹{formatRupees(row.remaining)}
      </td>
      <td className="px-4 py-2 text-right" />
    </tr>
  );
}

function SaveRow({
  initialAmount,
  category,
  period,
  label,
  inline,
}: {
  initialAmount: number;
  category: string;
  period: string;
  label?: string;
  inline?: boolean;
}) {
  const [value, setValue] = useState(String(initialAmount));
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    setStatus("idle");
    setError(null);
    startTransition(async () => {
      const res = await saveBudget(category, value, period);
      if (!res.ok) {
        setError(res.error);
        setStatus("error");
      } else {
        setStatus("saved");
      }
    });
  }

  if (inline) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setStatus("idle");
          }}
          className="w-32 rounded-deh-sm border border-deh-border bg-deh-white px-2 py-1 text-deh-sm outline-none focus:border-deh-blue"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={onSave}
          className="rounded-deh-md bg-deh-blue px-3 py-1 text-deh-xs font-medium text-white hover:bg-deh-dark disabled:opacity-50"
        >
          {isPending ? "…" : "Save"}
        </button>
        {status === "saved" ? (
          <span className="text-deh-xs text-status-resolved">Saved</span>
        ) : null}
        {status === "error" ? (
          <span className="text-deh-xs text-urgency-critical">{error}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      {label ? (
        <label className="text-deh-xs uppercase tracking-wide text-deh-muted">{label}</label>
      ) : null}
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setStatus("idle");
        }}
        className="w-40 rounded-deh-sm border border-deh-border bg-deh-white px-2 py-1.5 text-deh-sm outline-none focus:border-deh-blue"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={onSave}
        className="rounded-deh-md bg-deh-blue px-3 py-1.5 text-deh-xs font-medium text-white hover:bg-deh-dark disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
      {status === "saved" ? (
        <span className="text-deh-xs text-status-resolved">Saved</span>
      ) : null}
      {status === "error" ? (
        <span className="text-deh-xs text-urgency-critical">{error}</span>
      ) : null}
    </div>
  );
}
