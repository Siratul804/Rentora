"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/tables/DataTable";

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
  requestedAt: item.createdAt
    ? item.createdAt.slice(0, 10)
    : "",
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

// Fixed locale so server and client always render the same text.
// Date-only values ("2026-09-28") are shown without a time.
const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const isDateOnly = value.length === 10;
  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    ...(isDateOnly ? { timeZone: "UTC" } : { timeStyle: "short" }),
  });
};

// Returns a new ticket with one or more history entries appended.
const addUpdates = (ticket, messages) => {
  const at = new Date().toISOString();
  return {
    ...ticket,
    updates: [
      ...(ticket.updates || []),
      ...messages.map((message) => ({ message, at })),
    ],
  };
};

export default function OwnerMaintenancePage() {
const [tickets, setTickets] = useState(INITIAL_TICKETS);
const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [notice, setNotice] = useState("");

  const selectedTicket = tickets.find(
    (ticket) => ticket.id === selectedTicketId
  );

  // Close the modal with the Escape key.
  useEffect(() => {
    if (!selectedTicketId) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelectedTicketId(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedTicketId]);

  // Clear the warning message automatically.
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
useEffect(() => {
  let active = true;

  const loadMaintenanceRequests = async () => {
    try {
      const response = await fetch("/api/owner/maintenance");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load maintenance requests"
        );
      }

      if (active) {
  const requests = data.requests || [];

  setTickets(
    requests.length > 0
      ? requests.map(mapMaintenanceRequest)
      : INITIAL_TICKETS
  );
}
    } catch (error) {
      if (active) {
        setNotice(
          error.message || "Could not load maintenance requests."
        );
      }
    } finally {
      if (active) setLoading(false);
    }
  };

  loadMaintenanceRequests();

  return () => {
    active = false;
  };
}, []);

