"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function Navbar({ portal = "owner", pageTitle = "" }) {
  const { user, loading: authLoading, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [updatingNotificationId, setUpdatingNotificationId] = useState("");
  const notificationsButtonRef = useRef(null);
  const notificationsPanelRef = useRef(null);
  const canViewNotifications =
    !authLoading && ["owner", "tenant"].includes(user?.role || portal);

  const loadNotifications = useCallback(async () => {
    if (!canViewNotifications) return;

    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load notifications.");
      }
      if (!Array.isArray(data.notifications) || !Number.isInteger(data.unreadCount)) {
        throw new Error("The server returned invalid notification data.");
      }

      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      setNotificationsError(error.message || "Failed to load notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  }, [canViewNotifications]);

  useEffect(() => {
    if (canViewNotifications) {
      void loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setNotificationsOpen(false);
    }
  }, [canViewNotifications, loadNotifications]);

  useEffect(() => {
    if (!notificationsOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        notificationsButtonRef.current?.focus();
      }
    }

    function handlePointerDown(event) {
      if (
        !notificationsPanelRef.current?.contains(event.target) &&
        !notificationsButtonRef.current?.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [notificationsOpen]);

  async function toggleRead(notification) {
    const read = !notification.readAt;
    setNotificationsError("");
    setUpdatingNotificationId(notification._id);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification._id, read }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update notification.");
      }
      if (
        data.notification?._id !== notification._id ||
        (data.notification.readAt !== null && typeof data.notification.readAt !== "string")
      ) {
        throw new Error("The server returned invalid notification data.");
      }

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, readAt: data.notification.readAt }
            : item
        )
      );
      const wasUnread = !notification.readAt;
      const isUnread = !data.notification.readAt;
      setUnreadCount((current) => Math.max(0, current + Number(isUnread) - Number(wasUnread)));
    } catch (error) {
      setNotificationsError(error.message || "Failed to update notification.");
    } finally {
      setUpdatingNotificationId("");
    }
  }

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
        {canViewNotifications && (
          <div className="relative">
            <button
              ref={notificationsButtonRef}
              type="button"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              aria-expanded={notificationsOpen}
              aria-controls="notification-center"
              onClick={() => {
                const opening = !notificationsOpen;
                setNotificationsOpen(opening);
                if (opening) void loadNotifications();
              }}
              className="w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-[#f1f3e7] dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d8b2e] transition-colors relative"
            >
              <span aria-hidden="true">🔔</span>
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-[#7d8b2e] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-zinc-950"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <section
                id="notification-center"
                ref={notificationsPanelRef}
                aria-labelledby="notification-center-title"
                aria-busy={notificationsLoading}
                className="fixed top-16 left-2 right-2 z-50 max-h-[min(75vh,36rem)] overflow-hidden rounded-2xl border border-[#7d8b2e]/25 bg-white shadow-xl shadow-zinc-900/15 dark:border-zinc-700 dark:bg-zinc-900 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[min(24rem,calc(100vw-2rem))]"
              >
                <div className="flex items-center justify-between border-b border-[#7d8b2e]/15 px-4 py-3">
                  <div>
                    <h2
                      id="notification-center-title"
                      className="font-semibold text-zinc-900 dark:text-zinc-100"
                    >
                      Notifications
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400" aria-live="polite">
                      {unreadCount} unread
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close notifications"
                    onClick={() => {
                      setNotificationsOpen(false);
                      notificationsButtonRef.current?.focus();
                    }}
                    className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-[#f1f3e7] hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d8b2e] dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>

                <div className="max-h-[calc(min(75vh,36rem)_-_4rem)] overflow-y-auto overscroll-contain">
                  {notificationsLoading && notifications.length === 0 ? (
                    <p role="status" className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      Loading notifications…
                    </p>
                  ) : notificationsError ? (
                    <div className="space-y-3 px-4 py-6 text-center">
                      <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
                        {notificationsError}
                      </p>
                      <button
                        type="button"
                        onClick={() => void loadNotifications()}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-[#68762a] hover:bg-[#f1f3e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d8b2e] dark:text-[#c0cc75] dark:hover:bg-zinc-800"
                      >
                        Try again
                      </button>
                    </div>
                  ) : notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      You don’t have any notifications yet.
                    </p>
                  ) : (
                    <ul aria-label="Notification list" className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {notifications.map((notification) => {
                        const timestamp = new Date(notification.createdAt);
                        const validTimestamp = !Number.isNaN(timestamp.getTime());

                        return (
                          <li
                            key={notification._id}
                            className={`px-4 py-3 ${
                              notification.readAt
                                ? ""
                                : "bg-[#f5f6ee] dark:bg-[#7d8b2e]/10"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                aria-hidden="true"
                                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                  notification.readAt ? "bg-zinc-300 dark:bg-zinc-600" : "bg-[#7d8b2e]"
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                  {notification.title}
                                </h3>
                                <p className="mt-1 break-words text-sm text-zinc-600 dark:text-zinc-300">
                                  {notification.message}
                                </p>
                                {validTimestamp && (
                                  <time
                                    dateTime={timestamp.toISOString()}
                                    className="mt-2 block text-xs text-zinc-500 dark:text-zinc-400"
                                  >
                                    {timestamp.toLocaleString()}
                                  </time>
                                )}
                                <button
                                  type="button"
                                  onClick={() => void toggleRead(notification)}
                                  disabled={updatingNotificationId === notification._id}
                                  className="mt-2 rounded-md text-xs font-medium text-[#68762a] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7d8b2e] disabled:cursor-wait disabled:opacity-60 dark:text-[#c0cc75]"
                                >
                                  {updatingNotificationId === notification._id
                                    ? "Updating…"
                                    : `Mark as ${notification.readAt ? "unread" : "read"}`}
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

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
