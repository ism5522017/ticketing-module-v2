export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
] as const;

export const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"] as const;

const IMAGE_MIME = new Set<string>(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export function isImage(mime: string): boolean {
  return IMAGE_MIME.has(mime);
}
