"use client";

import React, { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const mapMaintenanceRequest = (item) => ({
  id: item.id,
  tenant: item.tenant?.name || "Tenant not assigned",
  unit: item.unit || "N/A",
  category: item.category || "Other",
  issue: item.title || item.description || "No description",
  details: item.description || "",
  priority: item.priority || "Medium",
  status: item.status || "Pending",
  assignedTo: item.assignedTo || "Unassigned",
  requestedAt: item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : "",
  updates: (item.activityHistory || []).map((update) => ({
    message: update.details || update.action,
    at: update.createdAt || item.createdAt,
  })),
});

const STATUSES = ["Pending", "Dispatched", "In Progress", "Resolved", "Closed"];

const PRIORITY_VARIANTS = {
  High: "danger",
  Medium: "warning",
  Low: "info",
};

const STATUS_VARIANTS = {
  Pending: "warning",
  Dispatched: "info",
  Resolved: "success",
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

/* Glassmorphism styles */
const BLUR = "blur(18px) saturate(160%)";

const glassPanel = {
  background: "rgba(24, 24, 27, 0.72)",
  backdropFilter: BLUR,
  WebkitBackdropFilter: BLUR,
  border: "1px solid rgba(255, 255, 255, 0.10)",
  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.24)",
};

const glassField = {
  background: "rgba(24, 24, 27, 0.92)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 255, 255, 0.14)",
  color: "#f4f4f5",
};

const glassSelect =
  "w-full min-w-[9rem] rounded-xl px-3 py-2 text-sm " +
  "transition focus:border-emerald-500 focus:outline-none " +
  "focus:ring-2 focus:ring-emerald-500/40";

const optionStyle = {
  backgroundColor: "#18181b",
  color: "#f4f4f5",
};

const glowStyle = (size, color) => ({
  position: "absolute",
  width: size,
  height: size,
  borderRadius: "9999px",
  background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 70%)`,
  filter: "blur(8px)",
  pointerEvents: "none",
  zIndex: -1,
});

export default function MaintenancePage() {
  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const providerOptions = [
    "Unassigned",
    ...new Set(tickets.map((ticket) => ticket.assignedTo).filter((provider) => provider && provider !== "Unassigned")),
  ];

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/owner/maintenance", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load maintenance requests.");
      setTickets((data.requests || []).map(mapMaintenanceRequest));
    } catch (loadError) {
      setError(loadError.message || "Failed to load maintenance requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Close modal with Escape.
  useEffect(() => {
    if (!activeTicketId) return;

    const onKey = (e) => e.key === "Escape" && setActiveTicketId(null);

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [activeTicketId]);

  const updateTicket = async (id, patch) => {
    setError("");
    try {
      const response = await fetch("/api/owner/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update maintenance request.");
      await loadTickets();
    } catch (updateError) {
      setError(updateError.message || "Failed to update maintenance request.");
    }
  };

  const handleAssign = (ticket, provider) => {
    if (provider === ticket.assignedTo) return;

    const nextStatus =
      provider !== "Unassigned" && ticket.status === "Pending"
        ? "Dispatched"
        : ticket.status;

    updateTicket(ticket.id, { assignedTo: provider, status: nextStatus });
  };

  const handleStatus = (ticket, status) => {
    if (status === ticket.status) return;

    updateTicket(ticket.id, { status });
  };

  const activeTicket = tickets.find((t) => t.id === activeTicketId) || null;

  const counts = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === "Pending").length,
    dispatched: tickets.filter((t) => t.status === "Dispatched").length,
    resolved: tickets.filter((t) => t.status === "Resolved").length,
  };

  return (
    <DashboardShell>
      <div
        className="relative isolate min-h-full overflow-hidden bg-zinc-950 px-3 py-5 text-zinc-100 sm:px-6 sm:py-7 lg:px-8"
      >
        {/* Decorative accent glows */}
        <div
          aria-hidden="true"
          style={{
            ...glowStyle("28rem", "rgba(16,185,129,0.10)"),
            top: "-7rem",
            right: "-7rem",
          }}
        />

        <div
          aria-hidden="true"
          style={{
            ...glowStyle("24rem", "rgba(20,184,166,0.08)"),
            bottom: "-8rem",
            left: "-6rem",
          }}
        />

        <div className="relative z-10 mb-6 sm:mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Owner Portal
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            Maintenance requests
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            {counts.total} requests: {counts.pending} pending,{" "}
            {counts.dispatched} dispatched, {counts.resolved} resolved.
          </p>
        </div>

        {/* Summary cards */}
        <section className="relative z-10 mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Requests",
              value: counts.total,
              color: "#f4f4f5",
              glow: "rgba(16,185,129,0.10)",
            },
            {
              label: "Pending Requests",
              value: counts.pending,
              color: "#fbbf24",
              glow: "rgba(245,158,11,0.08)",
            },
            {
              label: "Dispatched",
              value: counts.dispatched,
              color: "#60a5fa",
              glow: "rgba(59,130,246,0.08)",
            },
            {
              label: "Resolved Requests",
              value: counts.resolved,
              color: "#34d399",
              glow: "rgba(16,185,129,0.08)",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="relative overflow-hidden rounded-2xl p-5 transition duration-200 hover:-translate-y-1 sm:p-6"
              style={{
                ...glassPanel,
                background: `linear-gradient(135deg, rgba(24,24,27,0.92), ${item.glow})`,
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.24)",
              }}
            >
              <p className="text-sm font-medium text-zinc-400">
                {item.label}
              </p>

              <p
                className="mt-3 text-3xl font-bold tabular-nums"
                style={{ color: item.color }}
              >
                {item.value}
              </p>

              <div
                aria-hidden="true"
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full"
                style={{
                  background: item.glow,
                  filter: "blur(15px)",
                }}
              />
            </div>
          ))}
        </section>

        {/* Maintenance table glass panel */}
        <section
          className="relative z-10 overflow-hidden rounded-2xl"
          style={{
            ...glassPanel,
            background: "rgba(24,24,27,0.78)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.24)",
          }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-zinc-700/70 px-4 py-4 sm:px-6 sm:py-5">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">
                All tickets
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                Assign technicians and manage request status.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadTickets} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </Button>
          </div>

          {/* Responsive table wrapper */}
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="bg-zinc-800/70 text-xs uppercase tracking-wide text-zinc-400">
                  {[
                    "Ticket",
                    "Tenant",
                    "Issue",
                    "Priority",
                    "Requested",
                    "Technician",
                    "Status",
                    "",
                  ].map((heading, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="border-b border-zinc-700/70 px-4 py-4 font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-400">Loading maintenance requests…</td></tr>
                ) : error ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-rose-400">{error}</td></tr>
                ) : tickets.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-400">No maintenance requests yet.</td></tr>
                ) : tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="align-top transition-colors hover:bg-white/5"
                  >
                    <td className="border-b border-zinc-800 px-4 py-4 font-semibold text-zinc-200">
                      <span className="whitespace-nowrap font-mono text-xs">
                        {ticket.id}
                      </span>

                      <div className="mt-2">
                        <Badge
                          variant="info"
                        >
                          {ticket.category}
                        </Badge>
                      </div>
                    </td>

                    <td className="border-b border-zinc-800 px-4 py-4 text-zinc-300">
                      <div className="min-w-[110px] font-semibold">
                        {ticket.tenant}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        {ticket.unit}
                      </div>
                    </td>

                    <td className="max-w-[18rem] border-b border-zinc-800 px-4 py-4 text-zinc-400">
                      <p className="min-w-[150px] leading-6">
                        {ticket.issue}
                      </p>
                      {ticket.details && <p className="mt-1 min-w-[150px] text-xs leading-5 text-zinc-500">{ticket.details}</p>}
                    </td>

                    <td className="border-b border-zinc-800 px-4 py-4">
                      <Badge
                        variant={PRIORITY_VARIANTS[ticket.priority] || "info"}
                      >
                        {ticket.priority}
                      </Badge>
                    </td>

                    <td className="whitespace-nowrap border-b border-zinc-800 px-4 py-4 text-xs text-zinc-500">
                      {formatDate(ticket.requestedAt)}
                    </td>

                    <td className="border-b border-zinc-800 px-4 py-4">
                      <select
                        aria-label={`Technician for ${ticket.id}`}
                        className={glassSelect}
                        style={glassField}
                        value={ticket.assignedTo}
                        onChange={(e) => handleAssign(ticket, e.target.value)}
                      >
                        {providerOptions.map((provider) => (
                          <option
                            key={provider}
                            value={provider}
                            style={optionStyle}
                          >
                            {provider}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="border-b border-zinc-800 px-4 py-4">
                      <div className="mb-3">
                        <Badge
                          variant={STATUS_VARIANTS[ticket.status] || "info"}
                        >
                          {ticket.status}
                        </Badge>
                      </div>

                      <select
                        aria-label={`Status for ${ticket.id}`}
                        className={glassSelect}
                        style={glassField}
                        value={ticket.status}
                        onChange={(e) => handleStatus(ticket, e.target.value)}
                      >
                        {STATUSES.map((status) => (
                          <option
                            key={status}
                            value={status}
                            style={optionStyle}
                          >
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="border-b border-zinc-800 px-4 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTicketId(ticket.id)}
                      >
                        Activity
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile scroll hint */}
          <div className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500 sm:hidden">
            Swipe left or right to view all ticket details.
          </div>
        </section>
      </div>

      {/* Glass-effect activity modal */}
      {activeTicket &&
        createPortal(
          <div
            className="flex items-end justify-center p-3 sm:items-center sm:p-6"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(9,9,11,0.72)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
            onClick={() => setActiveTicketId(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="activity-title"
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl p-5 sm:p-6"
              style={{
                background:
                  "linear-gradient(145deg, rgba(39,39,42,0.98), rgba(24,24,27,0.98))",
                backdropFilter: "blur(24px) saturate(160%)",
                WebkitBackdropFilter: "blur(24px) saturate(160%)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 25px 80px rgba(0,0,0,0.55)",
                color: "#f4f4f5",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  ...glowStyle("14rem", "rgba(16,185,129,0.12)"),
                  top: "-4rem",
                  right: "-4rem",
                  zIndex: 0,
                }}
              />

              <div className="relative">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Activity history
                    </p>

                    <h2
                      id="activity-title"
                      className="break-words text-lg font-bold text-zinc-100 sm:text-xl"
                    >
                      {activeTicket.id} activity
                    </h2>

                    <p className="mt-1 text-sm text-zinc-400">
                      {activeTicket.tenant}, {activeTicket.unit}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTicketId(null)}
                  >
                    Close
                  </Button>
                </div>

                <div
                  className="mb-4 rounded-xl border border-zinc-700 p-4"
                  style={{ background: "rgba(9,9,11,0.55)" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Issue description
                  </p>

                  <p className="mt-2 text-sm leading-6 text-zinc-200">
                    {activeTicket.issue}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        PRIORITY_VARIANTS[activeTicket.priority] || "info"
                      }
                    >
                      {activeTicket.priority}
                    </Badge>

                    <Badge
                      variant={
                        STATUS_VARIANTS[activeTicket.status] || "info"
                      }
                    >
                      {activeTicket.status}
                    </Badge>
                  </div>
                </div>

                {activeTicket.updates.length === 0 ? (
                  <p className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-4 text-sm leading-6 text-zinc-400">
                    No activity yet. Assign a technician to start this request.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {activeTicket.updates.map((update, index) => (
                      <li
                        key={`${update.at}-${index}`}
                        className="rounded-xl p-4"
                        style={{
                          background: "rgba(9,9,11,0.55)",
                          border: "1px solid rgba(255,255,255,0.10)",
                        }}
                      >
                        <div className="break-words text-sm leading-6 text-zinc-200">
                          {update.message}
                        </div>

                        <div className="mt-2 text-xs text-zinc-500">
                          {formatDate(update.at)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </DashboardShell>
  );
}