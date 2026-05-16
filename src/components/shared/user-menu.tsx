"use client";

import Link from "next/link";
import { useTransition } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { signOut } from "@/app/(authed)/actions";

export function UserMenu({
  fullName,
  initials,
  showAvatar,
}: {
  fullName: string;
  initials: string;
  showAvatar: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function onLogout() {
    startTransition(() => {
      void signOut();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {showAvatar ? (
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-deh-xs font-bold text-white ring-1 ring-white/25 backdrop-blur"
          aria-hidden="true"
          title={fullName}
        >
          {initials}
        </div>
      ) : (
        <span className="hidden text-deh-sm font-semibold text-white sm:inline">
          {fullName}
        </span>
      )}
      <Link
        href="/settings/password"
        className="inline-flex items-center gap-1.5 rounded-deh-pill px-3 py-1.5 text-deh-xs font-semibold text-white/85 transition-colors hover:bg-white/15 hover:text-white"
      >
        <KeyRound className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Password</span>
      </Link>
      <button
        type="button"
        onClick={onLogout}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-deh-pill bg-white/15 px-3 py-1.5 text-deh-xs font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/25 disabled:opacity-60"
      >
        <LogOut className="h-3.5 w-3.5" />
        {isPending ? "Signing out…" : "Log out"}
      </button>
    </div>
  );
}
