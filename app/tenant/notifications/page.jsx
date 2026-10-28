"use client";

import React, { useState, useMemo } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";


const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-01",
    type: "rent",
    title: "Rent Due Reminder - November 2026",
    message: "Monthly rent of ৳30,000 for Green Horizon Residency (Unit 4B) is due in 3 days. Please complete payment before Nov 5th to avoid late fees.",
    timestamp: "20 minutes ago",
    createdAt: "2026-10-29T03:30:00Z",
    isRead: false,
    priority: "amber",
    auditLogs: [
      { action: "DELIVERED", actor: "Rentora Billing Engine", time: "Oct 29, 2026, 03:30 AM", status: "Success" },
    ],
  },
  {
    id: "notif-02",
    type: "maintenance",
    title: "Technician Dispatched for Ticket #MNT-2026-0042",
    message: "Your plumbing repair request for 'Kitchen sink pipe leak' has been assigned to Kamal Plumbing Co. Arrival window: Today at 3:30 PM.",
    timestamp: "2 hours ago",
    createdAt: "2026-10-29T01:50:00Z",
    isRead: false,
    priority: "emerald",
    auditLogs: [
      { action: "DELIVERED", actor: "Maintenance Dispatch Service", time: "Oct 29, 2026, 01:50 AM", status: "Success" },
    ],
  },
  {
    id: "notif-03",
    type: "lease",
    title: "Lease Agreement Renewal Notice",
    message: "Your rental agreement for Unit 4B will expire in 45 days (Dec 10, 2026). Please review the extension terms or notify your property owner.",
    timestamp: "1 day ago",
    createdAt: "2026-10-28T10:00:00Z",
    isRead: true,
    priority: "coral",
    auditLogs: [
      { action: "DELIVERED", actor: "Lease Management Service", time: "Oct 28, 2026, 10:00 AM", status: "Success" },
      { action: "READ", actor: "Current User", time: "Oct 28, 2026, 02:15 PM", status: "Completed" },
    ],
  },
  {
    id: "notif-04",
    type: "rent",
    title: "Rent Payment Received & Verified #REC-2026-902",
    message: "Your previous rent payment of ৳30,000 for October has been credited and verified by the property owner. Receipt is ready for download.",
    timestamp: "3 days ago",
    createdAt: "2026-10-26T09:30:00Z",
    isRead: true,
    priority: "amber",
    auditLogs: [
      { action: "DELIVERED", actor: "SSLCommerz Webhook Gateway", time: "Oct 26, 2026, 09:30 AM", status: "Success" },
      { action: "READ", actor: "Current User", time: "Oct 26, 2026, 10:05 AM", status: "Completed" },
    ],
  },
  {
    id: "notif-05",
    type: "maintenance",
    title: "Maintenance Ticket #MNT-2026-0021 Resolved",
    message: "Master bedroom AC compressor repair has been marked as resolved by the technician. Please rate the service quality in your portal.",
    timestamp: "1 week ago",
    createdAt: "2026-10-22T14:20:00Z",
    isRead: true,
    priority: "emerald",
    auditLogs: [
      { action: "DELIVERED", actor: "Maintenance Dispatch Service", time: "Oct 22, 2026, 02:20 PM", status: "Success" },
      { action: "READ", actor: "Current User", time: "Oct 22, 2026, 04:00 PM", status: "Completed" },
    ],
  },
];

