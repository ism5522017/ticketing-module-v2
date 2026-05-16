import "server-only";
import { and, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings, tickets, units } from "@/db/schema";

export interface DrRecentTicket {
  referenceCode: string;
  type: string;
  description: string | null;
  status: string;
  urgency: string;
  scope: string;
  submittedAt: string;
  buildingId: string | null;
  unitId: string | null;
}

export interface DrStats {
  open: number;
  progress: number;
  resolved: number;
  total: number;
  by_urgency: { critical: number; high: number; medium: number; low: number };
  avg_resolution_hours: number;
  recent: DrRecentTicket[];
}

const EMPTY_URGENCY = { critical: 0, high: 0, medium: 0, low: 0 } as const;

/**
 * Port of `TicketService.stats_for_building` from the old Rails app.
 * Only building-scoped tickets are counted — society-scope tickets the DR
 * raised do appear in their dashboard list (see read_tickets_for_dr) but
 * not in these KPIs, matching old behavior.
 */
export async function getBuildingStats(buildingId: string): Promise<DrStats> {
  const [statusRows, urgencyRows, avgRows, recent] = await Promise.all([
    db
      .select({ status: tickets.status, count: sql<number>`count(*)::int` })
      .from(tickets)
      .where(eq(tickets.buildingId, buildingId))
      .groupBy(tickets.status),
    db
      .select({ urgency: tickets.urgency, count: sql<number>`count(*)::int` })
      .from(tickets)
      .where(eq(tickets.buildingId, buildingId))
      .groupBy(tickets.urgency),
    db
      .select({
        avgSeconds: sql<
          number | null
        >`avg(extract(epoch from (${tickets.resolvedAt} - ${tickets.submittedAt})))`,
      })
      .from(tickets)
      .where(and(eq(tickets.buildingId, buildingId), isNotNull(tickets.resolvedAt))),
    db
      .select({
        referenceCode: tickets.referenceCode,
        type: tickets.type,
        description: tickets.description,
        status: tickets.status,
        urgency: tickets.urgency,
        scope: tickets.scope,
        submittedAt: tickets.submittedAt,
        buildingId: tickets.buildingId,
        unitId: tickets.unitId,
      })
      .from(tickets)
      .where(eq(tickets.buildingId, buildingId))
      .orderBy(desc(tickets.submittedAt))
      .limit(10),
  ]);

  const byStatus = Object.fromEntries(statusRows.map((r) => [r.status, Number(r.count)]));
  const byUrgency = { ...EMPTY_URGENCY } as Record<keyof typeof EMPTY_URGENCY, number>;
  for (const r of urgencyRows) {
    if (r.urgency in byUrgency) {
      byUrgency[r.urgency as keyof typeof EMPTY_URGENCY] = Number(r.count);
    }
  }

  const open = byStatus.open ?? 0;
  const progress = byStatus.progress ?? 0;
  const resolved = byStatus.resolved ?? 0;
  const total = open + progress + resolved;

  const avgSeconds = avgRows[0]?.avgSeconds ? Number(avgRows[0].avgSeconds) : 0;
  const avg_resolution_hours = avgSeconds > 0 ? Math.round((avgSeconds / 3600) * 100) / 100 : 0;

  return {
    open,
    progress,
    resolved,
    total,
    by_urgency: byUrgency,
    avg_resolution_hours,
    recent: recent.map((r) => ({ ...r, submittedAt: String(r.submittedAt) })),
  };
}

export interface DrListTicket extends DrRecentTicket {
  buildingName: string | null;
  wing: string | null;
  flat: string | null;
}

/**
 * Tickets visible to a DR: every ticket in their building (any scope) plus
 * society-scope tickets they raised themselves. Attachments are intentionally
 * not selected — DRs never see attachment thumbnails in lists.
 */
export async function listTicketsForDr(opts: {
  drId: string;
  buildingId: string;
}): Promise<DrListTicket[]> {
  const { drId, buildingId } = opts;
  const rows = await db
    .select({
      referenceCode: tickets.referenceCode,
      type: tickets.type,
      description: tickets.description,
      status: tickets.status,
      urgency: tickets.urgency,
      scope: tickets.scope,
      submittedAt: tickets.submittedAt,
      buildingId: tickets.buildingId,
      unitId: tickets.unitId,
      buildingName: buildings.name,
      wing: units.wing,
      flat: units.flat,
    })
    .from(tickets)
    .leftJoin(buildings, eq(buildings.id, tickets.buildingId))
    .leftJoin(units, eq(units.id, tickets.unitId))
    .where(
      or(
        eq(tickets.buildingId, buildingId),
        and(eq(tickets.scope, "society"), eq(tickets.raisedByDrId, drId)),
      ),
    )
    .orderBy(desc(tickets.submittedAt));

  return rows.map((r) => ({ ...r, submittedAt: String(r.submittedAt) }));
}
