"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmProfile } from "../actions";

type Role = "tenant" | "admin" | "manager" | "dr";

interface TenantContext {
  building: string;
  buildingAddress: string | null;
  wing: string | null;
  flat: string | null;
  email: string | null;
}

export function ConfirmProfileForm({
  role,
  initialFullName,
  initialPhone,
  initialEmail,
  tenantContext,
}: {
  role: Role;
  initialFullName: string;
  initialPhone: string;
  initialEmail: string;
  tenantContext: TenantContext | null;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);

  const initialLocation = tenantContext
    ? tenantContext.buildingAddress
      ? `${tenantContext.building}, ${tenantContext.buildingAddress}`
      : tenantContext.building
    : "";
  const [location, setLocation] = useState(initialLocation);
  const [wing, setWing] = useState(tenantContext?.wing ?? "");
  const [flat, setFlat] = useState(tenantContext?.flat ?? "");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await confirmProfile({
        fullName,
        phone,
        email,
        location: role === "tenant" ? location : undefined,
        wing: role === "tenant" ? wing : undefined,
        flat: role === "tenant" ? flat : undefined,
      });
      if (!res.ok) setError(res.error);
      // Success: server action redirects.
    });
  }

  const phoneValid = /^\d{10}$/.test(phone.replace(/\D/g, ""));
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const tenantLocationValid =
    role !== "tenant" || (location.trim().length > 0 && flat.trim().length > 0);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="full-name">Full name</Label>
        <Input
          id="full-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={isPending}
          required
          minLength={2}
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isPending}
          inputMode="tel"
          required
          placeholder="10-digit mobile number"
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          required
          placeholder="you@example.com"
        />
        <p className="mt-1 text-deh-xs text-deh-muted">
          We&apos;ll use this for password resets and notifications later.
        </p>
      </div>

      {role === "tenant" ? (
        <>
          <div>
            <Label htmlFor="location">Building (name, address)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isPending}
              required
              placeholder="Husami Manzil, Bohri Mohalla"
            />
            <p className="mt-1 text-deh-xs text-deh-muted">
              Building name, comma, address. Edit if anything is off.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="wing">Wing</Label>
              <Input
                id="wing"
                value={wing}
                onChange={(e) => setWing(e.target.value)}
                disabled={isPending}
                placeholder="A"
              />
            </div>
            <div>
              <Label htmlFor="flat">Flat</Label>
              <Input
                id="flat"
                value={flat}
                onChange={(e) => setFlat(e.target.value)}
                disabled={isPending}
                required
                placeholder="504"
              />
            </div>
          </div>
        </>
      ) : null}

      <Button
        type="submit"
        disabled={
          isPending
          || fullName.trim().length < 2
          || !phoneValid
          || !emailValid
          || !tenantLocationValid
        }
        className="w-full"
      >
        {isPending ? "Saving…" : "Save and continue"}
      </Button>
      {error ? <p className="text-deh-xs text-deh-red text-center">{error}</p> : null}
    </form>
  );
}
