"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export function Navbar({ portal = "owner", pageTitle = "" }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (portal === "admin") return undefined;
    let active = true;
    let timeout;
    const handleNotificationUpdate = (event) => {
      if (typeof event.detail?.unreadCount === "number") {
        setUnreadCount(event.detail.unreadCount);
      }
    };
    window.addEventListener("rentora:notifications-updated", handleNotificationUpdate);

    fetch("/api/notifications", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load notifications.");
        if (!active) return;
        setUnreadCount(data.unreadCount || 0);
        if (data.createdCount > 0) {
          setToast(`${data.createdCount} new lease expiry ${data.createdCount === 1 ? "reminder" : "reminders"}.`);
          timeout = window.setTimeout(() => setToast(""), 6000);
        }
      })
      .catch((error) => {
        console.error("Load notification badge error:", error);
      });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      window.removeEventListener("rentora:notifications-updated", handleNotificationUpdate);
    };
  }, [pathname, portal]);

  const notificationsHref = portal === "tenant" ? "/tenant/notifications" : "/owner/notifications";

  const getRoleBadge = () => {
    const role = (user?.role || portal).toLowerCase();
    if (role === "admin") return "👑 Admin";
    if (role === "owner") return "🏢 Owner";
    if (role === "tenant") return "👤 Tenant";
    return portal.toUpperCase();
  };

  return (
    <header className="h-16 border-b border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="min-w-0 flex items-center gap-3">
        <h1 className="max-w-[22vw] truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:max-w-none sm:text-lg">
          {pageTitle}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {portal !== "admin" && (
          <Link
            href={notificationsHref}
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            className="w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
          >
            <span aria-hidden="true">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        )}

        {/* User Card */}
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 sm:gap-3">
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
      {toast && (
        <p
          role="status"
          aria-live="polite"
          className="fixed right-4 top-20 z-50 max-w-[calc(100vw-2rem)] rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-lg sm:right-6"
        >
          {toast}
        </p>
      )}
    </header>
  );
}
