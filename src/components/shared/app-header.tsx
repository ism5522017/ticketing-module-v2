import { Wrench } from "lucide-react";
import { RoleNav } from "./role-nav";
import { UserMenu } from "./user-menu";

type Role = "tenant" | "admin" | "manager" | "dr";

const ROLE_SUBTEXT: Record<Role, string> = {
  tenant: "Tenant",
  admin: "Admin",
  manager: "Manager",
  dr: "DR",
};

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function AppHeader({
  role,
  fullName,
  buildingLabel,
}: {
  role: Role;
  fullName: string;
  buildingLabel?: string | null;
}) {
  const subtext =
    role === "dr" && buildingLabel
      ? `DR — ${buildingLabel}`
      : ROLE_SUBTEXT[role];

  return (
    <header className="bg-deh-header sticky top-0 z-30 border-b border-white/5 shadow-[0_4px_18px_rgba(0,32,56,0.18)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-deh-md bg-deh-yellow text-deh-dark shadow-[0_4px_12px_rgba(252,191,73,0.4)] ring-1 ring-white/20">
            <Wrench className="h-5 w-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-deh-md font-bold tracking-tight text-white">
              DEH Maintenance
            </span>
            <span className="text-deh-xxs uppercase tracking-[0.18em] text-deh-yellow">
              {subtext}
            </span>
          </div>
          <span className="hidden h-8 w-px bg-white/10 md:block" aria-hidden="true" />
        </div>
        <div className="flex-1 overflow-x-auto">
          <RoleNav role={role} />
        </div>
        <UserMenu
          fullName={fullName}
          initials={initialsFor(fullName)}
          showAvatar={role === "tenant"}
        />
      </div>
    </header>
  );
}
