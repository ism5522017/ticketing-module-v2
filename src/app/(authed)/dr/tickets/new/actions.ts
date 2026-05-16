"use server";

import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { tickets } from "@/db/schema";
import { uploadAttachment, UploadError } from "@/lib/storage/upload";
import { smartTriage, TICKET_CATEGORIES } from "@/lib/triage";
import { getDrProfileFromSession } from "@/lib/dr/dr-profile";

const MAX_ATTACHMENTS = 5;
const MIN_DESC = 5;
const VALID_TYPES = new Set<string>(TICKET_CATEGORIES);
const VALID_SCOPES = new Set(["building", "society"]);

type Scope = "building" | "society";

export type CreateDrTicketResult = { ok: false; error: string };

export async function createDrTicket(formData: FormData): Promise<CreateDrTicketResult> {
  const profile = await getDrProfileFromSession();
  if (!profile) {
    return { ok: false, error: "Only an active DR can raise issues here." };
  }

  const scope = String(formData.get("scope") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!VALID_SCOPES.has(scope)) {
    return { ok: false, error: "Choose a scope: building or society." };
  }
  if (!type || !VALID_TYPES.has(type)) {
    return { ok: false, error: "Pick an issue type." };
  }
  if (description.length < MIN_DESC) {
    return { ok: false, error: `Describe the issue in at least ${MIN_DESC} characters.` };
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
  const scopeVal = scope as Scope;

  const inserted = await db
    .insert(tickets)
    .values({
      type,
      description,
      urgency: triage.level,
      triageReason: triage.reason,
      submittedAt: new Date().toISOString(),
      contact: profile.contact || null,
      locationEdited: false,
      attachments: uploaded,
      scope: scopeVal,
      raisedByRole: "dr",
      raisedByDrId: profile.drId,
      societyId: profile.societyId,
      buildingId: scopeVal === "building" ? profile.buildingId : null,
      unitId: null,
    })
    .returning({ referenceCode: tickets.referenceCode });

  const ref = inserted[0]?.referenceCode;
  if (!ref) return { ok: false, error: "Couldn't save your issue. Try again." };

  redirect(`/dr/tickets/new/confirm?ref=${encodeURIComponent(ref)}`);
}
