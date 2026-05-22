"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminBuildingRow } from "@/lib/admin/buildings-list";
import {
  archiveBuildingAction,
  restoreBuildingAction,
  updateBuildingAction,
} from "./actions";

export function BuildingRow({ row }: { row: AdminBuildingRow }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const [locality, setLocality] = useState(row.locality ?? "");
  const [city, setCity] = useState(row.city ?? "");
  const [state, setState] = useState(row.state ?? "");
  const [address, setAddress] = useState(row.address ?? "");
  const [category, setCategory] = useState(row.category ?? "");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      const res = await updateBuildingAction({
        id: row.id,
        name,
        locality: locality || null,
        city: city || null,
        state: state || null,
        address: address || null,
        category: category || null,
      });
      if (res.ok) {
        setEditing(false);
        setMessage({ kind: "ok", text: "Saved." });
      } else {
        setMessage({ kind: "err", text: res.error });
      }
    });
  }

  function archive() {
    if (!confirm(`Archive "${row.name}"? It will disappear from login and create dropdowns. Existing tickets and units stay.`)) return;
    setMessage(null);
    startTransition(async () => {
      const res = await archiveBuildingAction({ id: row.id });
      if (!res.ok) setMessage({ kind: "err", text: res.error });
    });
  }

  function restore() {
    setMessage(null);
    startTransition(async () => {
      const res = await restoreBuildingAction({ id: row.id });
      if (!res.ok) setMessage({ kind: "err", text: res.error });
    });
  }

  if (editing) {
    return (
      <tr className="border-b border-deh-border bg-deh-card/40">
        <td colSpan={7} className="px-3 py-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
            </div>
            <div>
              <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Locality</label>
              <Input value={locality} onChange={(e) => setLocality(e.target.value)} disabled={isPending} />
            </div>
            <div>
              <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">City</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} disabled={isPending} />
            </div>
            <div>
              <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">State</label>
              <Input value={state} onChange={(e) => setState(e.target.value)} disabled={isPending} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} disabled={isPending} />
            </div>
            <div>
              <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Category</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} disabled={isPending} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={save} disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(false);
                setName(row.name);
                setLocality(row.locality ?? "");
                setCity(row.city ?? "");
                setState(row.state ?? "");
                setAddress(row.address ?? "");
                setCategory(row.category ?? "");
                setMessage(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
          {message ? (
            <p className={`mt-2 text-deh-xs ${message.kind === "ok" ? "text-status-resolved" : "text-deh-red"}`}>
              {message.text}
            </p>
          ) : null}
        </td>
      </tr>
    );
  }

  const archived = row.archivedAt !== null;
  return (
    <tr className={`border-b border-deh-border ${archived ? "opacity-60" : ""}`}>
      <td className="px-3 py-3 font-medium text-deh-text">
        {row.name}
        {archived ? (
          <span className="ml-2 rounded-deh-pill bg-deh-muted/20 px-2 py-0.5 text-deh-xs font-medium text-deh-muted">
            Archived
          </span>
        ) : null}
      </td>
      <td className="px-3 py-3 text-deh-sm">{row.locality ?? "—"}</td>
      <td className="px-3 py-3 text-deh-sm">{row.city ?? "—"}</td>
      <td className="px-3 py-3 text-deh-sm">{row.address ?? "—"}</td>
      <td className="px-3 py-3 text-deh-sm tabular-nums">{row.unitCount}</td>
      <td className="px-3 py-3 text-deh-sm tabular-nums">{row.ticketCount}</td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/buildings/${row.id}/units`}
            className="inline-flex items-center rounded-md border border-deh-border bg-background px-2.5 py-1 text-deh-xs font-medium text-deh-text hover:bg-deh-card"
          >
            Manage flats
          </Link>
          {!archived ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={isPending}>
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={archive} disabled={isPending}>
                Archive
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={restore} disabled={isPending}>
              Restore
            </Button>
          )}
        </div>
        {message ? (
          <p className={`mt-1 text-deh-xs ${message.kind === "ok" ? "text-status-resolved" : "text-deh-red"}`}>
            {message.text}
          </p>
        ) : null}
      </td>
    </tr>
  );
}
