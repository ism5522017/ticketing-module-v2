"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { urgencyRank, type AdminFilter, type AdminTicket } from "@/lib/admin/types";
import { AdminTicketCard } from "./admin-ticket-card";

const FILTERS: AdminFilter[] = [
  "All",
  "Open",
  "In Progress",
  "Resolved",
  "Req Pending",
  "Req Approved",
];

function filterFromParam(p: string | null): AdminFilter {
  if (!p) return "All";
  const match = FILTERS.find((f) => f.toLowerCase() === p.toLowerCase());
  return match ?? "All";
}

function matchesFilter(t: AdminTicket, filter: AdminFilter): boolean {
  const req = t.requisition;
  switch (filter) {
    case "All":
      return true;
    case "Open":
      return t.status === "open";
    case "In Progress":
      return t.status === "progress";
    case "Resolved":
      return t.status === "resolved";
    case "Req Pending":
      return !!req && req.adminApproval === "Pending";
    case "Req Approved":
      return !!req && req.adminApproval === "Approved";
  }
}

function buildingKey(t: AdminTicket): string {
  return t.buildingName ?? (t.scope === "society" ? "Society-level" : "Unassigned");
}

export function DirectoryShell({ tickets }: { tickets: AdminTicket[] }) {
  const searchParams = useSearchParams();
  const initial = filterFromParam(searchParams.get("filter"));
  const [filter, setFilter] = useState<AdminFilter>(initial);
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query).trim().toLowerCase();

  // Keep filter in sync if user navigates between dashboard KPI links.
  useEffect(() => {
    setFilter(filterFromParam(searchParams.get("filter")));
  }, [searchParams]);

  const grouped = useMemo(() => {
    const filtered = tickets.filter((t) => {
      if (!matchesFilter(t, filter)) return false;
      if (!q) return true;
      return (
        (t.tenantName ?? "").toLowerCase().includes(q) ||
        (t.buildingName ?? "").toLowerCase().includes(q) ||
        (t.type ?? "").toLowerCase().includes(q) ||
        (t.referenceCode ?? "").toLowerCase().includes(q)
      );
    });

    const byBuilding = new Map<string, AdminTicket[]>();
    for (const t of filtered) {
      const key = buildingKey(t);
      const arr = byBuilding.get(key);
      if (arr) arr.push(t);
      else byBuilding.set(key, [t]);
    }
    for (const arr of byBuilding.values()) {
      arr.sort((a, b) => urgencyRank(a.urgency) - urgencyRank(b.urgency));
    }
    return Array.from(byBuilding.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [tickets, filter, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              "rounded-deh-pill px-3 py-1.5 text-deh-sm font-medium transition-colors " +
              (filter === f
                ? "bg-deh-blue text-white"
                : "bg-deh-white text-deh-text ring-1 ring-deh-border hover:bg-deh-gray-bg")
            }
          >
            {f}
          </button>
        ))}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Khidmat Guzar, building, type, or TK-id…"
          className="ml-auto w-72 rounded-deh-md border border-deh-border bg-deh-white px-3 py-2 text-deh-sm text-deh-text outline-none focus:border-deh-blue"
        />
      </div>

      {grouped.length === 0 ? (
        <p className="rounded-deh-md border border-dashed border-deh-border px-4 py-8 text-center text-deh-sm text-deh-muted">
          No tickets match the current filter.
        </p>
      ) : (
        grouped.map(([building, items]) => (
          <section
            key={building}
            className="overflow-hidden rounded-deh-lg bg-deh-white ring-1 ring-deh-border"
          >
            <header className="flex items-center justify-between bg-deh-gray-bg px-4 py-2 text-deh-sm">
              <span className="font-semibold text-deh-text">📍 {building}</span>
              <span className="text-deh-xs text-deh-muted">
                {items.length} ticket{items.length === 1 ? "" : "s"}
              </span>
            </header>
            <ul className="divide-y divide-deh-border">
              {items.map((t) => (
                <li key={t.referenceCode} className="p-4">
                  <AdminTicketCard ticket={t} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
