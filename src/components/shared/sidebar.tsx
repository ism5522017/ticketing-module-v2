"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Banknote,
  Building2,
  ChevronsLeft,
  ChevronsRight,
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
    { href: "/admin/buildings", label: "Properties", icon: Building2 },
    { href: "/admin/staff/admins", label: "Admins", icon: ShieldUser },
    { href: "/admin/staff/managers", label: "Managers", icon: Wrench },
    { href: "/admin/staff/drs", label: "DRs", icon: UserSquare2 },
    { href: "/admin/staff/tenants", label: "Khidmat Guzars", icon: Users },
    { href: "/admin/staff/tenant-credentials", label: "Login IDs", icon: KeyRound },
  ],
};

const STORAGE_KEY = "deh:sidebar:collapsed";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname() ?? "";
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const items = NAV[role];

  return (
    <aside
      className={cn(
        "bg-deh-header sticky top-16 flex h-[calc(100vh-4rem)] shrink-0 flex-col border-r border-white/5 transition-[width] duration-200",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div className="flex h-12 items-center justify-end border-b border-white/5 px-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-9 w-9 items-center justify-center rounded-deh-md text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-deh-md px-3 py-2 text-deh-sm font-semibold transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-white/15 text-white shadow-[inset_3px_0_0_0_#fcbf49]"
                  : "text-white/75 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
