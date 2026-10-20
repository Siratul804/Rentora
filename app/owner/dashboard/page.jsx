
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

const STATS = [
  { label: "Total Monthly Rent", value: formatCurrency(385000), change: "92% collected", icon: "💰", color: "text-emerald-600" },
  { label: "Occupancy Rate", value: "91.6%", change: "22 / 24 Units", icon: "🏠", color: "text-blue-600" },
  { label: "Active Tenants", value: "22", change: "+2 renewals", icon: "👥", color: "text-purple-600" },
  { label: "Maintenance Requests", value: "3", change: "1 in progress", icon: "🛠️", color: "text-amber-600" },
];

const RECENT_INVOICES = [
  { id: "INV-109", tenant: "Farhan Ahmed", unit: "Green Horizon (Unit 4B)", amount: 32000, dueDate: "2026-10-05", status: "Paid" },
  { id: "INV-110", tenant: "Nabila Tabassum", unit: "Lakeview Terrace (Unit 2A)", amount: 28000, dueDate: "2026-10-05", status: "Pending" },
  { id: "INV-111", tenant: "Tanvir Rahman", unit: "Green Horizon (Unit 1A)", amount: 25000, dueDate: "2026-09-28", status: "Overdue" },
  { id: "INV-112", tenant: "Sabbir Hossain", unit: "Gulshan Heights (Apt 7C)", amount: 45000, dueDate: "2026-10-05", status: "Paid" },
];

const ACTIVE_MAINTENANCE = [
  { id: "M-301", title: "Master bathroom faucet leaking", unit: "Unit 4B", urgency: "Medium", status: "Dispatched", provider: "Kamal Plumbing Co." },
  { id: "M-302", title: "Living room AC making humming noise", unit: "Unit 2A", urgency: "Low", status: "Pending", provider: "Unassigned" },
];

const glassCard =
  "bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg shadow-zinc-900/5 dark:shadow-black/10 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/10 hover:border-emerald-500/30";

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const ownerName = user?.name || "Landlord";
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    async function loadPaymentInfo() {
      try {
        const res = await fetch("/api/owner/payment-info");
        if (res.ok) {
          const data = await res.json();
          if (data.payment) setPaymentInfo(data.payment);
        }
      } catch (err) {
        console.error("Failed to load owner payment info:", err);
      }
    }
    loadPaymentInfo();
  }, []);

  return (
    <DashboardShell
      portal="owner"
      title="Landlord Dashboard"
      subtitle={`Welcome back, ${ownerName}. Here is your portfolio performance summary.`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/owner/bills">
            <Button variant="outline" size="sm">
              💳 My Bills
            </Button>
          </Link>
          <Link href="/owner/invoices">
            <Button variant="outline" size="sm">
              Generate Invoices
            </Button>
          </Link>
          <Link href="/owner/properties">
            <Button variant="primary" size="sm">
              + Add Property
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Compact My Bills Link / Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-lg shrink-0">
              💳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Platform Account Status: {paymentInfo?.status === "Paid" ? "Active (Paid ৳499)" : "Pending Payment"}
                </span>
                <Badge variant={paymentInfo?.status === "Paid" ? "success" : "warning"} size="sm">
                  {paymentInfo?.status === "Paid" ? "Paid ✓" : "Pending"}
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Property owner platform subscription and licensing bill records.
              </p>
            </div>
          </div>
          <Link href="/owner/bills">
            <Button variant="outline" size="sm" className="text-xs h-8">
              View My Bills →
            </Button>
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat, i) => (
            <Card
              key={i}
              className={`${glassCard} hover:-translate-y-1`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/10 px-2 py-0.5 rounded-full">
                    {stat.change}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {stat.value}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {stat.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Invoices */}
          <Card className={`lg:col-span-2 ${glassCard}`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Rent Collection Status</CardTitle>
                <CardDescription>
                  Recent invoices generated for the current rental cycle
                </CardDescription>
              </div>
              <Link
                href="/owner/invoices"
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                All Invoices →
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/30 dark:bg-zinc-950/30 backdrop-blur-lg text-zinc-500 dark:text-zinc-400 uppercase font-semibold border-b border-white/40 dark:border-zinc-700/50">
                    <tr>
                      <th className="px-5 py-3">Tenant & Unit</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Due Date</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40 dark:divide-zinc-700/40">
                    {RECENT_INVOICES.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors duration-200"
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {inv.tenant}
                          </div>
                          <div className="text-zinc-400">{inv.unit}</div>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-500">
                          {inv.dueDate}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={
                              inv.status === "Paid"
                                ? "success"
                                : inv.status === "Overdue"
                                ? "danger"
                                : "warning"
                            }
                            size="sm"
                          >
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Dispatch Widget */}
          <Card className={glassCard}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Maintenance Queue</CardTitle>
              <Link
                href="/owner/maintenance"
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View all →
              </Link>
            </CardHeader>

            <CardContent className="space-y-4">
              {ACTIVE_MAINTENANCE.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-white/60 dark:border-white/10 bg-white/30 dark:bg-zinc-950/30 backdrop-blur-lg shadow-sm hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-300 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </span>
                    <Badge
                      variant={
                        item.status === "Dispatched" ? "info" : "warning"
                      }
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-zinc-500">
                    <span>
                      Unit:{" "}
                      <strong className="text-zinc-700 dark:text-zinc-300">
                        {item.unit}
                      </strong>
                    </span>
                    <span className="text-[11px] bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded font-medium">
                      {item.urgency} Priority
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-400 border-t border-white/50 dark:border-zinc-700/50 pt-1.5 flex justify-between items-center">
                    <span>
                      Provider: <strong>{item.provider}</strong>
                    </span>
                    <button className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                      Dispatch →
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}