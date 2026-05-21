"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { BuildingSort } from "@/lib/admin/buildings-list";

const SORT_OPTIONS: { value: BuildingSort; label: string }[] = [
  { value: "name_asc", label: "Name (A → Z)" },
  { value: "name_desc", label: "Name (Z → A)" },
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
  { value: "units_desc", label: "Most units" },
  { value: "units_asc", label: "Fewest units" },
  { value: "tickets_desc", label: "Most tickets" },
  { value: "tickets_asc", label: "Fewest tickets" },
];

export function BuildingsFilterBar({
  cities,
  localities,
}: {
  cities: string[];
  localities: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function push(next: URLSearchParams) {
    startTransition(() => {
      router.push(`?${next.toString()}`);
    });
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    push(next);
  }

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="min-w-[180px]">
        <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Show</label>
        <select
          value={params.get("status") ?? "active"}
          onChange={(e) => setParam("status", e.target.value === "active" ? "" : e.target.value)}
          disabled={isPending}
          className="mt-1 w-full rounded-md border border-deh-border bg-background px-3 py-2 text-deh-base"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
      </div>
      <div className="min-w-[180px]">
        <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">City</label>
        <select
          value={params.get("city") ?? ""}
          onChange={(e) => setParam("city", e.target.value)}
          disabled={isPending}
          className="mt-1 w-full rounded-md border border-deh-border bg-background px-3 py-2 text-deh-base"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="min-w-[180px]">
        <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Locality</label>
        <select
          value={params.get("locality") ?? ""}
          onChange={(e) => setParam("locality", e.target.value)}
          disabled={isPending}
          className="mt-1 w-full rounded-md border border-deh-border bg-background px-3 py-2 text-deh-base"
        >
          <option value="">All localities</option>
          {localities.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      <div className="min-w-[200px]">
        <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Sort by</label>
        <select
          value={params.get("sort") ?? "name_asc"}
          onChange={(e) => setParam("sort", e.target.value === "name_asc" ? "" : e.target.value)}
          disabled={isPending}
          className="mt-1 w-full rounded-md border border-deh-border bg-background px-3 py-2 text-deh-base"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
