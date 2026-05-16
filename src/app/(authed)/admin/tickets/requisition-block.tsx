"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { formatSubmittedAt } from "@/lib/format";
import { AttachmentGallery } from "@/components/shared/lightbox";
import type { AdminRequisition } from "@/lib/admin/types";
import { approveRequisition, rejectRequisition } from "./actions";

function formatRupees(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function RequisitionBlock({
  referenceCode,
  req,
}: {
  referenceCode: string;
  req: AdminRequisition;
}) {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const badgeClass =
    req.adminApproval === "Approved"
      ? "bg-status-resolved/10 text-status-resolved"
      : req.adminApproval === "Rejected"
        ? "bg-urgency-critical/10 text-urgency-critical"
        : "bg-status-open/10 text-status-open";

  function onApprove() {
    setError(null);
    startTransition(async () => {
      const res = await approveRequisition(referenceCode, remarks);
      if (!res.ok) setError(res.error);
      else setRemarks("");
    });
  }

  function onReject() {
    setError(null);
    startTransition(async () => {
      const res = await rejectRequisition(referenceCode, remarks);
      if (!res.ok) setError(res.error);
      else setRemarks("");
    });
  }

  return (
    <div className="mt-2 space-y-2 rounded-deh-md bg-deh-gray-bg p-3 ring-1 ring-deh-border">
      <div className="flex items-center justify-between">
        <strong className="text-deh-sm text-deh-blue">Manager Requisition</strong>
        <span className={cn("rounded-deh-pill px-2 py-0.5 text-deh-xs font-semibold", badgeClass)}>
          {req.adminApproval}
        </span>
      </div>

      <div className="text-deh-sm text-deh-text">
        Estimated Cost: ₹{formatRupees(req.estCost)}
        <span className="mx-1.5">·</span>
        {req.inHouseFix ? "In-house fix" : `Vendor: ${req.vendorName ?? "—"}`}
      </div>

      {req.costBreakdown ? (
        <pre className="whitespace-pre-line text-deh-xs text-deh-muted">{req.costBreakdown}</pre>
      ) : null}

      {req.adminRemarks ? (
        <p className="border-l-2 border-deh-yellow pl-2 text-deh-xs italic text-deh-muted">
          Admin Remarks: {req.adminRemarks}
        </p>
      ) : null}

      {req.invoices.length > 0 ? (
        <div>
          <div className="mb-1 text-deh-xs uppercase tracking-wide text-deh-muted">Invoices</div>
          <AttachmentGallery attachments={req.invoices} />
        </div>
      ) : null}

      {req.vendorConfirmed ? (
        <div className="flex flex-wrap items-center gap-2 rounded-deh-md bg-status-resolved/10 p-2 ring-1 ring-status-resolved/30">
          <span className="rounded-deh-pill bg-status-resolved px-2 py-0.5 text-deh-xs font-semibold text-white">
            ✓ Vendor Confirmed
          </span>
          <span className="text-deh-xs text-deh-muted">
            by {req.vendorConfirmedBy ?? "—"}
            {req.vendorConfirmedAt ? (
              <>
                <span className="mx-1">·</span>
                {formatSubmittedAt(req.vendorConfirmedAt)}
              </>
            ) : null}
          </span>
          {req.vendorProof.length > 0 ? (
            <span className="ml-auto">
              <AttachmentGallery attachments={req.vendorProof.slice(0, 1)} />
            </span>
          ) : null}
        </div>
      ) : null}

      {req.adminApproval === "Pending" ? (
        <div className="space-y-2">
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add remarks (optional)…"
            className="h-16 w-full rounded-deh-sm border border-deh-border bg-deh-white px-2 py-1.5 text-deh-xs text-deh-text outline-none focus:border-deh-blue"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={onApprove}
              className="rounded-deh-md bg-deh-blue px-3 py-1.5 text-deh-xs font-medium text-white hover:bg-deh-dark disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Approve Requisition"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={onReject}
              className="rounded-deh-md bg-urgency-critical px-3 py-1.5 text-deh-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
          {error ? (
            <p className="rounded-deh-md bg-deh-light-orange px-2 py-1 text-deh-xs text-deh-dark-orange">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
