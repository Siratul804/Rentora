"use client";

import React from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/tables/DataTable";
import { formatCurrency } from "@/lib/utils";

const LEASES = [
  { id: "L-2025-01", tenant: "Farhan Ahmed", property: "Green Horizon Residency (Unit 4B)", startDate: "2025-03-01", endDate: "2027-02-28", rent: 32000, deposit: 64000, status: "Active" },
  { id: "L-2025-02", tenant: "Nabila Tabassum", property: "Lakeview Terrace (Unit 2A)", startDate: "2024-12-01", endDate: "2026-11-30", rent: 28000, deposit: 56000, status: "Active" },
  { id: "L-2024-11", tenant: "Tanvir Rahman", property: "Green Horizon Residency (Unit 1A)", startDate: "2024-01-01", endDate: "2026-12-31", rent: 25000, deposit: 50000, status: "Active" },
  { id: "L-2025-04", tenant: "Sabbir Hossain", property: "Gulshan Heights (Apt 7C)", startDate: "2025-04-15", endDate: "2027-04-15", rent: 45000, deposit: 90000, status: "Active" },
];

export default function OwnerLeasesPage() {
  const columns = [
    {
      header: "Lease ID & Tenant",
      accessor: (row) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.tenant}</div>
          <div className="text-xs text-zinc-400">Agreement #{row.id}</div>
        </div>
      ),
    },
    {
      header: "Property / Unit",
      accessor: "property",
    },
    {
      header: "Term Period",
      accessor: (row) => (
        <span className="text-xs">
          {row.startDate} → <strong>{row.endDate}</strong>
        </span>
      ),
    },
    {
      header: "Monthly Rent",
      accessor: (row) => <strong className="text-zinc-900 dark:text-zinc-100">{formatCurrency(row.rent)}</strong>,
    },
    {
      header: "Security Deposit",
      accessor: (row) => <span>{formatCurrency(row.deposit)}</span>,
    },
    {
      header: "Status",
      accessor: (row) => <Badge variant="success" size="sm">{row.status}</Badge>,
    },
    {
      header: "Actions",
      accessor: () => (
        <Button size="sm" variant="outline">
          Download PDF
        </Button>
      ),
    },
  ];

  return (
    <DashboardShell
      portal="owner"
      title="Lease Agreements"
      subtitle="Digital rental contracts, deposit escrow, and automatic renewal reminders"
      actions={
        <Button variant="primary" size="md">
          + Draft New Lease
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Active Contracts ({LEASES.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={LEASES} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
