"use client";

import {
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { cn } from "@/lib/utils";

const UserContext = createContext<SessionUser | null>(null);

export function useUser() {
  const user = useContext(UserContext);
  if (!user) throw new Error("useUser must be used within AppShell");
  return user;
}

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
};

const NAV: NavItem[] = [
  { href: "/", label: "หน้าหลัก", icon: LayoutDashboard },
  { href: "/plans", label: "แผนการตรวจประเมิน", icon: FileText },
  { href: "/organization", label: "ผังองค์กร & โครงสร้างสาขา", icon: Building2 },
  { href: "/forms", label: "แบบฟอร์มตรวจประเมิน", icon: ClipboardList },
  {
    href: "/acknowledge",
    label: "รับทราบ/เอกสาร",
    icon: CheckCircle2,
    roles: ["LEADER_AUDIT"],
  },
  { href: "/documents", label: "รายการเอกสารทั้งหมด", icon: FolderOpen },
];

const TITLES: Record<string, string> = {
  "/": "ภาพรวมงานตรวจประเมิน",
  "/plans": "แผนการตรวจประเมิน",
  "/organization": "ผังองค์กร & โครงสร้างสาขา",
  "/forms": "แบบฟอร์มตรวจประเมิน",
  "/acknowledge": "รับทราบ/เอกสาร",
  "/documents": "รายการเอกสารทั้งหมด",
};

function pageTitle(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/forms/")) return "แก้ไขเอกสารตรวจประเมิน";
  if (pathname.startsWith("/documents/")) return "รายละเอียดเอกสาร";
  return "ระบบตรวจประเมินภายใน";
}

function roleBadgeClass(role: Role) {
  if (role === "ADMIN") return "bg-amber-400/15 text-amber-200";
  if (role === "LEADER_AUDIT") return "bg-sky-400/15 text-sky-200";
  return "bg-teal-400/15 text-teal-200";
}

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const title = useMemo(() => pageTitle(pathname), [pathname]);
  const navItems = useMemo(
    () => NAV.filter((item) => !item.roles || item.roles.includes(user.role)),
    [user.role],
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-inner">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">
            Internal Audit
          </p>
          <p className="text-sm font-semibold text-white">ระบบตรวจประเมินภายใน</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-white/10 font-semibold text-white shadow-sm"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
        <p className="mt-0.5 text-xs text-slate-400">@{user.username}</p>
        <span
          className={cn(
            "mt-3 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
            roleBadgeClass(user.role),
          )}
        >
          {ROLE_LABELS[user.role]}
        </span>
        <button
          type="button"
          onClick={logout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );

  return (
    <UserContext.Provider value={user}>
      <div className="flex min-h-screen bg-[#f3f5f8]">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 bg-[#10233a] lg:block">
          {sidebar}
        </aside>
        {open ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/50"
              aria-label="ปิดเมนู"
              onClick={() => setOpen(false)}
            />
            <aside className="relative z-10 h-full w-72 bg-[#10233a] shadow-2xl">
              <button
                type="button"
                className="absolute top-4 right-4 text-slate-300"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </aside>
          </div>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md lg:px-8">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-medium tracking-wide text-teal-700">
                งานตรวจประเมินภายในองค์กร
              </p>
              <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </UserContext.Provider>
  );
}
