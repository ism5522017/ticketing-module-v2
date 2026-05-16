"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { requisitions, tickets } from "@/db/schema";
import { getAdminProfileFromSession } from "@/lib/admin/admin-profile";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const profile = await getAdminProfileFromSession();
  if (!profile) throw new Error("Forbidden");
  return profile;
}

async function setRequisitionApproval(
  referenceCode: string,
  approval: "Approved" | "Rejected",
  remarks: string,
): Promise<ActionResult> {
  await requireAdmin();
  if (!referenceCode) return { ok: false, error: "Missing ticket reference." };

  const rows = await db
    .select({ reqId: requisitions.id })
    .from(requisitions)
    .innerJoin(tickets, eq(tickets.id, requisitions.issueId))
    .where(eq(tickets.referenceCode, referenceCode))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "Requisition not found." };

  await db
    .update(requisitions)
    .set({
      adminApproval: approval,
      adminRemarks: remarks.trim() || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(requisitions.id, row.reqId));

  revalidatePath("/admin/tickets");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export async function approveRequisition(
  referenceCode: string,
  remarks: string,
): Promise<ActionResult> {
  return setRequisitionApproval(referenceCode, "Approved", remarks);
}

export async function rejectRequisition(
  referenceCode: string,
  remarks: string,
): Promise<ActionResult> {
  return setRequisitionApproval(referenceCode, "Rejected", remarks);
}
