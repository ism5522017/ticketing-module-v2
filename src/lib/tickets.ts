export type TicketStatus = "open" | "progress" | "resolved";
export type TicketUrgency = "critical" | "high" | "medium" | "low";

interface StatusMeta {
  label: string;
  dotClass: string;
  pillClass: string;
}

const STATUS_META: Record<TicketStatus, StatusMeta> = {
  open: {
    label: "Open",
    dotClass: "bg-status-open",
    pillClass: "bg-status-open/10 text-status-open",
  },
  progress: {
    label: "In progress",
    dotClass: "bg-status-progress",
    pillClass: "bg-status-progress/10 text-status-progress",
  },
  resolved: {
    label: "Resolved",
    dotClass: "bg-status-resolved",
    pillClass: "bg-status-resolved/10 text-status-resolved",
  },
};

export function statusMeta(status: string): StatusMeta {
  return STATUS_META[status as TicketStatus] ?? STATUS_META.open;
}

export function urgencyLabel(u: string | null | undefined): string {
  if (!u) return "";
  return u.charAt(0).toUpperCase() + u.slice(1);
}

interface UrgencyMeta {
  label: string;
  pillClass: string;
}

const URGENCY_META: Record<TicketUrgency, UrgencyMeta> = {
  critical: { label: "Critical", pillClass: "bg-urgency-critical text-white" },
  high: { label: "High", pillClass: "bg-urgency-high text-white" },
  medium: { label: "Medium", pillClass: "bg-urgency-medium text-deh-dark" },
  low: { label: "Low", pillClass: "bg-urgency-low text-deh-dark" },
};

export function urgencyMeta(u: string): UrgencyMeta {
  return URGENCY_META[u as TicketUrgency] ?? URGENCY_META.low;
}

export interface TicketAttachment {
  id: string;
  name: string;
  mimeType: string;
}

export function attachmentCount(attachments: unknown): number {
  return Array.isArray(attachments) ? attachments.length : 0;
}

export function toAttachmentList(attachments: unknown): TicketAttachment[] {
  if (!Array.isArray(attachments)) return [];
  return attachments
    .filter((a): a is Record<string, unknown> => typeof a === "object" && a !== null)
    .map((a) => ({
      id: String(a.id ?? ""),
      name: String(a.name ?? ""),
      mimeType: String(a.mimeType ?? ""),
    }))
    .filter((a) => a.id !== "");
}
