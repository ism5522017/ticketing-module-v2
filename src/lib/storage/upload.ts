import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALLOWED_EXT, ALLOWED_MIME, MAX_FILE_SIZE } from "./limits";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "ticket-attachments";

type AllowedMime = (typeof ALLOWED_MIME)[number];
type AllowedExt = (typeof ALLOWED_EXT)[number];

export class UploadError extends Error {
  readonly code: "type" | "size" | "storage";
  constructor(code: "type" | "size" | "storage", message: string) {
    super(message);
    this.code = code;
  }
}

export interface UploadedAttachment {
  id: string;
  name: string;
  mimeType: string;
}

function extOf(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

export async function uploadAttachment(file: File): Promise<UploadedAttachment> {
  const ext = extOf(file.name);
  if (!ALLOWED_MIME.includes(file.type as AllowedMime) || !ALLOWED_EXT.includes(ext as AllowedExt)) {
    throw new UploadError("type", `File type not permitted: ${file.type || "unknown"} (${ext})`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError("size", "File exceeds 10 MB limit.");
  }

  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const path = `${yyyy}/${mm}/${randomUUID()}${ext}`;

  const admin = createAdminClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  });
  if (error) {
    throw new UploadError("storage", `Upload failed: ${error.message}`);
  }

  return { id: `sup_${path}`, name: file.name, mimeType: file.type };
}

/**
 * Downloads an attachment by its stored id (e.g. "sup_2026/05/<uuid>.jpg").
 * Returns null if the id is malformed or the object isn't found.
 */
export async function fetchAttachmentBytes(
  attachmentId: string,
): Promise<{ bytes: ArrayBuffer; mimeType: string } | null> {
  if (!attachmentId.startsWith("sup_")) return null;
  const path = attachmentId.slice(4);

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  return { bytes: await data.arrayBuffer(), mimeType: data.type || "application/octet-stream" };
}
