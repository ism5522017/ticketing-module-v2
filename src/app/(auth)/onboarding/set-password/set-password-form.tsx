"use client";

import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setPassword } from "../actions";

export function SetPasswordForm({ token }: { token: string }) {
  const [password, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await setPassword(token, password, confirm);
      if (!res.ok) setError(res.error);
      // Success: server action redirects.
    });
  }

  const disabled = isPending || password.length < 6 || confirm.length === 0;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="new-password" className="text-deh-text">New password</Label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Lock className="h-4 w-4 text-deh-muted" />
          </span>
          <Input
            id="new-password"
            type="password"
            autoFocus
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPwd(e.target.value)}
            disabled={isPending}
            required
            minLength={6}
            className="focus-deh h-11 pl-9 text-deh-md"
          />
        </div>
        <p className="mt-1 text-deh-xs text-deh-muted">At least 6 characters.</p>
      </div>
      <div>
        <Label htmlFor="confirm-password" className="text-deh-text">Confirm password</Label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Lock className="h-4 w-4 text-deh-muted" />
          </span>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={isPending}
            required
            minLength={6}
            className="focus-deh h-11 pl-9 text-deh-md"
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={disabled}
        className="btn-glow w-full rounded-deh-pill bg-deh-blue py-3 text-deh-md font-semibold text-white hover:bg-deh-dark-blue"
      >
        {isPending ? "Saving…" : "Save and continue"}
      </Button>
      {error ? (
        <p className="mt-2 rounded-deh-md bg-deh-red/10 px-3 py-2 text-center text-deh-xs font-medium text-deh-red">
          {error}
        </p>
      ) : null}
    </form>
  );
}
