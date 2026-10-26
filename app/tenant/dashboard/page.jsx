"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { downloadInvoice } from "@/lib/invoiceDownload";
import { useAuth } from "@/hooks/useAuth";

function formatDueDate(date) {
  if (!date) return "Not available";
  const [year, month, day] = String(date).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function TenantDashboardPage() {
  const { user, loading } = useAuth();
  const [rent, setRent] = useState(null);
  const [rentLoading, setRentLoading] = useState(true);
  const [rentError, setRentError] = useState("");
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [invoiceDownloadError, setInvoiceDownloadError] = useState("");
  const [invoiceDownloadMessage, setInvoiceDownloadMessage] = useState("");

  const loadRentSummary = useCallback(async () => {
    setRentLoading(true);
    try {
      const response = await fetch("/api/tenant/rent-summary");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load your rent details.");
      }
      if (data.rent !== null && (
        typeof data.rent !== "object" ||
        typeof data.rent.amount !== "number" ||
        typeof data.rent.paymentFrequency !== "string" ||
        typeof data.rent.dueDate !== "string" ||
        !["Paid", "Pending", "Overdue"].includes(data.rent.status) ||
        (data.rent.invoiceId !== null && typeof data.rent.invoiceId !== "string")
      )) {
        throw new Error("The server returned invalid rent details.");
      }
      setRent(data.rent);
      setRentError("");
    } catch (error) {
      setRent(null);
      setRentError(error.message || "Failed to load your rent details.");
    } finally {
      setRentLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRentSummary();
  }, [loadRentSummary]);

  async function downloadCurrentInvoice() {
    if (!rent?.invoiceId) return;
    setDownloadingInvoice(true);
    setInvoiceDownloadError("");
    setInvoiceDownloadMessage("");
    try {
      await downloadInvoice(rent.invoiceId);
      setInvoiceDownloadMessage("Invoice PDF downloaded.");
    } catch (error) {
      setInvoiceDownloadError(error.message || "Failed to download the invoice PDF.");
    } finally {
      setDownloadingInvoice(false);
    }
  }

  const tenantName = user?.name?.split(" ")[0] || "Resident";
  const property = user?.property || "Your Property";
  const unit = user?.unit || "Your Unit";

  if (loading) {
    return (
      <DashboardShell portal="tenant" title="Loading...">
        <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">
          Loading your dashboard...
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      portal="tenant"
      title={`Welcome Home, ${tenantName}`}
      subtitle={`Resident portal for ${property} — ${unit}`}
      actions={
        <Link href="/tenant/payments">
          <Button variant="primary" size="md">
            💳 Pay Rent Online
          </Button>
        </Link>
      }
    >
      {/* Unit & Rent Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-teal-500/5">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
                Active Tenancy
              </span>
              <span className="text-xl">🏠</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {unit}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {property}
              </p>
            </div>
            <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800 text-xs flex justify-between">
              <span className="text-zinc-500">Email:</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{user?.email || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card aria-labelledby="rent-summary-heading">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="rent-summary-heading" className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  Rent &amp; Due Date
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Your current rent details</p>
              </div>
              <span aria-hidden="true" className="text-xl">💰</span>
            </div>

            {rentLoading ? (
              <p role="status" className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
                Loading your rent details...
              </p>
            ) : rentError ? (
              <div className="space-y-3">
                <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{rentError}</p>
                <Button size="sm" variant="outline" onClick={loadRentSummary}>Try again</Button>
              </div>
            ) : rent ? (
              <>
                <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(rent.amount)}
                </div>
                <dl className="grid grid-cols-1 gap-3 border-t border-zinc-200/60 pt-3 text-sm dark:border-zinc-800 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">Payment frequency</dt>
                    <dd className="mt-1 font-medium text-zinc-800 dark:text-zinc-200">{rent.paymentFrequency}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">Next due date</dt>
                    <dd className="mt-1 font-medium text-zinc-800 dark:text-zinc-200">{formatDueDate(rent.dueDate)}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Payment status</span>
                    <Badge
                      variant={rent.status === "Paid" ? "success" : rent.status === "Overdue" ? "danger" : "warning"}
                      aria-label={`Payment status: ${rent.status.toLowerCase()}`}
                    >
                      {rent.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {rent.invoiceId && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={downloadingInvoice}
                        onClick={downloadCurrentInvoice}
                      >
                        {downloadingInvoice ? "Preparing PDF..." : "Download Invoice (PDF)"}
                      </Button>
                    )}
                    <Link href="/tenant/payments" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      View invoices <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
                {(invoiceDownloadError || invoiceDownloadMessage) && (
                  <p
                    role={invoiceDownloadError ? "alert" : "status"}
                    aria-live="polite"
                    className={invoiceDownloadError
                      ? "text-sm text-rose-700 dark:text-rose-300"
                      : "text-sm text-emerald-700 dark:text-emerald-300"}
                  >
                    {invoiceDownloadError || invoiceDownloadMessage}
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  No active rent details are linked to your account yet.
                </p>
                <Link href="/tenant/lease" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  View lease details <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full">
                Maintenance
              </span>
              <span className="text-xl">🛠️</span>
            </div>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              1 Active
            </div>
            <div className="text-xs text-zinc-500">
              Bathroom faucet repair: <strong className="text-emerald-600">Dispatched</strong>
            </div>
            <div className="pt-2">
              <Link href="/tenant/maintenance">
                <Button size="sm" variant="outline" className="w-full">
                  + Request Repair
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Pay Rent", desc: "Cards, bKash, Nagad, Internet Banking", icon: "💳", href: "/tenant/payments" },
          { title: "Service Request", desc: "Plumbers, electricians & HVAC", icon: "🔧", href: "/tenant/maintenance" },
          { title: "Lease Contract", desc: "Terms, agreement PDF, renewal", icon: "📄", href: "/tenant/lease" },
          { title: "My Profile", desc: "Emergency contacts & security", icon: "👤", href: "/tenant/profile" },
        ].map((item, idx) => (
          <Link key={idx} href={item.href}>
            <Card className="hover:border-blue-500/50 hover:shadow-md transition-all p-5 h-full flex flex-col justify-between">
              <div className="text-3xl mb-3">{item.icon}</div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{item.title}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{item.desc}</p>
              </div>
              <div className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                Open →
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
