"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/tables/DataTable";
import { formatCurrency } from "@/lib/utils";

const INVOICES = [
  { id: "INV-2026-101", tenant: "Farhan Ahmed", unit: "Green Horizon (Unit 4B)", rent: 32000, utilities: 2500, total: 34500, issueDate: "2026-09-25", dueDate: "2026-10-05", status: "Paid" },
  { id: "INV-2026-102", tenant: "Nabila Tabassum", unit: "Lakeview Terrace (Unit 2A)", rent: 28000, utilities: 1800, total: 29800, issueDate: "2026-09-25", dueDate: "2026-10-05", status: "Pending" },
  { id: "INV-2026-103", tenant: "Tanvir Rahman", unit: "Green Horizon (Unit 1A)", rent: 25000, utilities: 2200, total: 27200, issueDate: "2026-08-25", dueDate: "2026-09-05", status: "Overdue" },
  { id: "INV-2026-104", tenant: "Sabbir Hossain", unit: "Gulshan Heights (Apt 7C)", rent: 45000, utilities: 4000, total: 49000, issueDate: "2026-09-25", dueDate: "2026-10-05", status: "Paid" },
];

export default function OwnerInvoicesPage() {
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? INVOICES : INVOICES.filter(i => i.status === filter);

  const columns = [
    {
      header: "Invoice #",
      accessor: (row) => <span className="font-mono font-medium">{row.id}</span>,
    },
    {
      header: "Tenant & Unit",
      accessor: (row) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.tenant}</div>
          <div className="text-xs text-zinc-400">{row.unit}</div>
        </div>
      ),
    },
    {
      header: "Rent + Utilities",
      accessor: (row) => (
        <span className="text-xs">
          {formatCurrency(row.rent)} + {formatCurrency(row.utilities)}
        </span>
      ),
    },
    {
      header: "Total Due",
      accessor: (row) => (
        <span className="font-bold text-zinc-900 dark:text-zinc-100">
          {formatCurrency(row.total)}
        </span>
      ),
    },
    {
      header: "Due Date",
      accessor: "dueDate",
    },
    {
      header: "Status",
      accessor: (row) => (
        <Badge
          variant={row.status === "Paid" ? "success" : row.status === "Overdue" ? "danger" : "warning"}
          size="sm"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex gap-2">
          {row.status !== "Paid" && (
            <Button size="sm" variant="outline">
              Send SMS
            </Button>
          )}
          <Button size="sm" variant="ghost">
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      portal="owner"
      title="Rent Invoices"
      subtitle="Issue monthly invoices, track rent collections, and trigger automated reminders"
      actions={
        <Button variant="primary" size="md">
          + Generate Monthly Invoices
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Invoices ({filtered.length})</CardTitle>
            <div className="flex items-center gap-1.5">
              {["All", "Paid", "Pending", "Overdue"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === f
                      ? "bg-emerald-600 text-white"
                      : "border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={filtered} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
