"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Crown,
  LayoutDashboard,
  Menu,
  PlusCircle,
  Settings,
  Users,
  X,
} from "lucide-react";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { Logo } from "@/components/ui/logo";

type DashboardChromeProps = {
  userEmail: string;
  isAdmin: boolean;
  hasActiveSubscription?: boolean;
  children: React.ReactNode;
};

const navigationItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Platform health and activity",
  },
  {
    href: "/clients",
    label: "Clients",
    icon: Users,
    description: "Manage tenants and knowledge bases",
  },
  {
    href: "/clients/new",
    label: "New Client",
    icon: PlusCircle,
    description: "Launch a new chatbot workspace",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    description: "Account & security settings",
  },
];

export function DashboardChrome({
  userEmail,
  isAdmin,
  hasActiveSubscription = false,
  children,
}: DashboardChromeProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pageTitle = useMemo(() => {
    if (pathname === "/dashboard") {
      return "Overview";
    }
    if (pathname === "/clients") {
      return "Clients";
    }
    if (pathname === "/clients/new") {
      return "New Client";
    }
    if (pathname.endsWith("/documents")) {
      return "Documents";
    }
    if (pathname.endsWith("/analytics")) {
      return "Analytics";
    }
    if (pathname.startsWith("/clients/")) {
      return "Client Details";
    }
    if (pathname === "/settings") {
      return "Settings";
    }
    return "Dashboard";
  }, [pathname]);

  const breadcrumbs = useMemo(() => {
    const items = [{ label: "Dashboard", href: "/dashboard" }];

    if (pathname === "/dashboard") {
      return items;
    }

    if (pathname === "/settings") {
      items.push({ label: "Settings", href: "/settings" });
      return items;
    }

    if (pathname.startsWith("/clients")) {
      items.push({ label: "Clients", href: "/clients" });
    }

    if (pathname === "/clients/new") {
      items.push({ label: "New Client", href: "/clients/new" });
      return items;
    }

    if (pathname.startsWith("/clients/") && pathname !== "/clients") {
      items.push({ label: "Workspace", href: pathname.split("/").slice(0, 3).join("/") });
    }

    if (pathname.endsWith("/documents")) {
      items.push({ label: "Documents", href: pathname });
    } else if (pathname.endsWith("/analytics")) {
      items.push({ label: "Analytics", href: pathname });
    }

    return items;
  }, [pathname]);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="flex min-h-screen">
        <aside className="hidden w-[252px] shrink-0 flex-col border-r border-neutral-900 bg-[#0A0A0A] text-neutral-100 lg:flex sticky top-0 h-screen overflow-y-auto">
          <SidebarContent
            pathname={pathname}
            userEmail={userEmail}
            isAdmin={isAdmin}
            onNavigate={() => undefined}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 transition hover:border-stone-300 hover:text-stone-950 lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="space-y-1">
                  <div className="flex max-w-[72vw] items-center gap-2 overflow-x-auto whitespace-nowrap text-xs font-medium uppercase tracking-[0.2em] text-stone-400 sm:max-w-none">
                    {breadcrumbs.map((crumb, index) => (
                      <span key={`${crumb.href}-${index}`} className="flex items-center gap-2">
                        {index > 0 ? <ChevronRight className="h-3 w-3" /> : null}
                        <Link
                          href={crumb.href}
                          className="transition hover:text-stone-600"
                        >
                          {crumb.label}
                        </Link>
                      </span>
                    ))}
                  </div>
                  <h1 className="text-lg font-semibold tracking-tight text-stone-950">
                    {pageTitle}
                  </h1>
                </div>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 shadow-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-xs font-semibold text-stone-900">
                    {getInitials(userEmail)}
                  </span>
                  <span className="max-w-[220px] truncate">{userEmail}</span>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                      <Crown className="h-2.5 w-2.5" />
                      Admin
                    </span>
                  )}
                </div>
                <NotificationBell />
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 sm:pb-8 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-stone-950/55"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside className="relative flex h-full w-[86vw] max-w-[320px] flex-col bg-[#0A0A0A] text-neutral-100 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <Logo size="sm" variant="icon" />
                <div>
                  <div className="text-sm font-archivo tracking-tight text-white">
                    Nexus<span className="text-[#EF4444]">Chat</span>
                  </div>
                  <div className="text-[10px] font-sora font-light uppercase tracking-widest text-[#a3a3a3]">Admin workspace</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-800 bg-stone-900 text-stone-300"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              pathname={pathname}
              userEmail={userEmail}
              isAdmin={isAdmin}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = getIsActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-medium transition ${
                  isActive
                    ? "bg-[#0A0A0A] text-white"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="mt-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function SidebarContent({
  pathname,
  userEmail,
  isAdmin,
  onNavigate,
}: {
  pathname: string;
  userEmail: string;
  isAdmin: boolean;
  onNavigate: () => void;
}) {
  return (
    <>
      <div className="border-b border-neutral-900 px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
          <Logo size="sm" variant="icon" />
          <div>
            <div className="text-sm font-archivo tracking-tight text-white">
              Nexus<span className="text-[#EF4444]">Chat</span>
            </div>
            <div className="text-[10px] font-sora font-light uppercase tracking-widest text-[#a3a3a3]">
              {isAdmin ? 'Admin' : 'Operations'} Console
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-4 py-5">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = getIsActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`group flex items-center gap-3 rounded-2xl border-l-2 px-4 py-3 transition ${
                  isActive
                    ? "border-[#EF4444] bg-white/5 text-white"
                    : "border-transparent text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    isActive
                      ? "bg-[#EF4444]/15 text-[#EF4444]"
                      : "bg-neutral-950 text-neutral-500 group-hover:text-neutral-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold tracking-tight">
                    {item.label}
                  </span>
                  <span className="block truncate text-xs text-neutral-500">
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-neutral-900 px-4 py-5">
        <div className="mb-4 rounded-2xl bg-[#171717] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
              Signed In
            </div>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-500 border border-rose-500/20">
                <Crown className="h-2 w-2" />
                Admin
              </span>
            )}
          </div>
          <div className="mt-2 truncate text-sm text-neutral-300">{userEmail}</div>
        </div>
        <LogoutButton tone="dark" />
      </div>
    </>
  );
}

function getIsActive(pathname: string, href: string) {
  if (href === "/clients") {
    return (
      pathname === "/clients" ||
      (pathname.startsWith("/clients/") && !pathname.startsWith("/clients/new"))
    );
  }

  return pathname === href;
}

function getInitials(email: string) {
  const trimmed = email.trim();
  if (!trimmed) {
    return "U";
  }

  const [localPart] = trimmed.split("@");
  return localPart.slice(0, 2).toUpperCase();
}