const CATEGORIES = [
  { key: "all", label: "All Alerts", icon: "🔔" },
  { key: "rent", label: "Rent Due", icon: "💰" },
  { key: "maintenance", label: "Maintenance", icon: "🔧" },
  { key: "lease", label: "Lease Expiry", icon: "📄" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeCategory, setActiveCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "unread", "read"
  const [searchQuery, setSearchQuery] = useState("");

  // Toast State
  const [toast, setToast] = useState(null);

  // Audit Modal State
  const [selectedAuditNotif, setSelectedAuditNotif] = useState(null);

  // Trigger Toast Alert Helper
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Mark single alert as read
  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) => {
        if (item.id === id && !item.isRead) {
          const nowFormatted = new Date().toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          const updatedLogs = [
            ...(item.auditLogs || []),
            { action: "READ", actor: "Current User", time: nowFormatted, status: "Completed" },
          ];
          return { ...item, isRead: true, auditLogs: updatedLogs };
        }
        return item;
      })
    );
    showToast("Notification marked as read.");
  };

  // Mark all as read
  const handleMarkAllAsRead = () => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    if (unreadCount === 0) {
      showToast("All notifications are already read.", "info");
      return;
    }

    const nowFormatted = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    setNotifications((prev) =>
      prev.map((item) => {
        if (!item.isRead) {
          return {
            ...item,
            isRead: true,
            auditLogs: [
              ...(item.auditLogs || []),
              { action: "READ_ALL", actor: "Current User", time: nowFormatted, status: "Completed" },
            ],
          };
        }
        return item;
      })
    );

    showToast(`Marked ${unreadCount} notification(s) as read.`);
  };

  // Delete single notification
  const handleDeleteNotification = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    showToast("Notification removed from your feed.");
  };

  // Category & Unread Counts
  const counts = useMemo(() => {
    const totalUnread = notifications.filter((n) => !n.isRead).length;
    const rentUnread = notifications.filter((n) => n.type === "rent" && !n.isRead).length;
    const maintenanceUnread = notifications.filter((n) => n.type === "maintenance" && !n.isRead).length;
    const leaseUnread = notifications.filter((n) => n.type === "lease" && !n.isRead).length;
    return { totalUnread, rentUnread, maintenanceUnread, leaseUnread };
  }, [notifications]);

  // Filtered List
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.type === activeCategory;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "unread" && !item.isRead) ||
        (statusFilter === "read" && item.isRead);

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query);

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [notifications, activeCategory, statusFilter, searchQuery]);

  // Obsidian Glass Category Styles
  const getCategoryStyles = (type) => {
    switch (type) {
      case "rent":
        return {
          badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          icon: "💰",
          label: "Rent Due",
        };
      case "lease":
        return {
          badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
          iconBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          icon: "📄",
          label: "Lease Notice",
        };
      case "maintenance":
      default:
        return {
          badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: "🔧",
          label: "Maintenance",
        };
    }
  };

  return (
    <div className="relative min-h-screen bg-[#090a0f] text-zinc-100 selection:bg-emerald-500 selection:text-black">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 right-10 w-[450px] h-[450px] bg-amber-500/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 left-12 w-[600px] h-[600px] bg-purple-500/6 rounded-full blur-[180px]" />
      </div>

      {/* Floating Toast Alert Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-300">
          <div className="px-4 py-3 rounded-2xl bg-zinc-900/90 text-white backdrop-blur-2xl border border-white/20 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-center gap-3 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-zinc-400 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <DashboardShell
        portal="tenant"
        title="Notification Center"
        subtitle="Stay updated on rent due dates, maintenance dispatch status, and lease reminders"
        actions={
          <button
            onClick={handleMarkAllAsRead}
            disabled={counts.totalUnread === 0}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-2xl border transition-all ${
              counts.totalUnread > 0
                ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98]"
                : "bg-white/5 text-zinc-500 border-white/10 cursor-not-allowed"
            }`}
          >
            <span>✓</span> Mark All as Read ({counts.totalUnread})
          </button>
        }
      >
        {/* Metric Summary Cards (Clean Card Layout) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-5 rounded-3xl bg-zinc-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
            <span className="text-xs font-medium text-zinc-400">Unread Alerts</span>
            <div className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
              {counts.totalUnread}
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Requires attention</span>
          </div>

          <div className="p-5 rounded-3xl bg-zinc-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
            <span className="text-xs font-medium text-amber-400">Rent Due</span>
            <div className="text-3xl font-extrabold text-amber-400 mt-1.5 tracking-tight">
              {counts.rentUnread}
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Payment reminders</span>
          </div>

          <div className="p-5 rounded-3xl bg-zinc-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
            <span className="text-xs font-medium text-emerald-400">Maintenance</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1.5 tracking-tight">
              {counts.maintenanceUnread}
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Repair & dispatch</span>
          </div>

          <div className="p-5 rounded-3xl bg-zinc-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
            <span className="text-xs font-medium text-rose-400">Lease Notices</span>
            <div className="text-3xl font-extrabold text-rose-400 mt-1.5 tracking-tight">
              {counts.leaseUnread}
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Contracts & expiry</span>
          </div>
        </div>

        {/* Main Obsidian Black Glass Card Container */}
        <div className="rounded-3xl bg-zinc-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Header Controls */}
          <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 text-xs">
              {CATEGORIES.map((cat) => {
                const unreadForCategory =
                  cat.key === "all"
                    ? counts.totalUnread
                    : counts[`${cat.key}Unread`] || 0;

                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                      activeCategory === cat.key
                        ? "bg-white/15 text-white shadow-lg border border-white/20"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    {unreadForCategory > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-500 text-black font-bold">
                        {unreadForCategory}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Read Status Switcher & Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-2xl bg-black/50 p-1 text-xs border border-white/10">
                {["all", "unread", "read"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-xl capitalize transition-all ${
                      statusFilter === status
                        ? "bg-white/15 font-semibold text-white shadow-sm border border-white/10"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="relative w-56">
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl text-xs bg-black/40 border border-white/10 text-white placeholder-zinc-500 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Notifications Feed */}
          <div className="p-5 sm:p-6 space-y-3.5">
            {filteredNotifications.length === 0 ? (
              <div className="py-16 text-center text-zinc-500">
                <div className="text-3xl mb-2">🔔</div>
                <h4 className="text-sm font-semibold text-zinc-300">No notifications found</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  You are all caught up! No alerts match your current filter.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const styles = getCategoryStyles(item.type);

                return (
                  <div
                    key={item.id}
                    className={`group relative p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                      !item.isRead
                        ? "bg-black/40 hover:bg-black/60 border-white/15 shadow-lg shadow-black/40"
                        : "bg-black/20 hover:bg-black/30 border-white/5 opacity-75 hover:opacity-100"
                    }`}
                  >
                    {/* Glowing Unread Indicator Dot */}
                    {!item.isRead && (
                      <span className="absolute top-4 right-4 sm:top-5 sm:right-5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      </span>
                    )}

                    <div className="flex items-start gap-3.5">
                      {/* Icon Avatar */}
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 border backdrop-blur-md ${styles.iconBg}`}
                      >
                        {styles.icon}
                      </div>

                      {/* Content Body */}
                      <div className="space-y-1 pr-6 sm:pr-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles.badge}`}
                          >
                            {styles.label}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {item.timestamp}
                          </span>
                          {!item.isRead && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              New
                            </span>
                          )}
                        </div>

                        <h4
                          className={`text-sm ${
                            !item.isRead
                              ? "font-bold text-white group-hover:text-emerald-400 transition-colors"
                              : "font-semibold text-zinc-300"
                          }`}
                        >
                          {item.title}
                        </h4>

                        <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                          {item.message}
                        </p>

                        {/* Audit Log Trigger Link (Acceptance Criteria #11) */}
                        <div className="pt-1.5">
                          <button
                            onClick={() => setSelectedAuditNotif(item)}
                            className="text-[11px] text-zinc-400 hover:text-emerald-400 underline decoration-dotted transition-colors"
                          >
                            View delivery audit log
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 flex-shrink-0">
                      {!item.isRead ? (
                        <button
                          onClick={() => handleMarkAsRead(item.id)}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                        >
                          Mark as Read
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                          ✓ Read
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteNotification(item.id)}
                        className="text-xs text-zinc-400 hover:text-rose-400 p-1 transition-colors"
                        title="Dismiss notification"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DashboardShell>

      {/* ============================================================== */}
      {/* AUDIT LOG MODAL (Obsidian Black Glass)                          */}
      {/* ============================================================== */}
      {selectedAuditNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#0f1117]/95 border border-white/15 rounded-3xl w-full max-w-md shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-6 backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">Delivery Audit Trail</h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  ID: #{selectedAuditNotif.id} • Type: {selectedAuditNotif.type}
                </p>
              </div>
              <button
                onClick={() => setSelectedAuditNotif(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Target Notification
                </span>
                <p className="text-xs font-semibold text-zinc-200 mt-1">
                  {selectedAuditNotif.title}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-3">
                  Lifecycle Event Log
                </span>
                <div className="space-y-3">
                  {(selectedAuditNotif.auditLogs || []).map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-white">
                          {log.action} —{" "}
                          <span className="text-emerald-400 font-normal">{log.status}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Triggered by {log.actor} • {log.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10 mt-5">
              <button
                onClick={() => setSelectedAuditNotif(null)}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-white/10 text-zinc-300 hover:bg-white/20 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}