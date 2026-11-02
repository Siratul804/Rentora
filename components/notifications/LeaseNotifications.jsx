"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const REMINDER_DAYS = [1, 3, 7, 14, 30, 60, 90];
const EVENT_OPTIONS = [
  { key: "rentDue", label: "Rent due reminders", hasPeriod: true },
  { key: "maintenanceSubmitted", label: "Maintenance request submitted" },
  { key: "maintenanceUpdated", label: "Maintenance request updated" },
  { key: "invoiceGenerated", label: "New rent invoice" },
  { key: "invoiceSent", label: "Rent invoice sent" },
  { key: "leaseExpiry", label: "Lease expiry reminders", hasPeriod: true },
];
const EVENT_LABELS = {
  "invoice-generated": "Rent invoice",
  "invoice-sent": "Invoice sent",
  "lease-expiry": "Lease reminder",
  "rent-due": "Rent due",
  "maintenance-submitted": "Maintenance request",
  "maintenance-updated": "Maintenance update",
};
const CATEGORY_LABELS = {
  all: "All",
  rent: "Rent",
  maintenance: "Maintenance",
  lease: "Lease",
};

function getCategory(type) {
  if (type === "rent-due" || type.startsWith("invoice-")) return "rent";
  if (type.startsWith("maintenance-")) return "maintenance";
  if (type === "lease-expiry") return "lease";
  return "all";
}

function formatDate(value, includeTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" } : {}),
  }).format(date);
}

function updatePreference(events, key, update) {
  return { ...events, [key]: { ...events[key], ...update } };
}

