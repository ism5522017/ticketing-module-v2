"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building, DoorOpen, KeyRound, Lock, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resolveStaffLogin,
  resolveTenantLogin,
  signInWithContinuation,
  type ResolveResult,
} from "./actions";

type Tab = "tenant" | "staff";

type Stage =
  | { kind: "identifier" }
  | { kind: "password"; continuationToken: string; displayLabel: string };

export interface LoginBuildingOption {
  id: string;
  name: string;
  locality: string | null;
  city: string | null;
}

export function LoginForm({ buildings }: { buildings: LoginBuildingOption[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("tenant");

  // Tenant fields
  const [buildingQuery, setBuildingQuery] = useState("");
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [flat, setFlat] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);

  // Staff field
  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<Stage>({ kind: "identifier" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function switchTab(next: Tab) {
    setTab(next);
    setBuildingQuery("");
    setBuildingId(null);
    setFlat("");
    setUsername("");
    setPassword("");
    setStage({ kind: "identifier" });
    setError(null);
    setSuggestOpen(false);
  }

  function onTenantContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!buildingId) {
      setError("Please pick your building from the suggestions.");
      return;
    }
    if (!flat.trim()) {
      setError("Enter your flat number.");
      return;
    }
    const picked = buildings.find((b) => b.id === buildingId);
    const displayLabel = picked ? `${picked.name} · ${flat.trim()}` : `Flat ${flat.trim()}`;
    startTransition(async () => {
      const res = await resolveTenantLogin(buildingId, flat.trim());
      handleResolveResult(res, displayLabel);
    });
  }

  function onStaffContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await resolveStaffLogin(username);
      handleResolveResult(res, username.trim());
    });
  }

  function handleResolveResult(res: ResolveResult, displayLabel: string) {
    if (res.status === "error") {
      setError(res.error);
      return;
    }
    if (res.status === "first_login") {
      router.push(res.setPasswordPath);
      return;
    }
    setStage({ kind: "password", continuationToken: res.continuationToken, displayLabel });
  }

  function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (stage.kind !== "password") return;
    setError(null);
    startTransition(async () => {
      const res = await signInWithContinuation(stage.continuationToken, password);
      if (res.status === "error") setError(res.error);
      // Success: server action redirects.
    });
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <header className="mb-6 text-center">
        <h1 className="font-display text-deh-2xl font-bold text-deh-dark">
          Welcome back
        </h1>
        <p className="mt-1.5 text-deh-sm text-deh-muted">
          Pick how you usually sign in, then enter your credentials.
        </p>
      </header>

      <div role="tablist" className="mb-6 grid grid-cols-2 rounded-deh-pill bg-deh-gray-bg p-1">
        <TabButton active={tab === "tenant"} onClick={() => switchTab("tenant")}>
          <Building className="h-4 w-4" />
          Tenant
        </TabButton>
        <TabButton active={tab === "staff"} onClick={() => switchTab("staff")}>
          <UserRound className="h-4 w-4" />
          Staff
        </TabButton>
      </div>

      {stage.kind === "identifier" ? (
        tab === "tenant" ? (
          <TenantIdentifierForm
            buildings={buildings}
            buildingQuery={buildingQuery}
            setBuildingQuery={setBuildingQuery}
            buildingId={buildingId}
            setBuildingId={setBuildingId}
            flat={flat}
            setFlat={setFlat}
            suggestOpen={suggestOpen}
            setSuggestOpen={setSuggestOpen}
            isPending={isPending}
            onSubmit={onTenantContinue}
          />
        ) : (
          <StaffIdentifierForm
            username={username}
            setUsername={setUsername}
            isPending={isPending}
            onSubmit={onStaffContinue}
          />
        )
      ) : (
        <form onSubmit={onSignIn} className="space-y-4">
          <div className="flex items-center justify-between rounded-deh-md border border-deh-border bg-deh-light-blue/60 px-3 py-2 text-deh-sm">
            <span className="flex items-center gap-2 text-deh-text">
              <KeyRound className="h-3.5 w-3.5 text-deh-blue" />
              Continuing as <span className="font-semibold">{stage.displayLabel}</span>
            </span>
            <button
              type="button"
              onClick={() => setStage({ kind: "identifier" })}
              className="text-deh-xs font-medium text-deh-blue hover:underline"
            >
              Change
            </button>
          </div>
          <div>
            <Label htmlFor="password" className="text-deh-text">Password</Label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <Lock className="h-4 w-4 text-deh-muted" />
              </span>
              <Input
                id="password"
                type="password"
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                required
                className="focus-deh h-11 pl-9 text-deh-md"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={isPending || password.length === 0}
            className="btn-glow w-full rounded-deh-pill bg-deh-blue py-3 text-deh-md font-semibold text-white hover:bg-deh-dark-blue"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      )}

      {error ? (
        <p className="mt-4 rounded-deh-md bg-deh-red/10 px-3 py-2 text-center text-deh-xs font-medium text-deh-red">
          {error}
        </p>
      ) : null}

      <p className="mt-8 text-center text-deh-xs text-deh-muted">
        Trouble signing in? Call the society office at{" "}
        <a
          href="tel:+918107216176"
          className="font-semibold text-deh-blue hover:underline"
        >
          +91 810 721 6176
        </a>
        .
      </p>
    </div>
  );
}

