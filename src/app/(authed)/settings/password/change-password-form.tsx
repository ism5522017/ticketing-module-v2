"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "./actions";

export function ChangePasswordForm() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    if (next !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    startTransition(async () => {
      const res = await changePassword(current, next, confirm);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOkMsg("Password updated.");
      setCurrent("");
      setNext("");
      setConfirm("");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-deh-lg bg-deh-white p-5 ring-1 ring-deh-border"
    >
      <div>
        <Label htmlFor="current">Current password</Label>
        <Input
          id="current"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          disabled={isPending}
          autoComplete="current-password"
        />
      </div>
      <div>
        <Label htmlFor="next">New password</Label>
        <Input
          id="next"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={6}
          disabled={isPending}
          autoComplete="new-password"
        />
      </div>
      <div>
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
          disabled={isPending}
          autoComplete="new-password"
        />
      </div>

      {error ? <p className="text-deh-sm text-deh-red">{error}</p> : null}
      {okMsg ? <p className="text-deh-sm text-deh-green">{okMsg}</p> : null}

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !current || next.length < 6 || next !== confirm}
      >
        {isPending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
