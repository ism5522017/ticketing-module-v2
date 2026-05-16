"use client";

import { useState, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TenantProfile } from "@/lib/tenant-profile";
import { updateTenantProfile } from "./actions";

export function ProfileCard({ profile }: { profile: TenantProfile }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [location, setLocation] = useState(profile.location);
  const [wing, setWing] = useState(profile.wing);
  const [flat, setFlat] = useState(profile.flat);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticProfile, addOptimisticProfile] = useOptimistic(
    profile,
    (state, newProfile: Partial<TenantProfile>) => ({ ...state, ...newProfile, locationEdited: true })
  );

  function startEdit() {
    setLocation(profile.location);
    setWing(profile.wing);
    setFlat(profile.flat);
    setError(null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setError(null);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      // Instantly update UI before the server request completes
      addOptimisticProfile({
        location: location.trim() !== profile.location ? location.trim() : profile.location,
        wing: wing.trim() !== profile.wing ? wing.trim() : profile.wing,
        flat: flat.trim() !== profile.flat ? flat.trim() : profile.flat,
      });
      setIsEditing(false); // Instantly close edit mode

      const res = await updateTenantProfile({
        location: location.trim() !== profile.location ? location.trim() : undefined,
        wing: wing.trim() !== profile.wing ? wing.trim() : undefined,
        flat: flat.trim() !== profile.flat ? flat.trim() : undefined,
      });
      if (!res.ok) {
        setError(res.error);
        setIsEditing(true); // Re-open edit mode if it failed
        return;
      }
      router.refresh();
    });
  }

  const badge = optimisticProfile.locationEdited
    ? { label: "edited by tenant", className: "bg-deh-light-orange text-deh-dark-orange" }
    : { label: "auto-filled", className: "bg-deh-light-green text-deh-green" };

  return (
    <section className="rounded-deh-xl bg-white p-6 shadow-deh-card ring-1 ring-deh-border">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-deh-md bg-deh-light-blue text-deh-blue">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <h2 className="font-display text-deh-lg font-semibold text-deh-dark">
            Your details
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-deh-pill px-2.5 py-0.5 text-deh-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
          {!isEditing ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={startEdit}
              className="text-deh-blue hover:bg-deh-light-blue"
            >
              Edit details
            </Button>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Name</dt>
          <dd className="mt-0.5 text-deh-base text-deh-text">{optimisticProfile.fullName}</dd>
        </div>
        <div>
          <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Contact</dt>
          <dd className="mt-0.5 text-deh-base text-deh-text">{optimisticProfile.contact || "—"}</dd>
        </div>

        <div className="sm:col-span-2">
          <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Location</dt>
          <dd className="mt-0.5">
            {isEditing ? (
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isPending}
                placeholder="Building Name, Address"
              />
            ) : (
              <span className="text-deh-base text-deh-text">{optimisticProfile.location || "—"}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Wing</dt>
          <dd className="mt-0.5">
            {isEditing ? (
              <Input
                value={wing}
                onChange={(e) => setWing(e.target.value)}
                disabled={isPending}
              />
            ) : (
              <span className="text-deh-base text-deh-text">{optimisticProfile.wing || "—"}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-deh-xs uppercase tracking-wide text-deh-muted">Flat</dt>
          <dd className="mt-0.5">
            {isEditing ? (
              <Input
                value={flat}
                onChange={(e) => setFlat(e.target.value)}
                disabled={isPending}
              />
            ) : (
              <span className="text-deh-base text-deh-text">{optimisticProfile.flat || "—"}</span>
            )}
          </dd>
        </div>
      </dl>

      {isEditing ? (
        <div className="mt-4 flex items-center gap-2">
          <Button
            type="button"
            onClick={save}
            disabled={isPending}
            size="sm"
          >
            {isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cancelEdit}
            disabled={isPending}
          >
            Cancel
          </Button>
          {error ? (
            <span className="text-deh-xs text-deh-red">{error}</span>
          ) : null}
        </div>
      ) : null}

      {/* Hidden semantic label used by axe/SR for the badge area */}
      <Label className="sr-only" htmlFor="profile-status">Profile status</Label>
    </section>
  );
}
