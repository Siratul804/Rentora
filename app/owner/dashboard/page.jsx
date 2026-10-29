"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

const glassCard =
  "bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg shadow-zinc-900/5 dark:shadow-black/10 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/10 hover:border-emerald-500/30";

async function fetchData(url) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Failed to load ${url}.`);
  return data;
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString() : "—";
}

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchData("/api/owner/properties"),
      fetchData("/api/owner/leases"),
      fetchData("/api/owner/invoices"),
      fetchData("/api/owner/maintenance"),
    ])
      .then(([propertyData, leaseData, invoiceData, maintenanceData]) => {
        if (!active) return;
        const properties = propertyData.properties || [];
        const leases = leaseData.leases || [];
        const invoices = invoiceData.invoices || [];
        const maintenance = maintenanceData.requests || [];
        const activeLeases = leases.filter((lease) => lease.status === "Active");
        const currentPeriod = new Date().toISOString().slice(0, 7);
        const periodInvoices = invoices.filter((invoice) => invoice.billingPeriod === currentPeriod);
        const paidInvoices = periodInvoices.filter((invoice) => invoice.status === "Paid").length;
        const openMaintenance = maintenance.filter(
          (item) => !["Resolved", "Closed"].includes(item.status)
        );

        setDashboard({
          properties: properties.length,
          activeLeases: activeLeases.length,
          rent: activeLeases.reduce((total, lease) => total + (Number(lease.rent) || 0), 0),
          collection: periodInvoices.length
            ? `${Math.round((paidInvoices / periodInvoices.length) * 100)}% paid`
            : "No invoices this month",
          invoices: invoices.slice(0, 4),
          maintenance: openMaintenance.slice(0, 3),
          openMaintenanceCount: openMaintenance.length,
        });
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Failed to load dashboard data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchData("/api/owner/payment-info")
      .then((data) => {
        if (active) setPaymentInfo(data.payment || null);
      })
      .catch((paymentError) => {
        console.error("Failed to load owner payment info:", paymentError);
      });
    return () => {
      active = false;
    };
  }, []);

  const ownerName = user?.name || "Landlord";
  const stats = dashboard
    ? [
        { label: "Active Lease Rent", value: formatCurrency(dashboard.rent), change: dashboard.collection, icon: "💰" },
        { label: "Properties", value: dashboard.properties, change: "In your portfolio", icon: "🏠" },
        { label: "Active Leases", value: dashboard.activeLeases, change: "Current leases", icon: "👥" },
        { label: "Open Maintenance", value: dashboard.openMaintenanceCount, change: "Unresolved requests", icon: "🛠️" },
      ]
    : [];

  return (
    <DashboardShell
      portal="owner"
      title="Landlord Dashboard"
      subtitle={`Welcome back, ${ownerName}. Here is your portfolio performance summary.`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/owner/bills"><Button variant="outline" size="sm">💳 My Bills</Button></Link>
          <Link href="/owner/invoices"><Button variant="outline" size="sm">Generate Invoices</Button></Link>
          <Link href="/provider-job-history"><Button variant="outline" size="sm">Provider Job History</Button></Link>
          <Link href="/owner/properties"><Button variant="primary" size="sm">+ Add Property</Button></Link>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-lg shrink-0">💳</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Platform Account Status: {paymentInfo?.status === "Paid" ? "Paid" : paymentInfo?.status || "Unavailable"}
                </span>
                <Badge variant={paymentInfo?.status === "Paid" ? "success" : paymentInfo?.status ? "warning" : "neutral"} size="sm">
                  {paymentInfo?.status || "Unavailable"}
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Property owner platform subscription and licensing bill records.</p>
            </div>
          </div>
          <Link href="/owner/bills"><Button variant="outline" size="sm" className="text-xs h-8">View My Bills →</Button></Link>
        </div>

        {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</p>}

        {loading ? (
          <p role="status" className="py-8 text-center text-sm text-zinc-500">Loading portfolio data...</p>
        ) : dashboard && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card key={stat.label} className={`${glassCard} hover:-translate-y-1`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{stat.icon}</span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-full">{stat.change}</span>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{stat.value}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{stat.label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className={`lg:col-span-2 ${glassCard}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Rent Collection Status</CardTitle>
                    <CardDescription>Recent invoices from your records</CardDescription>
                  </div>
                  <Link href="/owner/invoices" className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">All Invoices →</Link>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/30 dark:bg-zinc-950/30 text-zinc-500 dark:text-zinc-400 uppercase font-semibold border-b border-white/40 dark:border-zinc-700/50">
                        <tr><th className="px-5 py-3">Tenant &amp; Unit</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Due Date</th><th className="px-5 py-3">Status</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/40 dark:divide-zinc-700/40">
                        {dashboard.invoices.map((invoice) => (
                          <tr key={invoice._id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">{invoice.tenantName || invoice.tenantId?.name || "Tenant not assigned"}</div>
                              <div className="text-zinc-400">{[invoice.propertyName, invoice.unit].filter(Boolean).join(" · ") || "—"}</div>
                            </td>
                            <td className="px-5 py-3.5 font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(invoice.rentAmount)}</td>
                            <td className="px-5 py-3.5 text-zinc-500">{formatDate(invoice.dueDate)}</td>
                            <td className="px-5 py-3.5"><Badge variant={invoice.status === "Paid" ? "success" : invoice.status === "Overdue" ? "danger" : "warning"} size="sm">{invoice.status}</Badge></td>
                          </tr>
                        ))}
                        {dashboard.invoices.length === 0 && <tr><td colSpan="4" className="px-5 py-8 text-center text-zinc-500">No invoices found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className={glassCard}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Maintenance Queue</CardTitle>
                  <Link href="/owner/maintenance" className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">View all →</Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboard.maintenance.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-xl border border-white/60 dark:border-white/10 bg-white/30 dark:bg-zinc-950/30 shadow-sm text-xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.title}</span>
                        <Badge variant={["Resolved", "Closed"].includes(item.status) ? "success" : "warning"} size="sm">{item.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-zinc-500">
                        <span>{[item.property, item.unit].filter(Boolean).join(" · ") || "Property not assigned"}</span>
                        <span className="text-[11px]">{item.priority} Priority</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 border-t border-white/50 dark:border-zinc-700/50 pt-1.5">Provider: <strong>{item.assignedTo || "Unassigned"}</strong></div>
                    </div>
                  ))}
                  {dashboard.maintenance.length === 0 && <p className="py-6 text-center text-sm text-zinc-500">No open maintenance requests.</p>}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
