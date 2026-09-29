"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/tables/DataTable";

const MAINTENANCE_TICKETS = [
  { id: "TKT-401", tenant: "Farhan Ahmed", unit: "Unit 4B", category: "Plumbing", issue: "Master bathroom faucet leaking and low shower pressure", priority: "Medium", status: "Dispatched", assignedTo: "Kamal Plumbing Co.", requestedAt: "2026-09-28" },
  { id: "TKT-402", tenant: "Nabila Tabassum", unit: "Unit 2A", category: "HVAC", issue: "Living room AC making humming noise and blowing warm air", priority: "High", status: "Pending", assignedTo: "Unassigned", requestedAt: "2026-09-29" },
  { id: "TKT-403", tenant: "Sabbir Hossain", unit: "Apt 7C", category: "Electrical", issue: "Kitchen power socket shorted during microwave use", priority: "High", status: "Resolved", assignedTo: "VoltMasters BD", requestedAt: "2026-09-24" },
];

export default function OwnerMaintenancePage() {
  const [tickets, setTickets] = useState(MAINTENANCE_TICKETS);

  const handleDispatch = (id) => {
    setTickets(prev =>
      prev.map(t => t.id === id ? { ...t, status: "Dispatched", assignedTo: "Kamal Plumbing Co." } : t)
    );
  };

  const columns = [
    {
      header: "Ticket ID & Category",
      accessor: (row) => (
        <div>
          <span className="font-mono text-xs font-semibold">{row.id}</span>
          <div className="mt-0.5">
            <Badge variant="purple" size="sm">{row.category}</Badge>
          </div>
        </div>
      ),
    },
    {
      header: "Unit & Tenant",
      accessor: (row) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.unit}</div>
          <div className="text-xs text-zinc-400">{row.tenant}</div>
        </div>
      ),
    },
    {
      header: "Issue Description",
      accessor: (row) => (
        <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-xs line-clamp-2">
          {row.issue}
        </p>
      ),
    },
    {
      header: "Priority",
      accessor: (row) => (
        <Badge variant={row.priority === "High" ? "danger" : "warning"} size="sm">
          {row.priority}
        </Badge>
      ),
    },
    {
      header: "Assigned Provider",
      accessor: (row) => (
        <span className="text-xs font-medium">
          {row.assignedTo}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <Badge
          variant={row.status === "Resolved" ? "success" : row.status === "Dispatched" ? "info" : "warning"}
          size="sm"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Dispatch Action",
      accessor: (row) => (
        row.status === "Pending" ? (
          <Button size="sm" variant="primary" onClick={() => handleDispatch(row.id)}>
            Dispatch Tech
          </Button>
        ) : (
          <Button size="sm" variant="outline">
            View Updates
          </Button>
        )
      ),
    },
  ];

  return (
    <DashboardShell
      portal="owner"
      title="Maintenance & Service Dispatch"
      subtitle="Review tenant service requests, assign local technicians, and inspect resolution proof"
      actions={
        <Button variant="primary" size="md">
          + Log New Maintenance Job
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Open Requests ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={tickets} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
