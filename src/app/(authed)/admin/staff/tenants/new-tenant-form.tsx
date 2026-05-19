"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BuildingSummary } from "@/lib/buildings/list";
import { createTenantAction, listUnitsForBuildingAction } from "./actions";

interface UnitOption {
  id: string;
  label: string;
}

function buildingLabel(b: BuildingSummary) {
  const sub = [b.locality, b.city].filter(Boolean).join(", ");
  return sub ? `${b.name} (${sub})` : b.name;
}

export function NewTenantForm({ buildings }: { buildings: BuildingSummary[] }) {
  const [open, setOpen] = useState(false);
  const [buildingId, setBuildingId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function onBuildingChange(id: string) {
    setBuildingId(id);
    setUnitId("");
    setUnitOptions([]);
    if (!id) return;
    setLoadingUnits(true);
    const opts = await listUnitsForBuildingAction(id);
    setUnitOptions(opts);
    setLoadingUnits(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!buildingId || !unitId) {
      setMessage({ kind: "err", text: "Pick a building and unit." });
      return;
    }
    startTransition(async () => {
      const res = await createTenantAction({
        buildingId,
        unitId,
        name,
        email: email || undefined,
        phone: phone || undefined,
        contact: contact || undefined,
        password: password || undefined,
      });
      if (res.ok) {
        setMessage({
          kind: "ok",
          text: `Created. Email: ${res.data!.email}. Temp password: ${res.data!.tempPassword}.`,
        });
        setBuildingId("");
        setUnitId("");
        setUnitOptions([]);
        setName("");
        setEmail("");
        setPhone("");
        setContact("");
        setPassword("");
      } else {
        setMessage({ kind: "err", text: res.error });
      }
    });
  }

  if (!open) {
    return (
      <div className="mb-4">
        <Button onClick={() => setOpen(true)}>+ Add tenant</Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mb-4 rounded-deh-md border border-deh-border bg-deh-card p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label htmlFor="building">Building</Label>
          <select
            id="building"
            value={buildingId}
            onChange={(e) => onBuildingChange(e.target.value)}
            disabled={isPending}
            required
            className="mt-1 w-full rounded-md border border-deh-border bg-background px-3 py-2 text-deh-base"
          >
            <option value="">Select a building…</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {buildingLabel(b)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <select
            id="unit"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            disabled={isPending || !buildingId || loadingUnits}
            required
            className="mt-1 w-full rounded-md border border-deh-border bg-background px-3 py-2 text-deh-base"
          >
            <option value="">
              {!buildingId
                ? "Pick a building first…"
                : loadingUnits
                  ? "Loading units…"
                  : unitOptions.length === 0
                    ? "No units in this building"
                    : "Select a unit…"}
            </option>
            {unitOptions.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="name">Tenant name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} required />
        </div>
        <div>
          <Label htmlFor="email">Email (optional)</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="auto-synth if blank"
            disabled={isPending}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isPending} />
        </div>
        <div>
          <Label htmlFor="contact">Contact notes</Label>
          <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} disabled={isPending} />
        </div>
        <div>
          <Label htmlFor="password">Temp password (optional)</Label>
          <Input
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="defaults to 1234"
            disabled={isPending}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create tenant"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen(false);
            setMessage(null);
          }}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
      {message ? (
        <p
          className={`mt-3 text-deh-sm ${
            message.kind === "ok" ? "text-status-resolved" : "text-deh-red"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
