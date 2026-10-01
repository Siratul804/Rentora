"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";

export function Navbar({ portal = "owner", pageTitle = "" }) {
  const { user, logout } = useAuth();

  const getRoleBadge = () => {
    const role = (user?.role || portal).toLowerCase();
    if (role === "admin") return "👑 Admin";
    if (role === "owner") return "🏢 Owner";
    if (role === "tenant") return "👤 Tenant";
    return portal.toUpperCase();
  };

  return (
    <header className="h-16 border-b border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
        >
          <span>🔔</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 border-l border-zinc-200 dark:border-zinc-800">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-base">
            {user?.avatar || (user?.role === "admin" ? "👑" : user?.role === "owner" ? "🏢" : "👤")}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {user?.name || "Active User"}
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {getRoleBadge()}
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="text-xs text-zinc-500 hover:text-rose-500 ml-2 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all font-medium cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
