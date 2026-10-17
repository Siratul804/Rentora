"use client";

import React, { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/tables/DataTable";
import { formatCurrency } from "@/lib/utils";
import { downloadInvoice } from "@/lib/invoiceDownload";

function formatDate(date) {
  if (!date) return "—";
  const [year, month, day] = String(date).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

export default function TenantPaymentsPage() {
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tenant/invoices");
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to load your invoices.");
        setInvoices([]);
        setNotifications([]);
        return;
      }
      if (!Array.isArray(data.invoices) || !Array.isArray(data.notifications)) {
        setError("The server returned invalid invoice data.");
        setInvoices([]);
        setNotifications([]);
        return;
      }
      setInvoices(data.invoices);
      setNotifications(data.notifications);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load your invoices.");
      setInvoices([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const columns = [
    { header: "Invoice", accessor: (invoice) => <span className="font-mono">{invoice._id.slice(-8).toUpperCase()}</span> },
    { header: "Billing month", accessor: "billingPeriod" },
    {
      header: "Property / unit",
      accessor: (invoice) => `${invoice.propertyName || "—"}${invoice.unit ? ` · ${invoice.unit}` : ""}`,
    },
    { header: "Amount", accessor: (invoice) => formatCurrency(invoice.rentAmount) },
    { header: "Due date", accessor: (invoice) => formatDate(invoice.dueDate) },
    {
      header: "Status",
      accessor: (invoice) => (
        <Badge variant={invoice.status === "Paid" ? "success" : invoice.status === "Overdue" ? "danger" : "warning"}>
          {invoice.status}
        </Badge>
      ),
    },
    {
      header: "Payment instructions",
      accessor: (invoice) => invoice.paymentInstructions || "Contact your property owner for payment details.",
    },
    {
      header: "Download",
      accessor: (invoice) => (
        <Button size="sm" variant="outline" onClick={() => downloadInvoice(invoice)}>
          Download invoice
        </Button>
      ),
    },
  ];

  return (
    <DashboardShell
      portal="tenant"
      title="Rent invoices"
      subtitle="View your rent charges, due dates, payment instructions, and invoice notifications."
    >
      {error && (
        <p role="alert" aria-live="polite" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Invoice notifications ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p role="status" className="text-sm text-zinc-500">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">You don’t have any invoice notifications yet.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((notification) => (
                <li
                  key={notification._id}
                  className={`rounded-xl border p-4 ${
                    notification.readAt
                      ? "border-zinc-200 dark:border-zinc-800"
                      : "border-emerald-300 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20"
                  }`}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{notification.title}</h3>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{notification.message}</p>
                    </div>
                    <time className="shrink-0 text-xs text-zinc-500" dateTime={notification.createdAt}>
                      {formatDate(notification.createdAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p role="status" className="py-6 text-center text-sm text-zinc-500">Loading invoices...</p>
          ) : (
            <DataTable
              columns={columns}
              data={invoices}
              emptyMessage="No rent invoices have been issued to you yet."
            />
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
