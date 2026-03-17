"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle, Users } from "lucide-react";

const navigationItems = [
  {
    href: "/clients",
    label: "Clients",
    description: "Manage every tenant and chatbot",
    icon: Users,
  },
  {
    href: "/clients/new",
    label: "New Client",
    description: "Launch a new chatbot workspace",
    icon: PlusCircle,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navigationItems.map((item) => {
        const isActive =
          item.href === "/clients"
            ? pathname === "/clients" ||
              (pathname.startsWith("/clients/") &&
                !pathname.startsWith("/clients/new"))
            : pathname === item.href;

        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-start gap-3 rounded-2xl border px-4 py-3 transition ${
              isActive
                ? "border-stone-900 bg-stone-900 text-white shadow-lg shadow-stone-900/10"
                : "border-transparent bg-stone-50 text-stone-700 hover:border-stone-200 hover:bg-white"
            }`}
          >
            <span
              className={`mt-0.5 rounded-xl p-2 ${
                isActive
                  ? "bg-white/10 text-white"
                  : "bg-white text-stone-500 group-hover:text-stone-900"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="space-y-1">
              <span className="block text-sm font-semibold tracking-tight">
                {item.label}
              </span>
              <span
                className={`block text-xs ${
                  isActive ? "text-stone-300" : "text-stone-500"
                }`}
              >
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
