"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatSubmittedAt } from "@/lib/format";
import { statusMeta, urgencyMeta } from "@/lib/tickets";
import { AttachmentGallery } from "@/components/shared/lightbox";
import type { ManagerTicket } from "@/lib/manager/types";
import { confirmVendor, overrideUrgency, updateTicketStatus } from "./actions";

const STATUS_OPTIONS: Array<{ value: "open" | "progress" | "resolved"; label: string }> = [
  { value: "open", label: "Open" },
  { value: "progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const URGENCY_OPTIONS: Array<{ value: "critical" | "high" | "medium" | "low"; label: string }> = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function formatRupees(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function TicketCard({ ticket }: { ticket: ManagerTicket }) {
  const sMeta = statusMeta(ticket.status);
  const uMeta = urgencyMeta(ticket.urgency);

  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(ticket.status);
  const [localUrgency, setLocalUrgency] = useState(ticket.urgency);
  const [localOverridden, setLocalOverridden] = useState(ticket.urgencyOverridden);
  const [error, setError] = useState<string | null>(null);

  const req = ticket.requisition;

  function onStatusChange(next: "open" | "progress" | "resolved") {
    const prev = localStatus;
    setLocalStatus(next);
    setError(null);
    startTransition(async () => {
      const res = await updateTicketStatus(ticket.referenceCode, next);
      if (!res.ok) {
        setLocalStatus(prev);
        setError(res.error);
      }
    });
  }

  function onUrgencyOverride(next: "critical" | "high" | "medium" | "low") {
    const prev = { urgency: localUrgency, overridden: localOverridden };
    setLocalUrgency(next);
    setLocalOverridden(true);
    setError(null);
    startTransition(async () => {
      const res = await overrideUrgency(ticket.referenceCode, next);
      if (!res.ok) {
        setLocalUrgency(prev.urgency);
        setLocalOverridden(prev.overridden);
        setError(res.error);
      }
    });
  }

  return (
    <article className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-deh-xs text-deh-muted">
            <span className="font-mono">{ticket.referenceCode}</span>
            <span className="mx-1.5">·</span>
            <span>{formatSubmittedAt(ticket.submittedAt)}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-deh-md font-medium text-deh-text">
            <span>{ticket.type}</span>
            {ticket.scope !== "unit" ? (
              <span className="rounded-deh-pill bg-deh-gray-200 px-2 py-0.5 text-deh-xs text-deh-muted">
                {ticket.scope}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <select
            value={localStatus}
            disabled={isPending}
            onChange={(e) => onStatusChange(e.target.value as "open" | "progress" | "resolved")}
            className={cn(
              "rounded-deh-md border border-deh-border bg-deh-white px-2 py-1 text-deh-xs font-medium outline-none focus:border-deh-blue",
              sMeta.pillClass,
            )}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "rounded-deh-pill px-2 py-0.5 text-deh-xs font-semibold",
                uMeta.pillClass,
              )}
            >
              {uMeta.label}
            </span>
            {localOverridden ? (
              <span className="rounded-deh-pill bg-deh-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-deh-muted">
                manually set
              </span>
            ) : null}
            {!req ? (
              <select
                disabled={isPending}
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onUrgencyOverride(e.target.value as "critical" | "high" | "medium" | "low");
                    e.target.value = "";
                  }
                }}
                className="rounded-deh-md border border-deh-border bg-deh-white px-1.5 py-0.5 text-[10px] text-deh-text outline-none focus:border-deh-blue"
              >
                <option value="">Override…</option>
                {URGENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>
      </div>

      <div className="text-deh-sm text-deh-text">
        {ticket.tenantName ? (
          <span>
            <span className="font-medium">Tenant:</span> {ticket.tenantName}
          </span>
        ) : (
          <span className="text-deh-muted italic">No tenant on file</span>
        )}
        {ticket.scope === "unit" && (ticket.wing || ticket.flat) ? (
          <>
            <span className="mx-1.5">·</span>
            <span>
              <span className="font-medium">Unit:</span> Wing {ticket.wing ?? "—"}, Flat{" "}
              {ticket.flat ?? "—"}
            </span>
          </>
        ) : null}
      </div>

      {ticket.description ? (
        <p className="text-deh-sm text-deh-muted italic">{ticket.description}</p>
      ) : null}

      {error ? (
        <p className="rounded-deh-md bg-deh-light-orange px-3 py-2 text-deh-xs text-deh-dark-orange">
          {error}
        </p>
      ) : null}

      {req ? <RequisitionBlock ticketRef={ticket.referenceCode} req={req} /> : (
        <Link
          href={`/manager/tickets/${encodeURIComponent(ticket.referenceCode)}/requisition/new`}
          className="inline-flex items-center rounded-deh-md bg-deh-blue px-3 py-1.5 text-deh-xs font-medium text-white hover:bg-deh-dark"
        >
          Create Requisition
        </Link>
      )}
    </article>
  );
}

function RequisitionBlock({
  ticketRef,
  req,
}: {
  ticketRef: string;
  req: NonNullable<ManagerTicket["requisition"]>;
}) {
  const badgeClass =
    req.adminApproval === "Approved"
      ? "bg-status-resolved/10 text-status-resolved"
      : req.adminApproval === "Rejected"
        ? "bg-urgency-critical/10 text-urgency-critical"
        : "bg-status-open/10 text-status-open";

  return (
    <div className="space-y-2 rounded-deh-md bg-deh-gray-bg p-3 ring-1 ring-deh-border">
      <div className="flex items-center justify-between">
        <strong className="text-deh-sm text-deh-blue">Requisition</strong>
        <span
          className={cn(
            "rounded-deh-pill px-2 py-0.5 text-deh-xs font-semibold",
            badgeClass,
          )}
        >
          {req.adminApproval}
        </span>
      </div>
      <div className="text-deh-sm text-deh-text">
        Est. Cost: ₹{formatRupees(req.estCost)}
        <span className="mx-1.5">·</span>
        {req.inHouseFix ? "In-house fix" : `Vendor: ${req.vendorName ?? "—"}`}
      </div>
      {req.costBreakdown ? (
        <pre className="whitespace-pre-line text-deh-xs text-deh-muted">{req.costBreakdown}</pre>
      ) : null}
      {req.adminRemarks ? (
        <p className="border-l-2 border-deh-yellow pl-2 text-deh-xs italic text-deh-muted">
          Admin: {req.adminRemarks}
        </p>
      ) : null}
      {req.invoices.length > 0 ? (
        <div>
          <div className="mb-1 text-deh-xs uppercase tracking-wide text-deh-muted">
            Invoices
          </div>
          <AttachmentGallery attachments={req.invoices} />
        </div>
      ) : null}
      {req.adminApproval === "Approved" ? (
        <VendorConfirmBlock ticketRef={ticketRef} req={req} />
      ) : null}
    </div>
  );
}

function VendorConfirmBlock({
  ticketRef,
  req,
}: {
  ticketRef: string;
  req: NonNullable<ManagerTicket["requisition"]>;
}) {
  const [isPending, startTransition] = useTransition();
  const [proof, setProof] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (req.vendorConfirmed) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-deh-md bg-status-resolved/10 p-2 ring-1 ring-status-resolved/30">
        <span className="rounded-deh-pill bg-status-resolved px-2 py-0.5 text-deh-xs font-semibold text-white">
          ✓ Vendor Confirmed
        </span>
        <span className="text-deh-xs text-deh-muted">
          {req.vendorConfirmedBy ?? "—"}
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
    );
  }

  function onPick(file: File | null) {
    setProof(file);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function onConfirm() {
    if (!proof) {
      setError("Upload a proof photo first.");
      return;
    }
    const fd = new FormData();
    fd.append("proof", proof);
    setError(null);
    startTransition(async () => {
      const res = await confirmVendor(ticketRef, fd);
      if (!res.ok) {
        setError(res.error);
      } else {
        onPick(null);
      }
    });
  }

  return (
    <div className="space-y-2 rounded-deh-md bg-deh-white p-2 ring-1 ring-deh-border">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-deh-muted">
        Mark Vendor Complete
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Proof preview" className="h-20 w-20 rounded-deh-md object-cover" />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
          className="rounded-deh-md bg-deh-blue px-3 py-1.5 text-deh-xs font-medium text-white hover:bg-deh-dark disabled:opacity-50"
        >
          Upload Photo
        </button>
        <button
          type="button"
          disabled={isPending || !proof}
          onClick={onConfirm}
          className="rounded-deh-md bg-status-resolved px-3 py-1.5 text-deh-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Confirming…" : "Confirm Completion"}
        </button>
      </div>
      {error ? (
        <p className="rounded-deh-md bg-deh-light-orange px-2 py-1 text-deh-xs text-deh-dark-orange">
          {error}
        </p>
      ) : null}
    </div>
  );
}
