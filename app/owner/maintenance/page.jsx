"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const INITIAL_TICKETS = [
  {
    id: "TKT-401",
    tenant: "Farhan Ahmed",
    unit: "Unit 4B",
    category: "Plumbing",
    issue: "Master bathroom faucet leaking and low shower pressure",
    priority: "Medium",
    status: "Dispatched",
    assignedTo: "Kamal Plumbing Co.",
    requestedAt: "2026-09-28",
    updates: [
      {
        message: "Technician assigned: Kamal Plumbing Co.",
        at: "2026-09-28",
      },
    ],
  },
  {
    id: "TKT-402",
    tenant: "Nabila Tabassum",
    unit: "Unit 2A",
    category: "HVAC",
    issue: "Living room AC making humming noise and blowing warm air",
    priority: "High",
    status: "Pending",
    assignedTo: "Unassigned",
    requestedAt: "2026-09-29",
    updates: [],
  },
  {
    id: "TKT-403",
    tenant: "Sabbir Hossain",
    unit: "Apt 7C",
    category: "Electrical",
    issue: "Kitchen power socket shorted during microwave use",
    priority: "High",
    status: "Resolved",
    assignedTo: "VoltMasters BD",
    requestedAt: "2026-09-24",
    updates: [
      {
        message: "Maintenance request resolved.",
        at: "2026-09-24",
      },
    ],
  },
];

const mapMaintenanceRequest = (item) => ({
  id: item.id,
  tenant: item.tenant?.name || "Tenant not assigned",
  unit: item.unit || "N/A",
  category: item.category || "Other",
  issue: item.description || item.title || "No description",
  priority: item.priority || "Medium",
  status: item.status || "Pending",
  assignedTo: item.assignedTo || "Unassigned",
  requestedAt: item.createdAt ? item.createdAt.slice(0, 10) : "",
  updates: (item.activityHistory || []).map((update) => ({
    message: update.details || update.action,
    at: update.createdAt || item.createdAt,
  })),
});

const PROVIDERS = [
  "Unassigned",
  "Kamal Plumbing Co.",
  "VoltMasters BD",
  "CoolAir Services",
  "FixIt Maintenance",
];

const STATUSES = ["Pending", "Dispatched", "Resolved"];

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
  background: "rgba(255, 255, 255, 0.10)",
  backdropFilter: BLUR,
  WebkitBackdropFilter: BLUR,
  border: "1px solid rgba(255, 255, 255, 0.28)",
  boxShadow:
    "0 12px 40px rgba(34, 45, 12, 0.14), inset 0 1px 0 rgba(255,255,255,0.35)",
};

const glassField = {
  background: "rgba(255, 255, 255, 0.78)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(111, 125, 48, 0.25)",
  color: "#30351f",
};

const glassSelect =
  "w-full min-w-[9rem] rounded-xl px-3 py-2 text-sm " +
  "transition focus:border-[#7d8b2e] focus:outline-none " +
  "focus:ring-2 focus:ring-[#9aa63a]/40";

