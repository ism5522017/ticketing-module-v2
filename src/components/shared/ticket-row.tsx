import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatSubmittedAt } from "@/lib/format";
import { attachmentCount, statusMeta } from "@/lib/tickets";

export interface TicketRowData {
  referenceCode: string;
  type: string;
  status: string;
  submittedAt: string | Date;
  attachments: unknown;
}

interface TicketRowProps {
  ticket: TicketRowData;
  /** Link target. Pass null to render an inert row. */
  href?: string | null;
  /** Optional extras rendered after the standard sub-line (used by DR/manager). */
  subExtra?: React.ReactNode;
  titleExtra?: React.ReactNode;
}

export function TicketRow({ ticket, href, subExtra, titleExtra }: TicketRowProps) {
  const meta = statusMeta(ticket.status);
  const count = attachmentCount(ticket.attachments);

  const inner = (
    <div className="group flex items-center gap-3 rounded-deh-md border border-deh-border bg-deh-white px-4 py-3 transition-all hover:-translate-y-px hover:border-deh-blue/40 hover:bg-deh-light-blue/35 hover:shadow-sm">
      <span
        className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-transparent transition-shadow group-hover:ring-white",
          meta.dotClass,
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-deh-md font-medium text-deh-text">
          <span className="truncate">{ticket.type}</span>
          {count > 0 ? (
            <span className="shrink-0 rounded-deh-pill bg-deh-gray-200 px-2 py-0.5 text-deh-xs text-deh-muted">
              📎 {count}
            </span>
          ) : null}
          {titleExtra}
        </div>
        <div className="mt-0.5 text-deh-xs text-deh-muted">
          <span className="font-mono">{ticket.referenceCode}</span>
          <span className="mx-1.5">·</span>
          <span>{formatSubmittedAt(ticket.submittedAt)}</span>
          {subExtra}
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-deh-pill px-3 py-1 text-deh-xs font-semibold",
          meta.pillClass,
        )}
      >
        {meta.label}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
