import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { requisitions, tickets } from "@/db/schema";
import { getManagerProfileFromSession } from "@/lib/manager/manager-profile";
import { formatSubmittedAt } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function approvalPillClass(status: "Pending" | "Approved" | "Rejected"): string {
  switch (status) {
    case "Approved":
      return "bg-status-resolved/10 text-status-resolved";
    case "Rejected":
      return "bg-urgency-critical/10 text-urgency-critical";
    default:
      return "bg-status-open/10 text-status-open";
  }
}

function formatRupees(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default async function ManagerRequisitionsPage() {
  const profile = await getManagerProfileFromSession();
  if (!profile) redirect("/login");

  const rows = await db
    .select({
      id: requisitions.id,
      referenceCode: tickets.referenceCode,
      type: tickets.type,
      estCost: requisitions.estCost,
      inHouseFix: requisitions.inHouseFix,
      vendorName: requisitions.vendorName,
      adminApproval: requisitions.adminApproval,
      vendorConfirmed: requisitions.vendorConfirmed,
      submittedAt: requisitions.submittedAt,
    })
    .from(requisitions)
    .innerJoin(tickets, eq(tickets.id, requisitions.issueId))
    .orderBy(desc(requisitions.submittedAt));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-deh-xl font-bold text-deh-text">Requisitions</h1>
        <p className="mt-1 text-deh-sm text-deh-muted">
          {rows.length} requisition{rows.length === 1 ? "" : "s"} submitted.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-deh-md border border-dashed border-deh-border px-4 py-8 text-center text-deh-sm text-deh-muted">
          No requisitions yet. Create one from a ticket in the{" "}
          <a href="/manager/dashboard" className="text-deh-blue underline">
            Dashboard
          </a>
          .
        </p>
      ) : (
        <div className="overflow-hidden rounded-deh-lg bg-deh-white ring-1 ring-deh-border">
          <table className="w-full text-deh-sm">
            <thead className="bg-deh-gray-bg text-left text-deh-xs uppercase tracking-wide text-deh-muted">
              <tr>
                <th className="px-4 py-2">Ticket</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Vendor / Mode</th>
                <th className="px-4 py-2">Est. Cost</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-deh-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-deh-gray-bg/50">
                  <td className="px-4 py-2">
                    <a
                      href="/manager/dashboard"
                      className="font-mono text-deh-blue hover:underline"
                    >
                      {r.referenceCode}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-deh-text">{r.type}</td>
                  <td className="px-4 py-2 text-deh-text">
                    {r.inHouseFix ? "In-house" : r.vendorName ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-deh-text">₹{formatRupees(String(r.estCost))}</td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "rounded-deh-pill px-2 py-0.5 text-deh-xs font-semibold",
                        approvalPillClass(r.adminApproval),
                      )}
                    >
                      {r.adminApproval}
                    </span>
                    {r.vendorConfirmed ? (
                      <span className="ml-1.5 rounded-deh-pill bg-status-resolved px-2 py-0.5 text-deh-xs font-semibold text-white">
                        ✓ Confirmed
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-deh-muted">
                    {formatSubmittedAt(String(r.submittedAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
