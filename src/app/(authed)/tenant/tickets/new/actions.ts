"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { tickets, users } from "@/db/schema";
import { uploadAttachment, UploadError } from "@/lib/storage/upload";
import { smartTriage, TICKET_CATEGORIES } from "@/lib/triage";
import { getTenantProfileFromSession } from "@/lib/tenant-profile";
import { createClient } from "@/lib/supabase/server";

const MAX_ATTACHMENTS = 5;
const MIN_DESC = 5;
const VALID_TYPES = new Set<string>(TICKET_CATEGORIES);

export type CreateTicketResult = { ok: false; error: string };
// Success path triggers a redirect via Server Action — caller never sees a success value.

export async function createTicket(formData: FormData): Promise<CreateTicketResult> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { ok: false, error: "Your session expired. Please sign in again." };

  const meRows = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);
  if (meRows[0]?.role !== "tenant") {
    return { ok: false, error: "Only Khidmat Guzars can raise tickets here." };
  }

  const profile = await getTenantProfileFromSession();
  if (!profile) {
    return { ok: false, error: "Set your unit details on the dashboard first." };
  }

  const type = String(formData.get("type") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!type || !VALID_TYPES.has(type)) {
    return { ok: false, error: "Pick an issue type." };
  }
  if (description.length < MIN_DESC) {
    return { ok: false, error: `Describe the problem in at least ${MIN_DESC} characters.` };
  }

  const fileEntries = formData
    .getAll("attachments")
    .filter((v): v is File => v instanceof File && v.size > 0);

  if (fileEntries.length > MAX_ATTACHMENTS) {
    return { ok: false, error: `At most ${MAX_ATTACHMENTS} attachments per ticket.` };
  }

  let uploaded: Array<{ id: string; name: string; mimeType: string }> = [];
  try {
    uploaded = await Promise.all(fileEntries.map((f) => uploadAttachment(f)));
  } catch (err) {
    if (err instanceof UploadError) return { ok: false, error: err.message };
    return { ok: false, error: "Couldn't upload your attachments. Try again." };
  }

  const triage = smartTriage(type, description);

  const inserted = await db
    .insert(tickets)
    .values({
      type,
      description,
      urgency: triage.level,
      triageReason: triage.reason,
      submittedAt: new Date().toISOString(),
      tenantEmail: profile.email,
      tenantName: profile.fullName,
      contact: profile.contact || null,
      locationEdited: profile.locationEdited,
      attachments: uploaded,
      scope: "unit",
      raisedByRole: "tenant",
      societyId: profile.societyId,
      buildingId: profile.buildingId,
      unitId: profile.unitId,
    })
    .returning({ referenceCode: tickets.referenceCode });

  const ref = inserted[0]?.referenceCode;
  if (!ref) return { ok: false, error: "Couldn't save your ticket. Try again." };

  redirect(`/tenant/tickets/new/confirm?ref=${encodeURIComponent(ref)}`);
}
