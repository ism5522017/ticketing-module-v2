"use client";

import { useState, useTransition } from "react";
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
        <Label htmlFor="new-password">New password</Label>
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
        />
        <p className="text-deh-xs text-deh-muted mt-1">At least 6 characters.</p>
      </div>
      <div>
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={isPending}
          required
          minLength={6}
        />
      </div>
      <Button type="submit" disabled={disabled} className="w-full">
        {isPending ? "Saving…" : "Save and continue"}
      </Button>
      {error ? <p className="text-deh-xs text-deh-red text-center">{error}</p> : null}
    </form>
  );
}
