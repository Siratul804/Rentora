"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const REMINDER_DAYS = [30, 15, 7];

function formatDate(value, includeTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" } : {}),
  }).format(date);
}

export function LeaseNotifications({ portal }) {
  const [notifications, setNotifications] = useState([]);
  const [daysBefore, setDaysBefore] = useState(REMINDER_DAYS);
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
        setNotifications(data.notifications.filter((notification) => notification.type === "lease-expiry"));
        setDaysBefore(data.preferences.daysBefore);
        if (data.createdCount > 0) {
          setMessage(`${data.createdCount} new lease expiry ${data.createdCount === 1 ? "reminder was" : "reminders were"} added.`);
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

  function toggleValue(values, value) {
    return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  }

  async function savePreferences(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysBefore }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not save your preferences.");
        return;
      }
      setDaysBefore(data.preferences.daysBefore);
      setMessage("Your lease reminder preferences have been saved.");
    } catch (saveError) {
      setError(saveError.message || "Could not save your preferences.");
    } finally {
      setSaving(false);
    }
  }

  async function markAsRead(notificationId) {
    setError("");
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not mark the reminder as read.");
        return;
      }
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? { ...notification, readAt: new Date().toISOString() }
            : notification
        )
      );
      window.dispatchEvent(
        new CustomEvent("rentora:notifications-updated", { detail: { unreadCount: data.unreadCount } })
      );
    } catch (readError) {
      setError(readError.message || "Could not mark the reminder as read.");
    }
  }

  const title = portal === "owner" ? "Lease expiry reminders" : "Lease reminders";

  return (
    <DashboardShell
      portal={portal}
      title={title}
      subtitle="Stay ahead of upcoming lease end dates and keep your renewal options in view."
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
          <CardTitle>Reminder preferences</CardTitle>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Choose when to be reminded. In-app reminders are always enabled.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePreferences} className="space-y-6">
            <fieldset>
              <legend className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Remind me</legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {REMINDER_DAYS.map((day) => (
                  <label
                    key={day}
                    className="flex min-h-11 items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
                  >
                    <input
                      type="checkbox"
                      checked={daysBefore.includes(day)}
                      onChange={() => setDaysBefore((current) => toggleValue(current, day))}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    {day} days before
                  </label>
                ))}
              </div>
            </fieldset>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save preferences"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lease expiry notifications ({notifications.length})</CardTitle>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Each reminder includes the lease, tenant, expiry date, and next steps.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p role="status" className="text-sm text-zinc-500">Loading reminders...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No lease expiry reminders yet.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((notification) => (
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
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{notification.title}</h3>
                        {!notification.readAt && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                            Unread
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{notification.message}</p>
                    </div>
                    <time
                      className="shrink-0 text-xs text-zinc-500"
                      dateTime={notification.createdAt}
                    >
                      {formatDate(notification.createdAt, true)}
                    </time>
                  </div>

                  <dl className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-white/70 p-3 text-sm dark:bg-zinc-900/60 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-xs text-zinc-500">Tenant</dt>
                      <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">
                        {notification.details?.tenantName || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500">Property / unit</dt>
                      <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">
                        {notification.details?.propertyName || "—"}
                        {notification.details?.unit ? ` · ${notification.details.unit}` : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500">Lease expiry</dt>
                      <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">
                        {formatDate(notification.details?.expiryDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500">Renewal options</dt>
                      <dd className="mt-0.5 text-zinc-700 dark:text-zinc-300">
                        {notification.details?.renewalOptions || "Contact the other party to discuss renewal."}
                      </dd>
                    </div>
                  </dl>

                  {!notification.readAt && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(notification._id)}
                        aria-label={`Mark reminder for ${notification.details?.tenantName || "tenant"} as read`}
                      >
                        Mark as read
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
