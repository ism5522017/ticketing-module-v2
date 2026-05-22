"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BuildingUnitRow } from "@/lib/admin/building-units-list";
import { deleteUnitAction, updateUnitAction } from "./actions";

export function UnitRow({ buildingId, row }: { buildingId: string; row: BuildingUnitRow }) {
  const [editing, setEditing] = useState(false);
  const [wing, setWing] = useState(row.wing ?? "");
  const [flat, setFlat] = useState(row.flat ?? "");
  const [floor, setFloor] = useState(row.floor ?? "");
  const [unitType, setUnitType] = useState(row.unitType ?? "");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      const res = await updateUnitAction({
        buildingId,
        unitId: row.id,
        wing: wing || null,
        flat,
        floor: floor || null,
        unitType: unitType || null,
      });
      if (res.ok) {
        setEditing(false);
        setMessage({ kind: "ok", text: "Saved." });
      } else {
        setMessage({ kind: "err", text: res.error });
      }
    });
  }

  function del() {
    const label = [wing, flat].filter(Boolean).join("-") || row.id.slice(0, 8);
    const warn = row.ticketCount > 0
      ? `Delete flat "${label}"? ${row.ticketCount} historical ticket(s) will lose their flat reference (the tickets themselves stay).`
      : `Delete flat "${label}"?`;
    if (!confirm(warn)) return;
    setMessage(null);
    startTransition(async () => {
      const res = await deleteUnitAction({ buildingId, unitId: row.id });
      if (!res.ok) setMessage({ kind: "err", text: res.error });
    });
  }

  if (editing) {
    return (
      <tr className="border-b border-deh-border bg-deh-card/40">
        <td colSpan={6} className="px-3 py-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Wing</label>
              <Input value={wing} onChange={(e) => setWing(e.target.value)} disabled={isPending} />
            </div>
            <div>
              <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Flat</label>
              <Input value={flat} onChange={(e) => setFlat(e.target.value)} disabled={isPending} required />
            </div>
            <div>
              <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Floor</label>
              <Input value={floor} onChange={(e) => setFloor(e.target.value)} disabled={isPending} />
            </div>
            <div>
              <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Type</label>
              <Input value={unitType} onChange={(e) => setUnitType(e.target.value)} disabled={isPending} />
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
                setWing(row.wing ?? "");
                setFlat(row.flat ?? "");
                setFloor(row.floor ?? "");
                setUnitType(row.unitType ?? "");
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

  return (
    <tr className="border-b border-deh-border">
      <td className="px-3 py-3 text-deh-sm">{row.wing ?? "—"}</td>
      <td className="px-3 py-3 font-medium text-deh-text">{row.flat ?? "—"}</td>
      <td className="px-3 py-3 text-deh-sm">{row.floor ?? "—"}</td>
      <td className="px-3 py-3 text-deh-sm">{row.unitType ?? "—"}</td>
      <td className="px-3 py-3 text-deh-sm tabular-nums">
        {row.tenantCount}
        <span className="ml-2 text-deh-muted">/ {row.ticketCount} tickets</span>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={isPending}>
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={del} disabled={isPending}>
            Delete
          </Button>
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