const handleAssign = async (id, provider) => {
  const ticket = tickets.find((item) => item.id === id);

  if (!ticket) return;
  if (ticket.assignedTo === provider) return;

  let nextStatus = ticket.status;
  const messages = [];

  if (provider === "Unassigned") {
    messages.push("Technician assignment removed.");

    if (ticket.status === "Dispatched") {
      nextStatus = "Pending";
      messages.push("Status updated to Pending.");
    }
  } else {
    messages.push(`Technician assigned: ${provider}`);

    if (ticket.status === "Pending") {
      nextStatus = "Dispatched";
      messages.push("Status updated to Dispatched.");
    }
  }

  setTickets((previousTickets) =>
    previousTickets.map((item) =>
      item.id === id
        ? addUpdates(
            {
              ...item,
              assignedTo: provider,
              status: nextStatus,
            },
            messages
          )
        : item
    )
  );

  setNotice(
    provider === "Unassigned"
      ? `${id}: technician assignment removed.`
      : `${id}: ${provider} assigned successfully.`
  );
};
const handleStatusChange = async (id, status) => {
  const target = tickets.find((ticket) => ticket.id === id);

  if (!target || target.status === status) return;

  if (
    (status === "Dispatched" || status === "Resolved") &&
    target.assignedTo === "Unassigned"
  ) {
    setNotice(
      `${id}: assign a technician before marking it ${status}.`
    );
    return;
  }

  const message =
    status === "Resolved"
      ? "Maintenance request resolved."
      : status === "Pending" && target.status === "Resolved"
      ? "Maintenance request reopened. Status updated to Pending."
      : `Status updated to ${status}.`;

  // Update the browser UI immediately.
  setTickets((previousTickets) =>
    previousTickets.map((ticket) =>
      ticket.id === id
        ? addUpdates({ ...ticket, status }, [message])
        : ticket
    )
  );

  setNotice("Maintenance status updated successfully.");

  // Demo tickets use IDs such as TKT-403, not MongoDB ObjectIds.
  // Skip the database request for those demo tickets.
  if (!/^[a-f\d]{24}$/i.test(id)) return;

  try {
    const response = await fetch("/api/owner/maintenance", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to save maintenance status."
      );
    }
  } catch (error) {
    setNotice(
      `Browser-এ status বদলেছে, কিন্তু database-এ save হয়নি: ${
        error.message || "Unknown error"
      }`
    );
  }
};

  const statusVariant = (status) => {
    if (status === "Resolved") return "success";
    if (status === "Dispatched") return "info";
    return "warning";
  };

  const columns = [
    {
      header: "Ticket ID & Category",
      accessor: (row) => (
        <div>
          <span className="font-mono text-xs font-semibold">
            {row.id}
          </span>
          <div className="mt-1">
            <Badge variant="purple" size="sm">
              {row.category}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      header: "Unit & Tenant",
      accessor: (row) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
            {row.unit}
          </div>
          <div className="text-xs text-zinc-500">{row.tenant}</div>
        </div>
      ),
    },
    {
      header: "Issue Description",
      accessor: (row) => (
        <div className="max-w-xs">
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            {row.issue}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Requested: {formatDateTime(row.requestedAt)}
          </p>
        </div>
      ),
    },
    {
      header: "Priority",
      accessor: (row) => (
        <Badge variant={PRIORITY_VARIANTS[row.priority] || "info"} size="sm">
          {row.priority}
        </Badge>
      ),
    },
    {
      header: "Assign Technician",
      accessor: (row) => (
        <select
          aria-label={`Assign technician for ${row.id}`}
          value={row.assignedTo}
          onChange={(event) => handleAssign(row.id, event.target.value)}
          disabled={false}
          className="w-44 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-xs text-zinc-700 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {PROVIDERS.map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Update Status",
      accessor: (row) => (
        <select
          aria-label={`Update status for ${row.id}`}
          value={row.status}
          onChange={(event) =>
            handleStatusChange(row.id, event.target.value)
          }
          className="w-32 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-xs text-zinc-700 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Current Status",
      accessor: (row) => (
        <Badge variant={statusVariant(row.status)} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Updates",
      accessor: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedTicketId(row.id)}
        >
          View Updates
        </Button>
      ),
    },
  ];

  return (
    <DashboardShell
      portal="owner"
      title="Maintenance Management"
      subtitle="Review tenant requests, assign technicians, and track maintenance progress."
    >
      <div className="space-y-6">
        {notice && (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
          >
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-zinc-500">Total Requests</p>
              <p className="mt-2 text-2xl font-bold">{tickets.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-zinc-500">Pending Requests</p>
              <p className="mt-2 text-2xl font-bold text-amber-600">
                {tickets.filter((ticket) => ticket.status === "Pending").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-zinc-500">Resolved Requests</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {tickets.filter((ticket) => ticket.status === "Resolved").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Maintenance Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable columns={columns} data={tickets} />
          </CardContent>
        </Card>

        {selectedTicket && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedTicketId(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="maintenance-updates-title"
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="maintenance-updates-title"
                    className="text-lg font-bold text-zinc-900 dark:text-white"
                  >
                    Maintenance Updates
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {selectedTicket.id} · {selectedTicket.tenant}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTicketId(null)}
                  className="rounded-lg px-3 py-1 text-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Close updates"
                >
                  ×
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-sm">
                  <span className="font-semibold">Issue:</span>{" "}
                  {selectedTicket.issue}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Technician:</span>{" "}
                  {selectedTicket.assignedTo}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Status:</span>{" "}
                  {selectedTicket.status}
                </p>

                <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
                  <h3 className="mb-3 font-semibold">Activity History</h3>

                  {selectedTicket.updates.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      No updates yet.
                    </p>
                  ) : (
                    <ul className="max-h-64 space-y-3 overflow-y-auto">
                      {[...selectedTicket.updates]
                        .reverse()
                        .map((update, index) => (
                          <li
                            key={`${update.at}-${index}`}
                            className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800"
                          >
                            <p className="text-sm">{update.message}</p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {formatDateTime(update.at)}
                            </p>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTicketId(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}