function TenantIdentifierForm({
  buildings,
  buildingQuery,
  setBuildingQuery,
  buildingId,
  setBuildingId,
  flat,
  setFlat,
  suggestOpen,
  setSuggestOpen,
  isPending,
  onSubmit,
}: {
  buildings: LoginBuildingOption[];
  buildingQuery: string;
  setBuildingQuery: (s: string) => void;
  buildingId: string | null;
  setBuildingId: (id: string | null) => void;
  flat: string;
  setFlat: (s: string) => void;
  suggestOpen: boolean;
  setSuggestOpen: (b: boolean) => void;
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [highlight, setHighlight] = useState(0);

  const matches = useMemo(() => {
    const q = buildingQuery.trim().toLowerCase();
    if (!q) return [];
    return buildings
      .filter((b) => {
        if (b.name.toLowerCase().includes(q)) return true;
        if (b.locality && b.locality.toLowerCase().includes(q)) return true;
        if (b.city && b.city.toLowerCase().includes(q)) return true;
        return false;
      })
      .slice(0, 8);
  }, [buildingQuery, buildings]);

  useEffect(() => {
    setHighlight(0);
  }, [buildingQuery]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setSuggestOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [setSuggestOpen]);

  function pick(b: LoginBuildingOption) {
    setBuildingId(b.id);
    setBuildingQuery(b.name);
    setSuggestOpen(false);
  }

  function onBuildingKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestOpen || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && matches[highlight]) {
      e.preventDefault();
      pick(matches[highlight]);
    } else if (e.key === "Escape") {
      setSuggestOpen(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div ref={wrapRef}>
        <Label htmlFor="building" className="text-deh-text">Building</Label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Building className="h-4 w-4 text-deh-muted" />
          </span>
          <Input
            id="building"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            value={buildingQuery}
            onChange={(e) => {
              setBuildingQuery(e.target.value);
              setBuildingId(null);
              setSuggestOpen(true);
            }}
            onFocus={() => setSuggestOpen(true)}
            onKeyDown={onBuildingKey}
            placeholder="Start typing your building name"
            disabled={isPending}
            required
            aria-autocomplete="list"
            aria-expanded={suggestOpen && matches.length > 0}
            aria-controls="building-suggestions"
            className="focus-deh h-11 pl-9 text-deh-md"
          />
          {suggestOpen && matches.length > 0 ? (
            <ul
              id="building-suggestions"
              role="listbox"
              className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-deh-md border border-deh-border bg-white py-1 shadow-deh-card"
            >
              {matches.map((b, i) => {
                const sub = [b.locality, b.city].filter(Boolean).join(", ");
                return (
                  <li
                    key={b.id}
                    role="option"
                    aria-selected={i === highlight}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(b);
                    }}
                    onMouseEnter={() => setHighlight(i)}
                    className={
                      "cursor-pointer px-3 py-2 text-deh-sm " +
                      (i === highlight ? "bg-deh-light-blue/60" : "")
                    }
                  >
                    <div className="font-medium text-deh-text">{b.name}</div>
                    {sub ? (
                      <div className="text-deh-xs text-deh-muted">{sub}</div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
        <p className="mt-1 text-deh-xs text-deh-muted">
          {buildingId
            ? "Building selected. Now enter your flat below."
            : "Pick the building that matches yours from the dropdown."}
        </p>
      </div>

      <div>
        <Label htmlFor="flat" className="text-deh-text">Flat</Label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <DoorOpen className="h-4 w-4 text-deh-muted" />
          </span>
          <Input
            id="flat"
            autoComplete="off"
            spellCheck={false}
            value={flat}
            onChange={(e) => setFlat(e.target.value)}
            placeholder="e.g. 101"
            disabled={isPending}
            required
            className="focus-deh h-11 pl-9 text-deh-md"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending || !buildingId || flat.trim().length === 0}
        className="btn-glow w-full rounded-deh-pill bg-deh-blue py-3 text-deh-md font-semibold text-white hover:bg-deh-dark-blue"
      >
        {isPending ? "Checking…" : (<><span>Continue</span><ArrowRight className="ml-1 h-4 w-4" /></>)}
      </Button>
    </form>
  );
}

function StaffIdentifierForm({
  username,
  setUsername,
  isPending,
  onSubmit,
}: {
  username: string;
  setUsername: (s: string) => void;
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="username" className="text-deh-text">Username</Label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <UserRound className="h-4 w-4 text-deh-muted" />
          </span>
          <Input
            id="username"
            autoFocus
            autoComplete="username"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. admin"
            disabled={isPending}
            required
            className="focus-deh h-11 pl-9 text-deh-md"
          />
        </div>
        <p className="mt-1 text-deh-xs text-deh-muted">
          The username you sign in with.
        </p>
      </div>
      <Button
        type="submit"
        disabled={isPending || username.trim().length < 2}
        className="btn-glow w-full rounded-deh-pill bg-deh-blue py-3 text-deh-md font-semibold text-white hover:bg-deh-dark-blue"
      >
        {isPending ? "Checking…" : (<><span>Continue</span><ArrowRight className="ml-1 h-4 w-4" /></>)}
      </Button>
    </form>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "inline-flex items-center justify-center gap-1.5 rounded-deh-pill px-3 py-2 text-deh-sm font-semibold transition-all " +
        (active
          ? "bg-white text-deh-dark shadow-deh-card"
          : "text-deh-muted hover:text-deh-text")
      }
    >
      {children}
    </button>
  );
}
