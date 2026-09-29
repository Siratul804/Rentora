"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const PORTAL_NAV_ITEMS = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
    { label: "Owners", href: "/admin/owners", icon: "🏢" },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: "💳" },
    { label: "Service Providers", href: "/admin/service-providers", icon: "🛠️" },
    { label: "Reports", href: "/admin/reports", icon: "📈" },
  ],
  owner: [
    { label: "Dashboard", href: "/owner/dashboard", icon: "📊" },
    { label: "Properties", href: "/owner/properties", icon: "🏠" },
    { label: "Tenants", href: "/owner/tenants", icon: "👥" },
    { label: "Leases", href: "/owner/leases", icon: "📄" },
    { label: "Invoices", href: "/owner/invoices", icon: "🧾" },
    { label: "Payments", href: "/owner/payments", icon: "💰" },
    { label: "Maintenance", href: "/owner/maintenance", icon: "🔧" },
    { label: "Reports", href: "/owner/reports", icon: "📈" },
  ],
  tenant: [
    { label: "Dashboard", href: "/tenant/dashboard", icon: "🏠" },
    { label: "Payments", href: "/tenant/payments", icon: "💳" },
    { label: "Maintenance", href: "/tenant/maintenance", icon: "🛠️" },
    { label: "My Lease", href: "/tenant/lease", icon: "📄" },
    { label: "Profile", href: "/tenant/profile", icon: "👤" },
  ],
};

const PORTAL_META = {
  admin: {
    title: "Super Admin",
    badge: "Admin",
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    themeColor: "from-purple-600 to-indigo-600",
  },
  owner: {
    title: "Owner Portal",
    badge: "Landlord",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    themeColor: "from-emerald-600 to-teal-600",
  },
  tenant: {
    title: "Tenant Portal",
    badge: "Resident",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    themeColor: "from-blue-600 to-sky-600",
  },
};

export function Sidebar({ portal = "owner" }) {
  const pathname = usePathname();
  const navItems = PORTAL_NAV_ITEMS[portal] || [];
  const meta = PORTAL_META[portal] || PORTAL_META.owner;

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex flex-col justify-between min-h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              R
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
                Rentora
              </span>
              <span className="block text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                {meta.title}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Navigation
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Portal Switcher & Footer */}
      <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
          Switch Portal (Demo)
        </div>
        <div className="grid grid-cols-3 gap-1">
          <Link
            href="/admin/dashboard"
            className={cn(
              "text-center py-1.5 text-xs rounded-lg border font-medium transition-colors",
              portal === "admin"
                ? "bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400 font-semibold"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            )}
          >
            Admin
          </Link>
          <Link
            href="/owner/dashboard"
            className={cn(
              "text-center py-1.5 text-xs rounded-lg border font-medium transition-colors",
              portal === "owner"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            )}
          >
            Owner
          </Link>
          <Link
            href="/tenant/dashboard"
            className={cn(
              "text-center py-1.5 text-xs rounded-lg border font-medium transition-colors",
              portal === "tenant"
                ? "bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            )}
          >
            Tenant
          </Link>
        </div>
      </div>
    </aside>
  );
}
