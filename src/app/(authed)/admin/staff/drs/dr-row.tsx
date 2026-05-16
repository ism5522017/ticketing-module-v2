"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { DrListRow } from "@/lib/admin/staff-list";
import { resetDrPasswordAction, retireDrAction } from "./actions";

export function DrRow({ row }: { row: DrListRow }) {
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setMessage(null);
    startTransition(async () => {
      const res = await resetDrPasswordAction({ roleId: row.id });
      if (res.ok) {
        setMessage({
          kind: "ok",
          text: `Temporary password: ${res.data!.tempPassword}. They'll set their own at next sign-in.`,
        });
      } else {
        setMessage({ kind: "err", text: res.error });
      }
    });
  }

  function retire() {
    if (!confirm(`Retire DR ${row.username} for ${row.buildingName}?`)) return;
    setMessage(null);
    startTransition(async () => {
      const res = await retireDrAction({ roleId: row.id });
      if (!res.ok) setMessage({ kind: "err", text: res.error });
    });
  }

  return (
    <tr className="border-b border-deh-border">
      <td className="px-3 py-3 font-medium text-deh-text">{row.buildingName}</td>
      <td className="px-3 py-3 text-deh-text">{row.tenantName}</td>
      <td className="px-3 py-3 font-mono text-deh-sm text-deh-muted">{row.username}</td>
      <td className="px-3 py-3 text-deh-sm">
        {row.active ? (
          <span className="rounded-deh-pill bg-status-resolved/15 px-2 py-0.5 text-deh-xs font-medium text-status-resolved">
            Active
          </span>
        ) : (
          <span className="rounded-deh-pill bg-deh-muted/20 px-2 py-0.5 text-deh-xs font-medium text-deh-muted">
            Retired
          </span>
        )}
        {row.needsPasswordSet && row.active ? (
          <span className="ml-2 rounded-deh-pill bg-deh-yellow/20 px-2 py-0.5 text-deh-xs font-medium text-deh-dark">
            Pending first sign-in
          </span>
        ) : null}
      </td>
      <td className="px-3 py-3 text-deh-xs text-deh-muted">
        {new Date(row.startedAt).toLocaleDateString()}
        {row.endedAt ? ` → ${new Date(row.endedAt).toLocaleDateString()}` : ""}
      </td>
      <td className="px-3 py-3">
        {row.active ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={reset} disabled={isPending}>
              Reset password
            </Button>
            <Button size="sm" variant="outline" onClick={retire} disabled={isPending}>
              Retire
            </Button>
          </div>
        ) : (
          <span className="text-deh-xs italic text-deh-muted">—</span>
        )}
        {message ? (
          <p
            className={`mt-2 text-deh-xs ${
              message.kind === "ok" ? "text-status-resolved" : "text-deh-red"
            }`}
          >
            {message.text}
          </p>
        ) : null}
      </td>
    </tr>
  );
}
