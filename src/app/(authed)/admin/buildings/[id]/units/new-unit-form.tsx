"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUnitAction } from "./actions";

export function NewUnitForm({ buildingId }: { buildingId: string }) {
  const [open, setOpen] = useState(false);
  const [wing, setWing] = useState("");
  const [flat, setFlat] = useState("");
  const [floor, setFloor] = useState("");
  const [unitType, setUnitType] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function reset() {
    setWing("");
    setFlat("");
    setFloor("");
    setUnitType("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await createUnitAction({
        buildingId,
        wing: wing || null,
        flat,
        floor: floor || null,
        unitType: unitType || null,
      });
      if (res.ok) {
        setMessage({ kind: "ok", text: `Created flat ${[wing, flat].filter(Boolean).join("-")}.` });
        reset();
      } else {
        setMessage({ kind: "err", text: res.error });
      }
    });
  }

  if (!open) {
    return (
      <div className="mb-4">
        <Button onClick={() => setOpen(true)}>+ Add flat</Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mb-4 rounded-deh-md border border-deh-border bg-deh-card p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="wing">Wing (optional)</Label>
          <Input id="wing" value={wing} onChange={(e) => setWing(e.target.value)} disabled={isPending} placeholder="A" />
        </div>
        <div>
          <Label htmlFor="flat">Flat number</Label>
          <Input id="flat" value={flat} onChange={(e) => setFlat(e.target.value)} disabled={isPending} required placeholder="e.g. 504" />
        </div>
        <div>
          <Label htmlFor="floor">Floor (optional)</Label>
          <Input id="floor" value={floor} onChange={(e) => setFloor(e.target.value)} disabled={isPending} placeholder="5" />
        </div>
        <div>
          <Label htmlFor="unit-type">Type (optional)</Label>
          <Input id="unit-type" value={unitType} onChange={(e) => setUnitType(e.target.value)} disabled={isPending} placeholder="2BHK" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create flat"}
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
        <p className={`mt-3 text-deh-sm ${message.kind === "ok" ? "text-status-resolved" : "text-deh-red"}`}>
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
