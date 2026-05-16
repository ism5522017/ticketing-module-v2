"use client";

import { useState } from "react";
import type { TicketAttachment } from "@/lib/tickets";

interface AttachmentGalleryProps {
  attachments: TicketAttachment[];
}

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

function isImage(mime: string): boolean {
  return IMAGE_MIME.has(mime);
}

export function AttachmentGallery({ attachments }: AttachmentGalleryProps) {
  const [open, setOpen] = useState<TicketAttachment | null>(null);

  if (attachments.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {attachments.map((a) => {
          const src = `/api/attachments/${encodeURIComponent(a.id)}`;
          if (isImage(a.mimeType)) {
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setOpen(a)}
                className="overflow-hidden rounded-deh-md border border-deh-border bg-deh-gray-bg transition-colors hover:border-deh-blue"
                title={a.name}
              >
                {/* Plain <img> — these come from Supabase Storage proxied through our route. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={a.name}
                  loading="lazy"
                  className="h-20 w-20 object-cover"
                />
              </button>
            );
          }
          return (
            <a
              key={a.id}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-20 w-20 flex-col items-center justify-center rounded-deh-md border border-deh-border bg-deh-gray-bg px-2 text-center text-deh-xs text-deh-muted transition-colors hover:border-deh-blue"
              title={a.name}
            >
              <span className="text-deh-md">📄</span>
              <span className="mt-1 line-clamp-2 break-all">{a.name}</span>
            </a>
          );
        })}
      </div>

      {open ? (
        <div
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            className="absolute top-4 right-4 text-2xl text-white"
            aria-label="Close"
          >
            ×
          </button>
          {isImage(open.mimeType) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/attachments/${encodeURIComponent(open.id)}`}
              alt={open.name}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          ) : (
            <embed
              src={`/api/attachments/${encodeURIComponent(open.id)}`}
              type={open.mimeType}
              className="h-[90vh] w-[90vw]"
            />
          )}
        </div>
      ) : null}
    </>
  );
}
