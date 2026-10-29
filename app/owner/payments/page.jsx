"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/tables/DataTable";
import { formatCurrency } from "@/lib/utils";

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function OwnerPaymentsPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/owner/invoices")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load payment records.");
        if (!Array.isArray(data.invoices)) throw new Error("The server returned invalid invoice data.");
        return data.invoices;
      })
      .then((data) => {
        if (active) setInvoices(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Failed to load payment records.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const columns = [
    {
      header: "Invoice / Transaction",
      accessor: (row) => (
        <div>
          <div className="font-mono text-xs font-semibold">{row.tranId || row._id}</div>
          <div className="text-[11px] text-zinc-400">Invoice {row._id}</div>
        </div>
      ),
    },
    {
      header: "Tenant & Unit",
      accessor: (row) => (
        <div>
          <div className="font-medium text-zinc-900 dark:text-zinc-100">{row.tenantName || row.tenantId?.name || "Tenant not assigned"}</div>
          <div className="text-xs text-zinc-400">{[row.propertyName, row.unit].filter(Boolean).join(" · ") || "—"}</div>
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: (row) => <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(row.rentAmount)}</span>,
    },
    {
      header: "Payment Reference",
      accessor: (row) => row.tranId || "Not recorded",
    },
    {
      header: "Recorded",
      accessor: (row) => formatDate(row.updatedAt || row.createdAt),
    },
    {
      header: "Status",
      accessor: (row) => (
        <Badge variant={row.status === "Paid" ? "success" : row.status === "Overdue" ? "danger" : "warning"} size="sm">
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <DashboardShell
      portal="owner"
      title="Payment History & Transactions"
      subtitle="Payment status and transaction references recorded on your rent invoices"
    >
      <Card>
        <CardHeader><CardTitle>Rent Invoice Payment Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          {error ? (
            <p role="alert" className="p-5 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          ) : loading ? (
            <p role="status" className="p-8 text-center text-sm text-zinc-500">Loading payment records...</p>
          ) : invoices.length ? (
            <DataTable columns={columns} data={invoices} />
          ) : (
            <p className="p-8 text-center text-sm text-zinc-500">No rent invoice payment records found.</p>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
