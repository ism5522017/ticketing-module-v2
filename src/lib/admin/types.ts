import type { TicketAttachment } from "@/lib/tickets";

export interface AdminRequisition {
  id: string;
  estCost: string;
  inHouseFix: boolean;
  surveyed: boolean;
  vendorName: string | null;
  costBreakdown: string | null;
  invoices: TicketAttachment[];
  adminApproval: "Pending" | "Approved" | "Rejected";
  adminRemarks: string | null;
  vendorConfirmed: boolean;
  vendorConfirmedAt: string | null;
  vendorConfirmedBy: string | null;
  vendorProof: TicketAttachment[];
  createdAt: string;
}

export interface AdminTicket {
  id: string;
  referenceCode: string;
  type: string;
  description: string | null;
  status: "open" | "progress" | "resolved";
  urgency: "critical" | "high" | "medium" | "low";
  urgencyOverridden: boolean;
  scope: "unit" | "building" | "society";
  tenantName: string | null;
  contact: string | null;
  submittedAt: string;
  resolvedAt: string | null;
  locationEdited: boolean;
  buildingId: string | null;
  buildingName: string | null;
  wing: string | null;
  flat: string | null;
  requisition: AdminRequisition | null;
}

export type AdminFilter =
  | "All"
  | "Open"
  | "In Progress"
  | "Resolved"
  | "Req Pending"
  | "Req Approved";

const URGENCY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function urgencyRank(u: string): number {
  return URGENCY_ORDER[u] ?? 99;
}

export function activeStage(t: AdminTicket): number {
  const req = t.requisition;
  const hasReq = !!req;
  const approved = hasReq && req.adminApproval === "Approved";
  const rejected = hasReq && req.adminApproval === "Rejected";

  if (rejected) return 0;
  if (t.status === "resolved") return 3;
  if (t.status === "progress") return 2;
  if (t.status === "open" && approved) return 1;
  return 0;
}
