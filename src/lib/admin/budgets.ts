import "server-only";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { monthlyBudgets, requisitions, tickets } from "@/db/schema";

/**
 * Categories the tenant/DR forms emit. The editor renders this list as the
 * canonical set even when a category has no budget row yet — admins can then
 * type an amount into any of them. Extra categories returned by the server
 * (e.g. an old issue type still attached to a requisition) are appended.
 */
export const BUDGET_CATEGORIES = [
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
] as const;

const TOTAL_KEY = "total";

export interface BudgetCategoryRow {
  category: string;
  budget: number;
  spend: number;
  remaining: number;
}

export interface BudgetSummary {
  periodStart: string;
  periodLabel: string;
  total: { budget: number; spend: number; remaining: number };
  categories: BudgetCategoryRow[];
}

/** Normalize a YYYY-MM or YYYY-MM-DD string (or undefined) to the first of the month, ISO. */
export function normalizePeriod(value?: string | null): string {
  let d: Date;
  if (!value) d = new Date();
  else {
    const parsed = new Date(`${value}-01`.slice(0, 10));
    d = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

function nextMonth(periodStart: string): string {
  const d = new Date(`${periodStart}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

function labelFor(periodStart: string): string {
  const d = new Date(`${periodStart}T00:00:00Z`);
  return d.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export async function getBudgetSummary(periodOrNull?: string | null): Promise<BudgetSummary> {
  const periodStart = normalizePeriod(periodOrNull);
  const periodEnd = nextMonth(periodStart);

  const budgetRows = await db
    .select({ category: monthlyBudgets.category, amount: monthlyBudgets.amount })
    .from(monthlyBudgets)
    .where(eq(monthlyBudgets.periodStart, periodStart));

  const budgets = new Map<string, number>();
  for (const b of budgetRows) {
    budgets.set(b.category.toLowerCase(), Number(b.amount ?? 0));
  }

  const spendRows = await db
    .select({
      type: tickets.type,
      total: sql<string>`coalesce(sum(${requisitions.estCost}), 0)`,
    })
    .from(requisitions)
    .innerJoin(tickets, eq(tickets.id, requisitions.issueId))
    .where(
      and(
        eq(requisitions.adminApproval, "Approved"),
        gte(tickets.submittedAt, periodStart),
        lt(tickets.submittedAt, periodEnd),
      ),
    )
    .groupBy(tickets.type);

  const spendByCategory = new Map<string, number>();
  for (const s of spendRows) {
    spendByCategory.set(s.type.toLowerCase(), Number(s.total ?? 0));
  }

  const totalBudget = budgets.get(TOTAL_KEY) ?? 0;
  const totalSpend = Array.from(spendByCategory.values()).reduce((a, b) => a + b, 0);

  const seen = new Set<string>();
  for (const k of budgets.keys()) if (k !== TOTAL_KEY) seen.add(k);
  for (const k of spendByCategory.keys()) seen.add(k);

  const categories: BudgetCategoryRow[] = Array.from(seen)
    .sort()
    .map((lower) => {
      const budget = budgets.get(lower) ?? 0;
      const spend = spendByCategory.get(lower) ?? 0;
      const canonical = BUDGET_CATEGORIES.find((c) => c.toLowerCase() === lower);
      return {
        category: canonical ?? lower,
        budget,
        spend,
        remaining: budget - spend,
      };
    });

  return {
    periodStart,
    periodLabel: labelFor(periodStart),
    total: { budget: totalBudget, spend: totalSpend, remaining: totalBudget - totalSpend },
    categories,
  };
}

export async function upsertBudget(
  category: string,
  amount: number,
  periodOrNull?: string | null,
): Promise<void> {
  const periodStart = normalizePeriod(periodOrNull);
  const cat = category.trim();
  if (!cat) throw new Error("Category required");
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Amount must be ≥ 0");

  const existing = await db
    .select({ id: monthlyBudgets.id })
    .from(monthlyBudgets)
    .where(
      and(
        eq(monthlyBudgets.periodStart, periodStart),
        sql`lower(${monthlyBudgets.category}) = ${cat.toLowerCase()}`,
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(monthlyBudgets)
      .set({ amount: String(amount), updatedAt: new Date().toISOString() })
      .where(eq(monthlyBudgets.id, existing[0].id));
  } else {
    await db.insert(monthlyBudgets).values({
      periodStart,
      category: cat,
      amount: String(amount),
    });
  }
}
