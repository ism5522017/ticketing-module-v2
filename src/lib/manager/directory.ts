import "server-only";
import { desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import { buildings, requisitions, tickets, units } from "@/db/schema";
import { toAttachmentList } from "@/lib/tickets";
import type { ManagerRequisition, ManagerStats, ManagerTicket } from "./types";

/**
 * Manager-visible tickets: every ticket in every building of the society plus
 * society-scope tickets. The old app's manager scope was "everything" and the
 * MVP keeps that — manager_building_assignments will narrow it later (7.5).
 */
export async function listManagerTickets(): Promise<ManagerTicket[]> {
  const ticketRows = await db
    .select({
      id: tickets.id,
      referenceCode: tickets.referenceCode,
      type: tickets.type,
      description: tickets.description,
      status: tickets.status,
      urgency: tickets.urgency,
      urgencyOverridden: tickets.urgencyOverridden,
      scope: tickets.scope,
      tenantName: tickets.tenantName,
      contact: tickets.contact,
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
    // Hide tickets whose building is archived. Society-scope tickets
    // (building_id IS NULL) are kept — they have no building to hide.
    .where(or(isNull(tickets.buildingId), isNull(buildings.archivedAt)))
    .orderBy(desc(tickets.submittedAt));

  if (ticketRows.length === 0) return [];

  const reqRows = await db
    .select({
      id: requisitions.id,
      issueId: requisitions.issueId,
      estCost: requisitions.estCost,
      inHouseFix: requisitions.inHouseFix,
      surveyed: requisitions.surveyed,
      vendorName: requisitions.vendorName,
      costBreakdown: requisitions.costBreakdown,
      invoices: requisitions.invoices,
      adminApproval: requisitions.adminApproval,
      adminRemarks: requisitions.adminRemarks,
      vendorConfirmed: requisitions.vendorConfirmed,
      vendorConfirmedAt: requisitions.vendorConfirmedAt,
      vendorConfirmedBy: requisitions.vendorConfirmedBy,
      vendorProof: requisitions.vendorProof,
    })
    .from(requisitions)
    .where(inArray(requisitions.issueId, ticketRows.map((t) => t.id)));

  const reqByTicket = new Map<string, ManagerRequisition>();
  for (const r of reqRows) {
    reqByTicket.set(r.issueId, {
      id: r.id,
      estCost: String(r.estCost ?? "0"),
      inHouseFix: r.inHouseFix,
      surveyed: r.surveyed,
      vendorName: r.vendorName,
      costBreakdown: r.costBreakdown,
      invoices: toAttachmentList(r.invoices),
      adminApproval: r.adminApproval,
      adminRemarks: r.adminRemarks,
      vendorConfirmed: r.vendorConfirmed,
      vendorConfirmedAt: r.vendorConfirmedAt ? String(r.vendorConfirmedAt) : null,
      vendorConfirmedBy: r.vendorConfirmedBy,
      vendorProof: toAttachmentList(r.vendorProof),
    });
  }

  return ticketRows.map((t) => ({
    id: t.id,
    referenceCode: t.referenceCode,
    type: t.type,
    description: t.description,
    status: t.status,
    urgency: t.urgency,
    urgencyOverridden: t.urgencyOverridden,
    scope: t.scope,
    tenantName: t.tenantName,
    contact: t.contact,
    submittedAt: String(t.submittedAt),
    buildingId: t.buildingId,
    buildingName: t.buildingName,
    wing: t.wing,
    flat: t.flat,
    requisition: reqByTicket.get(t.id) ?? null,
  }));
}

export function computeManagerStats(rows: ManagerTicket[]): ManagerStats {
  const stats = { pending: 0, awaiting: 0, approved: 0, rejected: 0 };
  for (const t of rows) {
    const req = t.requisition;
    if (!req) stats.pending++;
    else if (req.adminApproval === "Approved") stats.approved++;
    else if (req.adminApproval === "Rejected") stats.rejected++;
    else stats.awaiting++;
  }
  return stats;
}
