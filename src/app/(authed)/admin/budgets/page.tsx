import { redirect } from "next/navigation";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";
import { getBudgetSummary } from "@/lib/admin/budgets";
import { BudgetEditor } from "./budget-editor";

export const dynamic = "force-dynamic";

export default async function AdminBudgetsPage() {
  const profile = await getAdminProfileFromSession();
  if (!profile) redirect("/login");

  const summary = await getBudgetSummary();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-deh-xl font-bold text-deh-text">Monthly Budgets</h1>
        <p className="mt-1 text-deh-sm text-deh-muted">
          {summary.periodLabel} · Signed in as {profile.fullName}
        </p>
      </header>

      <BudgetEditor summary={summary} />
    </div>
  );
}
