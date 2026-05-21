"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBuildingAction } from "./actions";

export function NewBuildingForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function reset() {
    setName("");
    setLocality("");
    setCity("");
    setState("");
    setAddress("");
    setCategory("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await createBuildingAction({
        name,
        locality: locality || null,
        city: city || null,
        state: state || null,
        address: address || null,
        category: category || null,
      });
      if (res.ok) {
        setMessage({ kind: "ok", text: `Created "${name}".` });
        reset();
      } else {
        setMessage({ kind: "err", text: res.error });
      }
    });
  }

  if (!open) {
    return (
      <div className="mb-4">
        <Button onClick={() => setOpen(true)}>+ Add property</Button>
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
          <Label htmlFor="b-name">Name</Label>
          <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} required />
        </div>
        <div>
          <Label htmlFor="b-locality">Locality</Label>
          <Input id="b-locality" value={locality} onChange={(e) => setLocality(e.target.value)} disabled={isPending} />
        </div>
        <div>
          <Label htmlFor="b-city">City</Label>
          <Input id="b-city" value={city} onChange={(e) => setCity(e.target.value)} disabled={isPending} />
        </div>
        <div>
          <Label htmlFor="b-state">State</Label>
          <Input id="b-state" value={state} onChange={(e) => setState(e.target.value)} disabled={isPending} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="b-address">Address</Label>
          <Input id="b-address" value={address} onChange={(e) => setAddress(e.target.value)} disabled={isPending} />
        </div>
        <div>
          <Label htmlFor="b-category">Category</Label>
          <Input id="b-category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={isPending} placeholder="e.g. Residential" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create property"}
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
