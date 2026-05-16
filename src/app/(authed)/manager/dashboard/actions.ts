"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { requisitions, tickets } from "@/db/schema";
import { getManagerProfileFromSession } from "@/lib/manager/manager-profile";
import { uploadAttachment, UploadError } from "@/lib/storage/upload";

const VALID_STATUSES = ["open", "progress", "resolved"] as const;
type Status = (typeof VALID_STATUSES)[number];

const VALID_URGENCIES = ["critical", "high", "medium", "low"] as const;
type Urgency = (typeof VALID_URGENCIES)[number];

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireManager() {
  const profile = await getManagerProfileFromSession();
  if (!profile) throw new Error("Forbidden");
  return profile;
}

export async function updateTicketStatus(
  referenceCode: string,
  status: string,
): Promise<ActionResult> {
  await requireManager();
  if (!VALID_STATUSES.includes(status as Status)) {
    return { ok: false, error: "Invalid status." };
  }
  const s = status as Status;
  await db
    .update(tickets)
    .set({
      status: s,
      resolvedAt: s === "resolved" ? new Date().toISOString() : null,
    })
    .where(eq(tickets.referenceCode, referenceCode));
  revalidatePath("/manager/dashboard");
  return { ok: true };
}

export async function overrideUrgency(
  referenceCode: string,
  urgency: string,
): Promise<ActionResult> {
  await requireManager();
  if (!VALID_URGENCIES.includes(urgency as Urgency)) {
    return { ok: false, error: "Invalid urgency." };
  }

  const ticketRow = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.referenceCode, referenceCode))
    .limit(1);
  const ticket = ticketRow[0];
  if (!ticket) return { ok: false, error: "Ticket not found." };

  const existingReq = await db
    .select({ id: requisitions.id })
    .from(requisitions)
    .where(eq(requisitions.issueId, ticket.id))
    .limit(1);
  if (existingReq.length > 0) {
    return {
      ok: false,
      error: "Cannot override urgency — a requisition has already been submitted.",
    };
  }

  await db
    .update(tickets)
    .set({ urgency: urgency as Urgency, urgencyOverridden: true })
    .where(eq(tickets.id, ticket.id));
  revalidatePath("/manager/dashboard");
  return { ok: true };
}

const MAX_INVOICES = 5;

export async function createRequisition(formData: FormData): Promise<ActionResult> {
  await requireManager();

  const referenceCode = String(formData.get("ticket_id") ?? "").trim();
  const surveyed = String(formData.get("surveyed") ?? "true") === "true";
  const inHouseFix = String(formData.get("in_house_fix") ?? "false") === "true";
  const vendorName = String(formData.get("vendor_name") ?? "").trim();
  const costBreakdown = String(formData.get("cost_breakdown") ?? "").trim();
  const estCostRaw = String(formData.get("est_cost") ?? "0");
  const estCost = Number(estCostRaw);

  if (!referenceCode) return { ok: false, error: "Missing ticket reference." };
  if (Number.isNaN(estCost) || estCost < 0) {
    return { ok: false, error: "Estimated cost must be a non-negative number." };
  }

  if (!inHouseFix) {
    if (!vendorName) return { ok: false, error: "Vendor name is required." };
    if (estCost <= 0) {
      return { ok: false, error: "Add at least one cost-breakdown line item." };
    }
    if (!costBreakdown) {
      return { ok: false, error: "Cost breakdown is empty." };
    }
  }

  const ticketRow = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.referenceCode, referenceCode))
    .limit(1);
  const ticket = ticketRow[0];
  if (!ticket) return { ok: false, error: "Ticket not found." };

  const existingReq = await db
    .select({ id: requisitions.id })
    .from(requisitions)
    .where(eq(requisitions.issueId, ticket.id))
    .limit(1);
  if (existingReq.length > 0) {
    return { ok: false, error: "A requisition already exists for this ticket." };
  }

  const fileEntries = formData
    .getAll("invoices")
    .filter((v): v is File => v instanceof File && v.size > 0);
  if (fileEntries.length > MAX_INVOICES) {
    return { ok: false, error: `At most ${MAX_INVOICES} invoice files.` };
  }

  let invoices: Array<{ id: string; name: string; mimeType: string }> = [];
  if (!inHouseFix && fileEntries.length > 0) {
    try {
      invoices = await Promise.all(fileEntries.map((f) => uploadAttachment(f)));
    } catch (err) {
      if (err instanceof UploadError) return { ok: false, error: err.message };
      return { ok: false, error: "Couldn't upload invoices." };
    }
  }

  await db.insert(requisitions).values({
    issueId: ticket.id,
    surveyed,
    inHouseFix,
    vendorName: inHouseFix ? null : vendorName,
    estCost: String(inHouseFix ? 0 : estCost),
    costBreakdown: inHouseFix ? null : costBreakdown,
    invoices,
    adminApproval: "Pending",
    submittedAt: new Date().toISOString(),
  });

  revalidatePath("/manager/dashboard");
  return { ok: true };
}

export async function confirmVendor(
  referenceCode: string,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireManager();

  const proofFile = formData.get("proof");
  if (!(proofFile instanceof File) || proofFile.size === 0) {
    return { ok: false, error: "Upload a proof photo first." };
  }

  const rows = await db
    .select({
      reqId: requisitions.id,
      adminApproval: requisitions.adminApproval,
      vendorConfirmed: requisitions.vendorConfirmed,
    })
    .from(requisitions)
    .innerJoin(tickets, eq(tickets.id, requisitions.issueId))
    .where(eq(tickets.referenceCode, referenceCode))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "Requisition not found." };
  if (row.adminApproval !== "Approved") {
    return { ok: false, error: "Requisition isn't approved yet." };
  }
  if (row.vendorConfirmed) {
    return { ok: false, error: "Vendor work already confirmed." };
  }

  let proof;
  try {
    proof = await uploadAttachment(proofFile);
  } catch (err) {
    if (err instanceof UploadError) return { ok: false, error: err.message };
    return { ok: false, error: "Couldn't upload proof photo." };
  }

  await db
    .update(requisitions)
    .set({
      vendorConfirmed: true,
      vendorConfirmedAt: new Date().toISOString(),
      vendorConfirmedBy: profile.fullName,
      vendorProof: [proof],
    })
    .where(and(eq(requisitions.id, row.reqId)));

  revalidatePath("/manager/dashboard");
  return { ok: true };
}
