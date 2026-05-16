"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminTenantRow } from "@/lib/admin/tenants-list";
import {
  listUnitsForBuildingAction,
  resetTenantPasswordAction,
  setTenantActiveAction,
  updateTenantAction,
} from "./actions";

interface UnitOption {
  id: string;
  label: string;
}

export function TenantRow({ row }: { row: AdminTenantRow }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const [email, setEmail] = useState(row.email);
  const [phone, setPhone] = useState(row.phone ?? "");
  const [contact, setContact] = useState(row.contact ?? "");
  const [unitId, setUnitId] = useState(row.unitId ?? "");
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [unitsLoaded, setUnitsLoaded] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadUnits() {
    if (!row.buildingId || unitsLoaded) return;
    const opts = await listUnitsForBuildingAction(row.buildingId);
    setUnitOptions(opts);
    setUnitsLoaded(true);
  }

  function startEdit() {
    setEditing(true);
    loadUnits();
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const res = await updateTenantAction({
        tenantId: row.id,
        name,
        email,
        phone,
        contact,
        unitId: unitId || undefined,
      });
      if (res.ok) {
        setEditing(false);
        setMessage({ kind: "ok", text: "Saved." });
      } else {
        setMessage({ kind: "err", text: res.error });
      }
    });
  }

  function reset() {
    setMessage(null);
    startTransition(async () => {
      const res = await resetTenantPasswordAction({ tenantId: row.id });
      if (res.ok) {
        setMessage({
          kind: "ok",
          text: `Temporary password: ${res.data!.tempPassword}.`,
        });
      } else {
        setMessage({ kind: "err", text: res.error });
      }
    });
  }

  function toggleActive() {
    setMessage(null);
    startTransition(async () => {
      const res = await setTenantActiveAction({ tenantId: row.id, active: !row.active });
      if (!res.ok) setMessage({ kind: "err", text: res.error });
    });
  }

  if (editing) {
    return (
      <tr className="border-b border-deh-border bg-deh-card/40">
        <td colSpan={8} className="px-3 py-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
            </div>
            <div>
              <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={isPending} />
            </div>
            <div>
              <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isPending} />
            </div>
            <div>
              <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Contact (notes)</label>
              <Input value={contact} onChange={(e) => setContact(e.target.value)} disabled={isPending} />
            </div>
            <div>
              <label className="block text-deh-xs uppercase tracking-wide text-deh-muted">Unit</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                disabled={isPending || !row.buildingId}
                className="mt-1 w-full rounded-md border border-deh-border bg-background px-3 py-2 text-deh-base"
              >
                {row.unitId ? (
                  <option value={row.unitId}>
                    Current: {row.wing ? row.wing + "-" : ""}{row.flat ?? "?"}
                  </option>
                ) : (
                  <option value="">No unit assigned</option>
                )}
                {unitOptions
                  .filter((u) => u.id !== row.unitId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
              </select>
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
                setEmail(row.email);
                setPhone(row.phone ?? "");
                setContact(row.contact ?? "");
                setUnitId(row.unitId ?? "");
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
      <td className="px-3 py-3 font-medium text-deh-text">{row.name}</td>
      <td className="px-3 py-3 text-deh-sm text-deh-muted">{row.email}</td>
      <td className="px-3 py-3 text-deh-sm">{row.wing ?? "—"}</td>
      <td className="px-3 py-3 text-deh-sm">{row.flat ?? "—"}</td>
      <td className="px-3 py-3 text-deh-sm">{row.buildingName ?? "—"}</td>
      <td className="px-3 py-3 text-deh-sm">{row.phone ?? "—"}</td>
      <td className="px-3 py-3 text-deh-sm">
        {row.active ? (
          <span className="rounded-deh-pill bg-status-resolved/15 px-2 py-0.5 text-deh-xs font-medium text-status-resolved">
            Active
          </span>
        ) : (
          <span className="rounded-deh-pill bg-deh-muted/20 px-2 py-0.5 text-deh-xs font-medium text-deh-muted">
            Disabled
          </span>
        )}
        {row.needsPasswordSet && row.active ? (
          <span className="ml-1 rounded-deh-pill bg-deh-yellow/20 px-2 py-0.5 text-deh-xs font-medium text-deh-dark">
            Default password
          </span>
        ) : null}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={startEdit} disabled={isPending}>
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={reset} disabled={isPending}>
            Reset
          </Button>
          <Button
            size="sm"
            variant={row.active ? "outline" : "default"}
            onClick={toggleActive}
            disabled={isPending}
          >
            {row.active ? "Disable" : "Enable"}
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
