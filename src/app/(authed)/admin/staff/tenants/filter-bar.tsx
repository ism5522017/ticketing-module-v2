"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import type { BuildingSummary } from "@/lib/buildings/list";

export function FilterBar({ buildings }: { buildings: BuildingSummary[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function push(next: URLSearchParams) {
    next.set("page", "1");
    startTransition(() => {
      router.push(`?${next.toString()}`);
    });
  }

  function onBuildingChange(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set("building_id", value);
    else next.delete("building_id");
    push(next);
  }

  function onActiveChange(value: string) {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete("active");
    else next.set("active", value);
    push(next);
  }

  function onSearch(value: string) {
    const next = new URLSearchParams(params);
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    push(next);
  }

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="min-w-[200px]">
        <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Building</label>
        <select
          value={params.get("building_id") ?? ""}
          onChange={(e) => onBuildingChange(e.target.value)}
          disabled={isPending}
          className="mt-1 w-full rounded-md border border-deh-border bg-background px-3 py-2 text-deh-base"
        >
          <option value="">All buildings</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.code ? `${b.code} — ${b.name}` : b.name}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[140px]">
        <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Status</label>
        <select
          value={params.get("active") ?? "true"}
          onChange={(e) => onActiveChange(e.target.value)}
          disabled={isPending}
          className="mt-1 w-full rounded-md border border-deh-border bg-background px-3 py-2 text-deh-base"
        >
          <option value="true">Active</option>
          <option value="false">Disabled</option>
          <option value="all">All</option>
        </select>
      </div>
      <div className="min-w-[240px] flex-1">
        <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Search</label>
        <Input
          defaultValue={params.get("q") ?? ""}
          placeholder="Name, email, wing, or flat"
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch((e.target as HTMLInputElement).value);
          }}
          onBlur={(e) => onSearch(e.target.value)}
        />
      </div>
    </div>
  );
}
