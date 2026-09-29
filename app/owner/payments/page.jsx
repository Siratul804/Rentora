"use client";

import React from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/tables/DataTable";
import { formatCurrency } from "@/lib/utils";

const TRANSACTIONS = [
  { id: "TXN-88491", tenant: "Farhan Ahmed", unit: "Unit 4B", amount: 34500, gateway: "SSLCommerz (bKash)", tranId: "SSL-BKASH-8819203", date: "2026-09-28 14:22", status: "Success" },
  { id: "TXN-88490", tenant: "Sabbir Hossain", unit: "Apt 7C", amount: 49000, gateway: "SSLCommerz (City Bank Card)", tranId: "SSL-VISA-1049281", date: "2026-09-27 18:05", status: "Success" },
  { id: "TXN-88489", tenant: "Farhan Ahmed", unit: "Unit 4B", amount: 32000, gateway: "Bank Wire Transfer", tranId: "EBL-EFT-992014", date: "2026-08-30 11:15", status: "Success" },
  { id: "TXN-88488", tenant: "Tanvir Rahman", unit: "Unit 1A", amount: 27200, gateway: "SSLCommerz (Nagad)", tranId: "SSL-NAGAD-FAILED", date: "2026-08-28 09:40", status: "Failed" },
];

export default function OwnerPaymentsPage() {
  const columns = [
    {
      header: "Txn ID",
      accessor: (row) => <span className="font-mono text-xs font-semibold">{row.id}</span>,
    },
    {
      header: "Tenant & Unit",
      accessor: (row) => (
        <div>
          <div className="font-medium text-zinc-900 dark:text-zinc-100">{row.tenant}</div>
          <div className="text-xs text-zinc-400">{row.unit}</div>
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: (row) => (
        <span className="font-bold text-zinc-900 dark:text-zinc-100">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      header: "Method / Gateway",
      accessor: (row) => (
        <div>
          <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{row.gateway}</div>
          <div className="text-[11px] text-zinc-400 font-mono">{row.tranId}</div>
        </div>
      ),
    },
    {
      header: "Timestamp",
      accessor: "date",
    },
    {
      header: "Status",
      accessor: (row) => (
        <Badge variant={row.status === "Success" ? "success" : "danger"} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Receipt",
      accessor: () => (
        <Button size="sm" variant="ghost">
          Download
        </Button>
      ),
    },
  ];

  return (
    <DashboardShell
      portal="owner"
      title="Payment History & Transactions"
      subtitle="Verify online payments collected via SSLCommerz, mobile banking, and direct bank transfers"
      actions={
        <Button variant="outline" size="md">
          Export Ledger (CSV)
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Recent Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={TRANSACTIONS} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
