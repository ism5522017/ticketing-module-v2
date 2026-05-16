"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { FileText, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ALLOWED_EXT, ALLOWED_MIME, MAX_FILE_SIZE } from "@/lib/storage/limits";
import { createTicket } from "./actions";

const MAX_FILES = 5;
const ACCEPT = ALLOWED_EXT.join(",");

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TicketForm({ categories }: { categories: string[] }) {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Generate (and clean up) blob: URLs for image previews.
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const f of files) {
      const key = `${f.name}-${f.size}-${f.lastModified}`;
      if (f.type.startsWith("image/")) {
        next[key] = previews[key] ?? URL.createObjectURL(f);
      }
    }
    // Revoke any preview URLs whose files were removed.
    for (const [key, url] of Object.entries(previews)) {
      if (!(key in next)) URL.revokeObjectURL(url);
    }
    setPreviews(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(picked: FileList | File[]) {
    const list: File[] = [];
    for (const f of picked) {
      if (!ALLOWED_MIME.includes(f.type as (typeof ALLOWED_MIME)[number])) {
        setError(`Skipped ${f.name}: unsupported type.`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`Skipped ${f.name}: over 10 MB.`);
        continue;
      }
      list.push(f);
    }
    const next = [...files, ...list].slice(0, MAX_FILES);
    setFiles(next);
  }

  function removeAt(i: number) {
    setFiles(files.filter((_, idx) => idx !== i));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    dropRef.current?.classList.remove("border-deh-blue");
    addFiles(e.dataTransfer.files);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.append("type", type);
    fd.append("description", description);
    files.forEach((f) => fd.append("attachments", f));
    startTransition(async () => {
      const res = await createTicket(fd);
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-deh-lg bg-deh-white p-5 ring-1 ring-deh-border">
      <div>
        <Label htmlFor="issue-type">Issue type</Label>
        <select
          id="issue-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          disabled={isPending}
          required
          className="mt-1 w-full rounded-deh-md border border-deh-border bg-deh-white px-3 py-2 text-deh-base text-deh-text outline-none focus:border-deh-blue"
        >
          <option value="">Select an issue type…</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="issue-desc">Description</Label>
        <textarea
          id="issue-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
          required
          minLength={5}
          rows={5}
          placeholder="Describe what's happening. Include when it started and where in the unit."
          className="mt-1 w-full resize-y rounded-deh-md border border-deh-border bg-deh-white px-3 py-2 text-deh-base text-deh-text outline-none focus:border-deh-blue"
        />
      </div>

      <div>
        <Label>Attachments (optional)</Label>
        <div
          ref={dropRef}
          onDragOver={(e) => {
            e.preventDefault();
            dropRef.current?.classList.add("drop-zone-active");
          }}
          onDragLeave={() =>
            dropRef.current?.classList.remove("drop-zone-active")
          }
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-deh-md border-2 border-dashed border-deh-border bg-deh-gray-bg/60 px-4 py-7 text-center text-deh-sm text-deh-muted transition-all hover:border-deh-blue hover:bg-deh-light-blue/40"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-deh-border">
            <ImageIcon className="h-4 w-4 text-deh-blue" />
          </div>
          <span className="font-medium text-deh-text">
            Drop files here or{" "}
            <span className="text-deh-blue underline underline-offset-2">
              browse
            </span>
          </span>
          <span className="text-deh-xs">
            Up to {MAX_FILES} files, 10 MB each — JPG, PNG, GIF, WebP, PDF
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
          disabled={isPending}
        />

        {files.length > 0 ? (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {files.map((f, i) => {
              const key = `${f.name}-${f.size}-${f.lastModified}`;
              const url = previews[key];
              const isImg = f.type.startsWith("image/");
              return (
                <li
                  key={`${f.name}-${i}`}
                  className="group relative overflow-hidden rounded-deh-md border border-deh-border bg-deh-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex aspect-[4/3] items-center justify-center bg-deh-gray-bg">
                    {isImg && url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={f.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-deh-muted">
                        {f.type === "application/pdf" ? (
                          <FileText className="h-8 w-8 text-deh-red" />
                        ) : (
                          <ImageIcon className="h-8 w-8" />
                        )}
                        <span className="text-deh-xxs font-semibold uppercase tracking-wide">
                          {f.type === "application/pdf" ? "PDF" : "File"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <p
                        className="truncate text-deh-xs font-medium text-deh-text"
                        title={f.name}
                      >
                        {f.name}
                      </p>
                      <p className="text-deh-xxs text-deh-muted">
                        {formatSize(f.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    disabled={isPending}
                    aria-label={`Remove ${f.name}`}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur transition-opacity hover:bg-deh-red group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-deh-md bg-deh-light-orange px-3 py-2 text-deh-sm text-deh-dark-orange">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending || !type || description.trim().length < 5}
          className="btn-glow rounded-deh-pill bg-deh-blue px-5 py-2.5 text-deh-md font-semibold text-white hover:bg-deh-dark-blue"
        >
          {isPending ? "Submitting…" : "Submit ticket"}
        </Button>
      </div>
    </form>
  );
}
