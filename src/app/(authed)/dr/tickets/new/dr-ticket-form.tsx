"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ALLOWED_EXT, ALLOWED_MIME, MAX_FILE_SIZE } from "@/lib/storage/limits";
import { createDrTicket } from "./actions";

const MAX_FILES = 5;
const ACCEPT = ALLOWED_EXT.join(",");

type Scope = "building" | "society";

export function DrTicketForm({ categories }: { categories: string[] }) {
  const [scope, setScope] = useState<Scope>("building");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

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
    fd.append("scope", scope);
    fd.append("type", type);
    fd.append("description", description);
    files.forEach((f) => fd.append("attachments", f));
    startTransition(async () => {
      const res = await createDrTicket(fd);
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-deh-lg bg-deh-white p-5 ring-1 ring-deh-border"
    >
      <fieldset>
        <legend className="text-deh-sm font-medium text-deh-text">Scope</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-deh-md border border-deh-border p-3 text-deh-sm has-[:checked]:border-deh-blue has-[:checked]:bg-deh-blue/5">
            <input
              type="radio"
              name="scope"
              value="building"
              checked={scope === "building"}
              onChange={() => setScope("building")}
              disabled={isPending}
              className="mt-0.5"
            />
            <span>
              <span className="block font-medium text-deh-text">Building (common area)</span>
              <span className="block text-deh-xs text-deh-muted">
                Lift, lobby, parking, generator — anything within this building.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-deh-md border border-deh-border p-3 text-deh-sm has-[:checked]:border-deh-blue has-[:checked]:bg-deh-blue/5">
            <input
              type="radio"
              name="scope"
              value="society"
              checked={scope === "society"}
              onChange={() => setScope("society")}
              disabled={isPending}
              className="mt-0.5"
            />
            <span>
              <span className="block font-medium text-deh-text">Society (multi-building)</span>
              <span className="block text-deh-xs text-deh-muted">
                Affects the whole society — utility outage, perimeter, policy.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div>
        <Label htmlFor="dr-issue-type">Issue type</Label>
        <select
          id="dr-issue-type"
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
        <Label htmlFor="dr-issue-desc">Description</Label>
        <textarea
          id="dr-issue-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
          required
          minLength={5}
          rows={5}
          placeholder="Describe the issue. Mention location within the building or which buildings are affected."
          className="mt-1 w-full resize-y rounded-deh-md border border-deh-border bg-deh-white px-3 py-2 text-deh-base text-deh-text outline-none focus:border-deh-blue"
        />
      </div>

      <div>
        <Label>Attachments (optional)</Label>
        <div
          ref={dropRef}
          onDragOver={(e) => {
            e.preventDefault();
            dropRef.current?.classList.add("border-deh-blue");
          }}
          onDragLeave={() => dropRef.current?.classList.remove("border-deh-blue")}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-deh-md border-2 border-dashed border-deh-border bg-deh-gray-bg px-4 py-6 text-center text-deh-sm text-deh-muted transition-colors hover:border-deh-blue"
        >
          <span>
            Drop files here or <span className="text-deh-blue underline">browse</span>
          </span>
          <span className="mt-1 text-deh-xs">
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
          <ul className="mt-3 space-y-1.5">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between rounded-deh-md bg-deh-gray-bg px-3 py-2 text-deh-sm"
              >
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  disabled={isPending}
                  className="text-deh-xs text-deh-red hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-deh-md bg-deh-light-orange px-3 py-2 text-deh-sm text-deh-dark-orange">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending || !type || description.trim().length < 5}>
          {isPending ? "Submitting…" : "Submit issue"}
        </Button>
      </div>
    </form>
  );
}