const optionStyle = {
  backgroundColor: "#ffffff",
  color: "#30351f",
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
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [activeTicketId, setActiveTicketId] = useState(null);

  // Load real data if the API exists; otherwise keep the demo tickets.
  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
      try {
        const res = await fetch("/api/maintenance-requests");
        if (!res.ok) return;

        const data = await res.json();
        const list = Array.isArray(data) ? data : data.requests;

        if (!cancelled && Array.isArray(list) && list.length > 0) {
          setTickets(list.map(mapMaintenanceRequest));
        }
      } catch {
        // Keep INITIAL_TICKETS when the request fails.
      }
    }

    loadTickets();

    return () => {
      cancelled = true;
    };
  }, []);

  // Close modal with Escape.
  useEffect(() => {
    if (!activeTicketId) return;

    const onKey = (e) => e.key === "Escape" && setActiveTicketId(null);

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [activeTicketId]);

  const today = new Date().toISOString().slice(0, 10);

  const updateTicket = (id, patch, message) => {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === id
          ? {
              ...ticket,
              ...patch,
              updates: [...ticket.updates, { message, at: today }],
            }
          : ticket
      )
    );
  };

  const handleAssign = (ticket, provider) => {
    if (provider === ticket.assignedTo) return;

    const nextStatus =
      provider !== "Unassigned" && ticket.status === "Pending"
        ? "Dispatched"
        : ticket.status;

    updateTicket(
      ticket.id,
      { assignedTo: provider, status: nextStatus },
      provider === "Unassigned"
        ? "Technician removed."
        : `Technician assigned: ${provider}`
    );
  };

  const handleStatus = (ticket, status) => {
    if (status === ticket.status) return;

    updateTicket(ticket.id, { status }, `Status changed to ${status}.`);
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
        className="relative isolate min-h-full overflow-hidden px-3 py-5 sm:px-6 sm:py-7 lg:px-8"
        style={{
          background:
            "linear-gradient(135deg, #f8faf2 0%, #edf1df 48%, #f6f7f0 100%)",
        }}
      >
        {/* Decorative olive-green glow */}
        <div
          aria-hidden="true"
          style={{
            ...glowStyle("28rem", "rgba(125,139,46,0.24)"),
            top: "-7rem",
            right: "-7rem",
          }}
        />

        <div
          aria-hidden="true"
          style={{
            ...glowStyle("24rem", "rgba(85,107,47,0.20)"),
            bottom: "-8rem",
            left: "-6rem",
          }}
        />

        <div className="relative z-10 mb-6 sm:mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#77832e]">
            Owner Portal
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-[#252b19] sm:text-3xl">
            Maintenance requests
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#62684f] sm:text-base">
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
              color: "#343b22",
              glow: "rgba(125,139,46,0.15)",
            },
            {
              label: "Pending Requests",
              value: counts.pending,
              color: "#a65d09",
              glow: "rgba(245,158,11,0.12)",
            },
            {
              label: "Dispatched",
              value: counts.dispatched,
              color: "#416b9b",
              glow: "rgba(59,130,246,0.10)",
            },
            {
              label: "Resolved Requests",
              value: counts.resolved,
              color: "#16815a",
              glow: "rgba(16,185,129,0.12)",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="relative overflow-hidden rounded-2xl p-5 transition duration-200 hover:-translate-y-1 sm:p-6"
              style={{
                ...glassPanel,
                background: `linear-gradient(135deg, rgba(255,255,255,0.82), ${item.glow})`,
                border: "1px solid rgba(255,255,255,0.85)",
                boxShadow:
                  "0 8px 30px rgba(54,65,27,0.09), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <p className="text-sm font-medium text-[#737766]">
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
            background: "rgba(255,255,255,0.63)",
            border: "1px solid rgba(255,255,255,0.90)",
            boxShadow:
              "0 12px 40px rgba(54,65,27,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          <div className="border-b border-[#77832e]/15 px-4 py-4 sm:px-6 sm:py-5">
            <h2 className="text-lg font-semibold text-[#2c321f] sm:text-xl">
              All tickets
            </h2>

            <p className="mt-1 text-sm text-[#737766]">
              Assign technicians and manage request status.
            </p>
          </div>

          {/* Responsive table wrapper */}
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="bg-[#7d8b2e]/[0.07] text-xs uppercase tracking-wide text-[#737766]">
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
                      className="border-b border-[#77832e]/15 px-4 py-4 font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="align-top transition-colors hover:bg-[#7d8b2e]/[0.06]"
                  >
                    <td className="border-b border-[#77832e]/10 px-4 py-4 font-semibold text-[#343b22]">
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

                    <td className="border-b border-[#77832e]/10 px-4 py-4 text-[#363b2c]">
                      <div className="min-w-[110px] font-semibold">
                        {ticket.tenant}
                      </div>

                      <div className="mt-1 text-xs text-[#737766]">
                        {ticket.unit}
                      </div>
                    </td>

                    <td className="max-w-[18rem] border-b border-[#77832e]/10 px-4 py-4 text-[#555b49]">
                      <p className="min-w-[150px] leading-6">
                        {ticket.issue}
                      </p>
                    </td>

                    <td className="border-b border-[#77832e]/10 px-4 py-4">
                      <Badge
                        variant={PRIORITY_VARIANTS[ticket.priority] || "info"}
                      >
                        {ticket.priority}
                      </Badge>
                    </td>

                    <td className="whitespace-nowrap border-b border-[#77832e]/10 px-4 py-4 text-xs text-[#737766]">
                      {formatDate(ticket.requestedAt)}
                    </td>

                    <td className="border-b border-[#77832e]/10 px-4 py-4">
                      <select
                        aria-label={`Technician for ${ticket.id}`}
                        className={glassSelect}
                        style={glassField}
                        value={ticket.assignedTo}
                        onChange={(e) => handleAssign(ticket, e.target.value)}
                      >
                        {PROVIDERS.map((provider) => (
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

                    <td className="border-b border-[#77832e]/10 px-4 py-4">
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

                    <td className="border-b border-[#77832e]/10 px-4 py-4">
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
          <div className="border-t border-[#77832e]/10 px-4 py-3 text-xs text-[#737766] sm:hidden">
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
              background: "rgba(24,30,13,0.48)",
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
                  "linear-gradient(145deg, rgba(255,255,255,0.93), rgba(239,243,224,0.88))",
                backdropFilter: "blur(24px) saturate(160%)",
                WebkitBackdropFilter: "blur(24px) saturate(160%)",
                border: "1px solid rgba(255,255,255,0.85)",
                boxShadow:
                  "0 25px 80px rgba(20,30,8,0.25), inset 0 1px 0 rgba(255,255,255,0.9)",
                color: "#30351f",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  ...glowStyle("14rem", "rgba(125,139,46,0.20)"),
                  top: "-4rem",
                  right: "-4rem",
                  zIndex: 0,
                }}
              />

              <div className="relative">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#77832e]">
                      Activity history
                    </p>

                    <h2
                      id="activity-title"
                      className="break-words text-lg font-bold text-[#30351f] sm:text-xl"
                    >
                      {activeTicket.id} activity
                    </h2>

                    <p className="mt-1 text-sm text-[#737766]">
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
                  className="mb-4 rounded-xl border border-[#77832e]/15 p-4"
                  style={{ background: "rgba(255,255,255,0.52)" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#737766]">
                    Issue description
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#363b2c]">
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
                  <p className="rounded-xl border border-[#77832e]/15 bg-white/45 p-4 text-sm leading-6 text-[#737766]">
                    No activity yet. Assign a technician to start this request.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {activeTicket.updates.map((update, index) => (
                      <li
                        key={`${update.at}-${index}`}
                        className="rounded-xl p-4"
                        style={{
                          background: "rgba(255,255,255,0.58)",
                          border: "1px solid rgba(125,139,46,0.16)",
                          boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,0.8)",
                        }}
                      >
                        <div className="break-words text-sm leading-6 text-[#363b2c]">
                          {update.message}
                        </div>

                        <div className="mt-2 text-xs text-[#737766]">
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