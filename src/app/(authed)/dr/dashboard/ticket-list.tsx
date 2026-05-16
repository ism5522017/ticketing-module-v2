"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatSubmittedAt } from "@/lib/format";
import { statusMeta, urgencyMeta } from "@/lib/tickets";
import type { DrListTicket } from "@/lib/dr/building-stats";

const SCOPE_LABEL: Record<string, string> = {
  unit: "unit",
  building: "building",
  society: "society",
};

function locationFor(t: DrListTicket): string {
  if (t.scope === "society") return "Society-level";
  if (t.scope === "building") return t.buildingName || "Building";
  // unit scope
  const wing = t.wing ? `Wing ${t.wing}` : null;
  const flat = t.flat ? `Flat ${t.flat}` : null;
  const unit = [wing, flat].filter(Boolean).join(", ");
  return [t.buildingName, unit].filter(Boolean).join(" — ");
}

export function TicketList({ tickets }: { tickets: DrListTicket[] }) {
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query).trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return tickets;
    return tickets.filter((t) =>
      (t.type || "").toLowerCase().includes(q)
      || (t.description || "").toLowerCase().includes(q)
      || (t.referenceCode || "").toLowerCase().includes(q),
    );
  }, [tickets, q]);

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Search by type, description, or TK-id…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-deh-md border border-deh-border bg-deh-white px-3 py-2 text-deh-sm text-deh-text outline-none focus:border-deh-blue"
      />

      {filtered.length === 0 ? (
        <p className="rounded-deh-md border border-dashed border-deh-border px-4 py-8 text-center text-deh-sm text-deh-muted">
          {tickets.length === 0 ? "No tickets in this building yet." : "No tickets match."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((t) => {
            const sMeta = statusMeta(t.status);
            const uMeta = urgencyMeta(t.urgency);
            return (
              <li key={t.referenceCode}>
                <Link
                  href={`/dr/tickets/${encodeURIComponent(t.referenceCode)}`}
                  className="block rounded-deh-md border border-deh-border bg-deh-white px-4 py-3 transition-colors hover:border-deh-blue/40"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", sMeta.dotClass)}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-deh-md font-medium text-deh-text">
                        <span className="truncate">{t.type}</span>
                        <span className="shrink-0 rounded-deh-pill bg-deh-gray-200 px-2 py-0.5 text-deh-xs text-deh-muted">
                          {SCOPE_LABEL[t.scope] ?? t.scope}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-deh-pill px-2 py-0.5 text-deh-xs font-semibold",
                            uMeta.pillClass,
                          )}
                        >
                          {uMeta.label}
                        </span>
                      </div>
                      <div className="mt-0.5 text-deh-xs text-deh-muted">
                        <span className="font-mono">{t.referenceCode}</span>
                        <span className="mx-1.5">·</span>
                        <span>{formatSubmittedAt(t.submittedAt)}</span>
                        <span className="mx-1.5">·</span>
                        <span>{locationFor(t)}</span>
                      </div>
                      {t.description ? (
                        <p className="mt-1 line-clamp-2 text-deh-sm text-deh-muted">
                          {t.description}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-deh-pill px-3 py-1 text-deh-xs font-semibold",
                        sMeta.pillClass,
                      )}
                    >
                      {sMeta.label}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
