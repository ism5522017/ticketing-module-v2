import { cn } from "@/lib/utils";
import { formatSubmittedAt } from "@/lib/format";
import { urgencyMeta } from "@/lib/tickets";
import { activeStage, type AdminTicket } from "@/lib/admin/types";
import { ProgressStepper } from "./progress-stepper";
import { RequisitionBlock } from "./requisition-block";

function locationText(t: AdminTicket): string {
  if (t.scope === "society") return "Society-level";
  if (t.scope === "building") return t.buildingName ?? "Building";
  const parts: string[] = [];
  if (t.buildingName) parts.push(t.buildingName);
  if (t.wing) parts.push(`Wing ${t.wing}`);
  if (t.flat) parts.push(`Flat ${t.flat}`);
  return parts.join(" — ") || "—";
}

export function AdminTicketCard({ ticket }: { ticket: AdminTicket }) {
  const uMeta = urgencyMeta(ticket.urgency);
  const stage = activeStage(ticket);

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
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-deh-pill px-2 py-0.5 text-deh-xs font-semibold",
              uMeta.pillClass,
            )}
          >
            {uMeta.label}
          </span>
          {ticket.urgencyOverridden ? (
            <span className="rounded-deh-pill bg-deh-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-deh-muted">
              manually set
            </span>
          ) : null}
        </div>
      </div>

      <ProgressStepper activeStage={stage} />

      <div className="text-deh-sm text-deh-text">
        <span className="font-medium">Khidmat Guzar:</span>{" "}
        {ticket.tenantName ?? <span className="italic text-deh-muted">—</span>}
        <span className="mx-1.5">·</span>
        <span className="font-medium">Location:</span> {locationText(ticket)}
        {ticket.locationEdited ? (
          <span className="ml-2 rounded-deh-pill bg-deh-light-orange px-2 py-0.5 text-[10px] font-medium text-deh-dark-orange">
            edited
          </span>
        ) : null}
      </div>

      {ticket.description ? (
        <p className="text-deh-sm italic text-deh-muted">{ticket.description}</p>
      ) : null}

      {ticket.requisition ? (
        <RequisitionBlock referenceCode={ticket.referenceCode} req={ticket.requisition} />
      ) : (
        <p className="text-deh-xs text-deh-muted">No requisition submitted yet.</p>
      )}
    </article>
  );
}
