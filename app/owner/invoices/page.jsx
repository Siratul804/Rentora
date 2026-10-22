"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/tables/DataTable";
import { formatCurrency } from "@/lib/utils";
import { downloadInvoice } from "@/lib/invoiceDownload";

function getCurrentBillingPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getNextBillingPeriod() {
  const nextMonth = new Date();
  nextMonth.setDate(1);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(date) {
  if (!date) return "—";
  const [year, month, day] = String(date).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

export default function OwnerInvoicesPage() {
  const [billingPeriod, setBillingPeriod] = useState(getCurrentBillingPeriod);
  const [dueDate, setDueDate] = useState(() => `${getCurrentBillingPeriod()}-05`);
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [activeLeases, setActiveLeases] = useState([]);
  const [selectedLeaseIds, setSelectedLeaseIds] = useState([]);
  const [filter, setFilter] = useState("All");
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendingInvoiceId, setSendingInvoiceId] = useState("");
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState("");
  const [pendingStatus, setPendingStatus] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryLeaseId = params.get("leaseId");
      if (queryLeaseId) {
        setShowGenerator(true);
        setSelectedLeaseIds([queryLeaseId]);
      }
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/owner/invoices?period=${encodeURIComponent(billingPeriod)}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to load invoices.");
        setInvoices([]);
        setActiveLeases([]);
        setSelectedLeaseIds([]);
        return;
      }
      if (!Array.isArray(data.invoices) || !Array.isArray(data.leases)) {
        setError("The server returned an invalid invoice list.");
        setInvoices([]);
        setActiveLeases([]);
        setSelectedLeaseIds([]);
        return;
      }
      setInvoices(data.invoices);
      setActiveLeases(data.leases);
      setSelectedLeaseIds((current) => {
        if (current.length > 0) {
          const valid = current.filter((id) => data.leases.some((l) => l.id === id));
          if (valid.length > 0) return valid;
        }
        return data.leases.map((lease) => lease.id);
      });
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load invoices.");
      setInvoices([]);
      setActiveLeases([]);
      setSelectedLeaseIds([]);
    } finally {
      setLoading(false);
    }
  }, [billingPeriod]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const filteredInvoices = useMemo(
    () => filter === "All" ? invoices : invoices.filter((invoice) => invoice.status === filter),
    [filter, invoices]
  );

  function changeBillingPeriod(period) {
    setBillingPeriod(period);
    setDueDate(`${period}-05`);
    setMessage("");
  }

  function toggleLease(leaseId) {
    setSelectedLeaseIds((current) =>
      current.includes(leaseId)
        ? current.filter((id) => id !== leaseId)
        : [...current, leaseId]
    );
  }

  async function generateInvoices(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/owner/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseIds: selectedLeaseIds,
          billingPeriod,
          dueDate,
          paymentInstructions,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to generate invoices.");
        return;
      }
      setMessage(data.message || "Invoices generated.");
      await loadInvoices();
    } catch (err) {
      setError(err.message || "Failed to generate invoices.");
    } finally {
      setSubmitting(false);
    }
  }

  async function sendInvoice(invoice) {
    setSendingInvoiceId(invoice._id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/owner/invoices/${invoice._id}/send`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to send invoice.");
        return;
      }
      setMessage(data.message || "Invoice notification sent to tenant.");
      await loadInvoices();
    } catch (err) {
      setError(err.message || "Failed to send invoice.");
    } finally {
      setSendingInvoiceId("");
    }
  }

  async function downloadInvoicePdf(invoice) {
    setDownloadingInvoiceId(invoice._id);
    setError("");
    setMessage("");
    try {
      await downloadInvoice(invoice._id);
      setMessage("Invoice PDF downloaded.");
    } catch (err) {
      setError(err.message || "Failed to download the invoice PDF.");
    } finally {
      setDownloadingInvoiceId("");
    }
  }

  async function updateStatus(invoiceId) {
    const status = pendingStatus[invoiceId];
    if (!status) return;
    setUpdatingStatusId(invoiceId);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/owner/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to update status.");
        return;
      }
      setMessage(data.message || "Status updated.");
      setInvoices((current) =>
        current.map((inv) =>
          inv._id === invoiceId ? { ...inv, status: data.invoice.status } : inv
        )
      );
    } catch (err) {
      setError(err.message || "Failed to update status.");
    } finally {
      setUpdatingStatusId("");
    }
  }

  const columns = [
    { header: "Invoice", accessor: (invoice) => <span className="font-mono">{invoice._id.slice(-8).toUpperCase()}</span> },
    { header: "Tenant", accessor: (invoice) => invoice.tenantName || invoice.tenantId?.name || "—" },
    {
      header: "Property / unit",
      accessor: (invoice) => `${invoice.propertyName || "—"}${invoice.unit ? ` · ${invoice.unit}` : ""}`,
    },
    { header: "Billing month", accessor: "billingPeriod" },
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
      header: "Actions",
      accessor: (invoice) => (
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={pendingStatus[invoice._id] ?? invoice.status}
            onChange={(e) =>
              setPendingStatus((prev) => ({ ...prev, [invoice._id]: e.target.value }))
            }
            disabled={updatingStatusId === invoice._id}
            aria-label={`Change status for invoice ${invoice._id.slice(-8).toUpperCase()}`}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {["Pending", "Paid", "Overdue"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            disabled={
              updatingStatusId === invoice._id ||
              (pendingStatus[invoice._id] ?? invoice.status) === invoice.status
            }
            onClick={() => updateStatus(invoice._id)}
            aria-label={`Update status for invoice ${invoice._id.slice(-8).toUpperCase()}`}
          >
            {updatingStatusId === invoice._id ? "Updating..." : "Update"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={downloadingInvoiceId === invoice._id}
            onClick={() => downloadInvoicePdf(invoice)}
            aria-label={`Download Invoice (PDF) ${invoice._id.slice(-8).toUpperCase()}`}
          >
            {downloadingInvoiceId === invoice._id ? "Preparing..." : "PDF"}
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={sendingInvoiceId === invoice._id}
            onClick={() => sendInvoice(invoice)}
          >
            {sendingInvoiceId === invoice._id ? "Sending..." : "Send"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      portal="owner"
      title="Rent invoices"
      subtitle="Generate monthly rent invoices from active leases, notify tenants, and track billing."
      actions={
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowGenerator((visible) => !visible)}
          aria-expanded={showGenerator}
          aria-controls="invoice-generator"
        >
          {showGenerator ? "Close invoice form" : "Generate monthly invoices"}
        </Button>
      }
    >
      {(error || message) && (
        <div
          role={error ? "alert" : "status"}
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
          }`}
        >
          {error || message}
        </div>
      )}

      {showGenerator && (
        <Card id="invoice-generator">
          <CardHeader>
            <CardTitle>Generate invoices from active leases</CardTitle>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Each selected tenant receives an in-app notification. Invoices are created only once per lease and billing month.
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p role="status" className="text-sm text-zinc-500">Loading active leases...</p>
            ) : activeLeases.length === 0 ? (
              <div className="py-2 space-y-2">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  No active leases with a tenant account cover this billing month ({billingPeriod}).
                </p>
                <Link
                  href="/owner/leases"
                  className="inline-block text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Go to Lease Agreements to create or activate a lease →
                </Link>
              </div>
            ) : (
              <form onSubmit={generateInvoices} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Billing month
                    <input
                      required
                      type="month"
                      value={billingPeriod}
                      onChange={(event) => changeBillingPeriod(event.target.value)}
                      className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </label>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Due date
                    <input
                      required
                      type="date"
                      value={dueDate}
                      min={`${billingPeriod}-01`}
                      max={`${billingPeriod}-${String(new Date(
                        Number(billingPeriod.slice(0, 4)),
                        Number(billingPeriod.slice(5, 7)),
                        0
                      ).getDate()).padStart(2, "0")}`}
                      onChange={(event) => setDueDate(event.target.value)}
                      className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </label>
                </div>
                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    Active leases ({activeLeases.length})
                  </legend>
                  {activeLeases.map((lease) => (
                    <label
                      key={lease.id}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLeaseIds.includes(lease.id)}
                        onChange={() => toggleLease(lease.id)}
                        className="mt-1 h-4 w-4 accent-emerald-600"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-zinc-900 dark:text-zinc-100">
                          {lease.tenantName} <span className="font-normal text-zinc-500">· {lease.propertyName}{lease.unit ? `, ${lease.unit}` : ""}</span>
                        </span>
                        <span className="block text-sm text-zinc-500 dark:text-zinc-400">
                          {lease.tenantEmail} · {formatCurrency(lease.rent)} / month
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Payment instructions
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={paymentInstructions}
                    onChange={(event) => setPaymentInstructions(event.target.value)}
                    placeholder="Add payment method, account details, or other instructions"
                    className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
                    {selectedLeaseIds.length} lease{selectedLeaseIds.length === 1 ? "" : "s"} selected
                  </p>
                  <Button type="submit" disabled={submitting || !selectedLeaseIds.length}>
                    {submitting ? "Generating..." : "Generate selected invoices"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter invoices by status">
            {["All", "Paid", "Pending", "Overdue"].map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={filter === status ? "primary" : "outline"}
                aria-pressed={filter === status}
                onClick={() => setFilter(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p role="status" className="py-6 text-center text-sm text-zinc-500">Loading invoices...</p>
          ) : (
            <DataTable
              columns={columns}
              data={filteredInvoices}
              emptyMessage="No invoices match this filter. Generate invoices from active leases to get started."
            />
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