export function LeaseNotifications({ portal }) {
  const [notifications, setNotifications] = useState([]);
  const [events, setEvents] = useState({});
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/notifications", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load notifications.");
        if (!active) return;
        setNotifications(data.notifications);
        setEvents(data.preferences.events);
        window.dispatchEvent(
          new CustomEvent("rentora:notifications-updated", {
            detail: { unreadCount: data.unreadCount },
          })
        );
        if (data.createdCount > 0) {
          setMessage(`${data.createdCount} new notification${data.createdCount === 1 ? " was" : "s were"} added.`);
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Could not load notifications.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function savePreferences(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not save your preferences.");
        return;
      }
      setEvents(data.preferences.events);
      setMessage("Your notification preferences have been saved.");
    } catch (saveError) {
      setError(saveError.message || "Could not save your preferences.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRead(notification) {
    const isRead = !notification.readAt;
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification._id, isRead }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not update notification status.");
        return;
      }
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, readAt: data.readAt || null }
            : item
        )
      );
      window.dispatchEvent(
        new CustomEvent("rentora:notifications-updated", {
          detail: { unreadCount: data.unreadCount },
        })
      );
      setMessage(`Notification marked as ${isRead ? "read" : "unread"}.`);
    } catch (readError) {
      setError(readError.message || "Could not update notification status.");
    }
  }

  const visibleNotifications = notifications.filter((notification) => {
    const matchesCategory =
      categoryFilter === "all" || getCategory(notification.type) === categoryFilter;
    return matchesCategory && (!unreadOnly || !notification.readAt);
  });
  const visibleEvents = EVENT_OPTIONS.filter(({ key }) =>
    portal === "owner"
      ? ["maintenanceSubmitted", "maintenanceUpdated", "leaseExpiry"].includes(key)
      : ["rentDue", "maintenanceUpdated", "invoiceGenerated", "invoiceSent", "leaseExpiry"].includes(key)
  );

  return (
    <DashboardShell
      portal={portal}
      title="Notifications"
      subtitle="Review recent updates and choose how you want to hear from Rentora."
    >
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}
      {message && (
        <p role="status" aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          {message}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            In-app alerts stay on. Choose the events you want and enable email or SMS when those channels are configured.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePreferences} className="space-y-5">
            {visibleEvents.map(({ key, label, hasPeriod }) => {
              const event = events[key];
              if (!event) return null;
              return (
                <fieldset key={key} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <legend className="px-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</legend>
                  <div className="flex flex-wrap gap-x-5 gap-y-3">
                    <label className="flex min-h-11 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={event.enabled}
                        onChange={(e) => setEvents((current) =>
                          updatePreference(current, key, { enabled: e.target.checked })
                        )}
                        className="h-4 w-4 accent-emerald-600"
                      />
                      Enable this event
                    </label>
                    <span className="flex min-h-11 items-center text-sm text-zinc-500 dark:text-zinc-400">
                      In-app · always on
                    </span>
                    {["email", "sms"].map((channel) => (
                      <label key={channel} className="flex min-h-11 items-center gap-2 text-sm capitalize">
                        <input
                          type="checkbox"
                          checked={event[channel]}
                          onChange={(e) => setEvents((current) =>
                            updatePreference(current, key, { [channel]: e.target.checked })
                          )}
                          className="h-4 w-4 accent-emerald-600"
                        />
                        {channel}
                      </label>
                    ))}
                  </div>
                  {hasPeriod && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Remind me this many days before</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {REMINDER_DAYS.map((day) => (
                          <label key={day} className="flex min-h-10 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm dark:border-zinc-700">
                            <input
                              type="checkbox"
                              checked={event.daysBefore?.includes(day) || false}
                              onChange={() => {
                                const daysBefore = event.daysBefore || [];
                                const nextDays = daysBefore.includes(day)
                                  ? daysBefore.filter((value) => value !== day)
                                  : [...daysBefore, day];
                                setEvents((current) =>
                                  updatePreference(current, key, { daysBefore: nextDays })
                                );
                              }}
                              className="h-4 w-4 accent-emerald-600"
                            />
                            {day} day{day === 1 ? "" : "s"}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </fieldset>
              );
            })}
            <Button type="submit" disabled={saving || !Object.keys(events).length}>
              {saving ? "Saving..." : "Save preferences"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Your latest notification events and their delivery timestamps.
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter notifications by category">
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <Button
                  key={value}
                  variant={categoryFilter === value ? "primary" : "outline"}
                  size="sm"
                  aria-pressed={categoryFilter === value}
                  onClick={() => setCategoryFilter(value)}
                >
                  {label}
                </Button>
              ))}
              <Button
                variant={unreadOnly ? "primary" : "outline"}
                size="sm"
                aria-pressed={unreadOnly}
                onClick={() => setUnreadOnly((current) => !current)}
              >
                Unread only
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p role="status" className="text-sm text-zinc-500">Loading notifications...</p>
          ) : visibleNotifications.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {unreadOnly
                ? "No unread notifications in this category."
                : categoryFilter === "all"
                  ? "No notifications yet."
                  : `No ${CATEGORY_LABELS[categoryFilter].toLowerCase()} notifications yet.`}
            </p>
          ) : (
            <ul className="space-y-3">
              {visibleNotifications.map((notification) => (
                <li
                  key={notification._id}
                  className={`rounded-xl border p-4 sm:p-5 ${
                    notification.readAt
                      ? "border-zinc-200 dark:border-zinc-800"
                      : "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium capitalize text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                          {getCategory(notification.type)}
                        </span>
                        <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {EVENT_LABELS[notification.type] || "Notification"}
                        </span>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{notification.title}</h3>
                        <span className="text-xs text-zinc-500">{notification.readAt ? "Read" : "Unread"}</span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{notification.message}</p>
                      <p className="mt-2 text-xs text-zinc-500">
                        Delivered via {(notification.deliveredChannels || ["inApp"])
                          .map((channel) => channel === "inApp" ? "in-app" : channel)
                          .join(", ")}
                      </p>
                    </div>
                    <time
                      className="shrink-0 text-xs text-zinc-500"
                      dateTime={notification.createdAt}
                    >
                      {formatDate(notification.createdAt, true)}
                    </time>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRead(notification)}
                      aria-label={`${notification.readAt ? "Mark as unread" : "Mark as read"}: ${notification.title}`}
                    >
                      Mark as {notification.readAt ? "unread" : "read"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
