import type { TicketAttachment } from "@/lib/tickets";

export interface ManagerRequisition {
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
}

export interface ManagerTicket {
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
  buildingId: string | null;
  buildingName: string | null;
  wing: string | null;
  flat: string | null;
  requisition: ManagerRequisition | null;
}

export type ManagerFilter = "All" | "Pending" | "Awaiting Admin" | "Approved" | "Rejected";

export interface ManagerStats {
  pending: number;
  awaiting: number;
  approved: number;
  rejected: number;
}

const URGENCY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function urgencyRank(u: string): number {
  return URGENCY_ORDER[u] ?? 99;
}
