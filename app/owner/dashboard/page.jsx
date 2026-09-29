"use client";

import React from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layouts/DashboardShell";
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

export default function OwnerDashboardPage() {
  return (
    <DashboardShell
      portal="owner"
      title="Landlord Dashboard"
      subtitle="Welcome back, Siratul Islam. Here is your portfolio performance summary."
      actions={
        <div className="flex items-center gap-2">
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
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <Card key={i} className="hover:border-emerald-500/40 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
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
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Rent Collection Status</CardTitle>
              <CardDescription>Recent invoices generated for the current rental cycle</CardDescription>
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
                <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 uppercase font-semibold border-b border-zinc-100 dark:border-zinc-800">
                  <tr>
                    <th className="px-5 py-3">Tenant & Unit</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Due Date</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {RECENT_INVOICES.map((inv) => (
                    <tr key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{inv.tenant}</div>
                        <div className="text-zinc-400">{inv.unit}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-500">{inv.dueDate}</td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={inv.status === "Paid" ? "success" : inv.status === "Overdue" ? "danger" : "warning"}
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
        <Card>
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
                className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.title}</span>
                  <Badge variant={item.status === "Dispatched" ? "info" : "warning"} size="sm">
                    {item.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-zinc-500">
                  <span>Unit: <strong className="text-zinc-700 dark:text-zinc-300">{item.unit}</strong></span>
                  <span className="text-[11px] bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded font-medium">
                    {item.urgency} Priority
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 border-t border-zinc-200/60 dark:border-zinc-800 pt-1.5 flex justify-between items-center">
                  <span>Provider: <strong>{item.provider}</strong></span>
                  <button className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                    Dispatch →
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
