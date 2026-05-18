"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building, KeyRound, Lock, UserRound } from "lucide-react";
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
  | { kind: "password"; continuationToken: string };

export function LoginForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("tenant");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<Stage>({ kind: "identifier" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function switchTab(next: Tab) {
    setTab(next);
    setIdentifier("");
    setPassword("");
    setStage({ kind: "identifier" });
    setError(null);
  }

  function onContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fn = tab === "tenant" ? resolveTenantLogin : resolveStaffLogin;
      const res: ResolveResult = await fn(identifier);
      if (res.status === "error") {
        setError(res.error);
        return;
      }
      if (res.status === "first_login") {
        router.push(res.setPasswordPath);
        return;
      }
      setStage({ kind: "password", continuationToken: res.continuationToken });
    });
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

  const identifierLabel = tab === "tenant" ? "Building & Flat" : "Username";
  const identifierPlaceholder = tab === "tenant" ? "e.g. ABC-101" : "e.g. admin";
  const identifierIcon =
    tab === "tenant" ? <Building className="h-4 w-4 text-deh-muted" /> : <UserRound className="h-4 w-4 text-deh-muted" />;

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
        <form onSubmit={onContinue} className="space-y-4">
          <div>
            <Label htmlFor="identifier" className="text-deh-text">
              {identifierLabel}
            </Label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                {identifierIcon}
              </span>
              <Input
                id="identifier"
                autoFocus
                autoComplete={tab === "tenant" ? "off" : "username"}
                spellCheck={false}
                autoCapitalize={tab === "tenant" ? "characters" : "none"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={identifierPlaceholder}
                disabled={isPending}
                required
                className="focus-deh h-11 pl-9 text-deh-md"
              />
            </div>
            <p className="mt-1 text-deh-xs text-deh-muted">
              {tab === "tenant"
                ? "Your building code, a hyphen, and your flat (e.g. ABC-101)."
                : "The username you sign in with."}
            </p>
          </div>
          <Button
            type="submit"
            disabled={isPending || identifier.trim().length < 2}
            className="btn-glow w-full rounded-deh-pill bg-deh-blue py-3 text-deh-md font-semibold text-white hover:bg-deh-dark-blue"
          >
            {isPending ? "Checking…" : (<><span>Continue</span><ArrowRight className="ml-1 h-4 w-4" /></>)}
          </Button>
        </form>
      ) : (
        <form onSubmit={onSignIn} className="space-y-4">
          <div className="flex items-center justify-between rounded-deh-md border border-deh-border bg-deh-light-blue/60 px-3 py-2 text-deh-sm">
            <span className="flex items-center gap-2 text-deh-text">
              <KeyRound className="h-3.5 w-3.5 text-deh-blue" />
              Continuing as <span className="font-semibold">{identifier}</span>
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
