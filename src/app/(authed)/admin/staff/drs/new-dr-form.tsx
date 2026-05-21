"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BuildingSummary } from "@/lib/buildings/list";
import { createDrAction, listTenantsForBuildingAction } from "./actions";

interface TenantOption {
  id: string;
  label: string;
}

function buildingLabel(b: BuildingSummary) {
  const sub = [b.locality, b.city].filter(Boolean).join(", ");
  return sub ? `${b.name} (${sub})` : b.name;
}

export function NewDrForm({ buildings }: { buildings: BuildingSummary[] }) {
  const [open, setOpen] = useState(false);
  const [buildingId, setBuildingId] = useState("");
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function onBuildingChange(id: string) {
    setBuildingId(id);
    setTenantId("");
    setTenantOptions([]);
    if (!id) return;
    setLoadingTenants(true);
    const opts = await listTenantsForBuildingAction(id);
    setTenantOptions(opts);
    setLoadingTenants(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!buildingId || !tenantId) {
      setMessage({ kind: "err", text: "Choose a building and a Khidmat Guzar." });
      return;
    }
    startTransition(async () => {
      const res = await createDrAction({
        buildingId,
        tenantId,
        username,
        password: password || undefined,
      });
      if (res.ok) {
        setMessage({
          kind: "ok",
          text: `Created. Temporary password: ${res.data!.tempPassword}.`,
        });
        setBuildingId("");
        setTenantId("");
        setTenantOptions([]);
        setUsername("");
        setPassword("");
      } else {
        setMessage({ kind: "err", text: res.error });
      }
    });
  }

  if (!open) {
    return (
      <div className="mb-4">
        <Button onClick={() => setOpen(true)}>+ Add DR</Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mb-4 rounded-deh-md border border-deh-border bg-deh-card p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <Label htmlFor="tenant">Khidmat Guzar (must live in that building)</Label>
          <select
            id="tenant"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            disabled={isPending || !buildingId || loadingTenants}
            required
            className="mt-1 w-full rounded-md border border-deh-border bg-background px-3 py-2 text-deh-base"
          >
            <option value="">
              {!buildingId
                ? "Pick a building first…"
                : loadingTenants
                  ? "Loading…"
                  : tenantOptions.length === 0
                    ? "No active Khidmat Guzars in this building"
                    : "Select a Khidmat Guzar…"}
            </option>
            {tenantOptions.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="username">DR username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. abc-dr"
            disabled={isPending}
            required
          />
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
          {isPending ? "Creating…" : "Create DR"}
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
