"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Building2,
  ClipboardList,
  FileSignature,
  Gauge,
  KeyRound,
  LayoutDashboard,
  type LucideIcon,
  PlusCircle,
  ShieldUser,
  Users,
  UserSquare2,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "tenant" | "admin" | "manager" | "dr";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: Record<Role, NavItem[]> = {
  tenant: [
    { href: "/tenant/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tenant/tickets/new", label: "Raise ticket", icon: PlusCircle },
  ],
  dr: [
    { href: "/dr/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dr/tickets/new", label: "Raise ticket", icon: PlusCircle },
  ],
  manager: [
    { href: "/manager/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/manager/requisitions", label: "Requisitions", icon: FileSignature },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: Gauge },
    { href: "/admin/tickets", label: "Tickets", icon: ClipboardList },
    { href: "/admin/budgets", label: "Budgets", icon: Banknote },
    { href: "/admin/staff/admins", label: "Admins", icon: ShieldUser },
    { href: "/admin/staff/managers", label: "Managers", icon: Wrench },
    { href: "/admin/staff/drs", label: "DRs", icon: UserSquare2 },
    { href: "/admin/staff/tenants", label: "Tenants", icon: Users },
    { href: "/admin/staff/tenant-credentials", label: "Login IDs", icon: KeyRound },
    { href: "/admin/buildings/codes", label: "Codes", icon: Building2 },
  ],
};

export function RoleNav({ role }: { role: Role }) {
  const pathname = usePathname() ?? "";
  const items = NAV[role];
  return (
    <nav className="flex items-center gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-deh-pill px-3 py-1.5 text-deh-sm font-semibold transition-all",
              active
                ? "nav-active"
                : "text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
