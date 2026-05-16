"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StaffListRow } from "@/lib/admin/staff-list";
import {
  disableManagerAction,
  enableManagerAction,
  renameManagerAction,
  resetManagerPasswordAction,
} from "./actions";

export function ManagerRow({ row }: { row: StaffListRow }) {
  const [name, setName] = useState(row.fullName);
  const [editingName, setEditingName] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function saveName() {
    setMessage(null);
    startTransition(async () => {
      const res = await renameManagerAction({ roleId: row.id, fullName: name });
      if (res.ok) {
        setEditingName(false);
        setMessage({ kind: "ok", text: "Saved." });
      } else {
        setMessage({ kind: "err", text: res.error });
      }
    });
  }

  function reset() {
    setMessage(null);
    startTransition(async () => {
      const res = await resetManagerPasswordAction({ roleId: row.id });
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

  function toggleActive() {
    setMessage(null);
    startTransition(async () => {
      const res = row.active
        ? await disableManagerAction({ roleId: row.id })
        : await enableManagerAction({ roleId: row.id });
      if (!res.ok) setMessage({ kind: "err", text: res.error });
    });
  }

  return (
    <tr className="border-b border-deh-border">
      <td className="px-3 py-3">
        {editingName ? (
          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-48"
              disabled={isPending}
            />
            <Button size="sm" onClick={saveName} disabled={isPending}>Save</Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setName(row.fullName);
                setEditingName(false);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="text-left font-medium text-deh-text hover:underline"
            onClick={() => setEditingName(true)}
          >
            {row.fullName}
          </button>
        )}
      </td>
      <td className="px-3 py-3 font-mono text-deh-sm text-deh-muted">{row.username}</td>
      <td className="px-3 py-3 text-deh-sm">
        {row.active ? (
          <span className="rounded-deh-pill bg-status-resolved/15 px-2 py-0.5 text-deh-xs font-medium text-status-resolved">
            Active
          </span>
        ) : (
          <span className="rounded-deh-pill bg-deh-muted/20 px-2 py-0.5 text-deh-xs font-medium text-deh-muted">
            Disabled
          </span>
        )}
        {row.needsPasswordSet && row.active ? (
          <span className="ml-2 rounded-deh-pill bg-deh-yellow/20 px-2 py-0.5 text-deh-xs font-medium text-deh-dark">
            Pending first sign-in
          </span>
        ) : null}
      </td>
      <td className="px-3 py-3 text-deh-xs text-deh-muted">
        {new Date(row.createdAt).toLocaleDateString()}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={reset} disabled={isPending}>
            Reset password
          </Button>
          <Button
            size="sm"
            variant={row.active ? "outline" : "default"}
            onClick={toggleActive}
            disabled={isPending}
          >
            {row.active ? "Disable" : "Re-enable"}
          </Button>
        </div>
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
