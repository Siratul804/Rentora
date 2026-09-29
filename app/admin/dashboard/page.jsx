"use client";

import React from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

const STATS = [
  { label: "Total Landlords / Owners", value: "148", change: "+12% this month", icon: "🏢", color: "text-purple-600" },
  { label: "Active Subscriptions", value: "134", change: "90.5% renewal", icon: "💳", color: "text-emerald-600" },
  { label: "Service Providers", value: "86", change: "24 cities", icon: "🛠️", color: "text-amber-600" },
  { label: "Platform Volume (GMV)", value: formatCurrency(2840000), change: "+18.2%", icon: "💰", color: "text-blue-600" },
];

const RECENT_OWNERS = [
  { id: "1", name: "Siratul Islam", email: "siratul@rentora.com", plan: "Enterprise", properties: 6, status: "Active" },
  { id: "2", name: "Ahmed Zubair", email: "zubair.realty@gmail.com", plan: "Growth", properties: 4, status: "Active" },
  { id: "3", name: "Mariam Sultana", email: "mariam.props@outlook.com", plan: "Starter", properties: 1, status: "Pending Verification" },
  { id: "4", name: "Rashid Chowdhury", email: "rashid@ctgproperties.com", plan: "Growth", properties: 3, status: "Active" },
];

const RECENT_DISPATCHES = [
  { id: "D-891", service: "Emergency Plumbing", city: "Dhanmondi, Dhaka", provider: "Kamal Plumbing Co.", status: "In Progress" },
  { id: "D-890", service: "Circuit Breaker Repair", city: "Gulshan-2, Dhaka", provider: "VoltMasters BD", status: "Resolved" },
  { id: "D-889", service: "AC Gas Refill", city: "Banani, Dhaka", provider: "CoolBreeze Tech", status: "Dispatched" },
];

export default function AdminDashboardPage() {
  return (
    <DashboardShell
      portal="admin"
      title="Platform Overview"
      subtitle="Super Admin governance, multi-tenant status, and dispatch telemetry"
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <Card key={i} className="hover:border-purple-500/40 transition-colors">
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
        {/* Recent Owners Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Landlord Registrations</CardTitle>
            <Link
              href="/admin/owners"
              className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 uppercase font-semibold border-b border-zinc-100 dark:border-zinc-800">
                  <tr>
                    <th className="px-5 py-3">Landlord</th>
                    <th className="px-5 py-3">Subscription</th>
                    <th className="px-5 py-3">Properties</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {RECENT_OWNERS.map((owner) => (
                    <tr key={owner.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{owner.name}</div>
                        <div className="text-zinc-400">{owner.email}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{owner.plan}</span>
                      </td>
                      <td className="px-5 py-3.5 font-medium">{owner.properties}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={owner.status === "Active" ? "success" : "warning"} size="sm">
                          {owner.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Live Service Dispatch Radar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Dispatch Feed</CardTitle>
            <Link
              href="/admin/service-providers"
              className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
            >
              Dispatch Center →
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {RECENT_DISPATCHES.map((d) => (
              <div
                key={d.id}
                className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{d.service}</span>
                  <Badge variant={d.status === "Resolved" ? "success" : "warning"} size="sm">
                    {d.status}
                  </Badge>
                </div>
                <div className="text-zinc-500 dark:text-zinc-400">📍 {d.city}</div>
                <div className="text-[11px] text-zinc-400">Assigned: <strong className="text-zinc-700 dark:text-zinc-300">{d.provider}</strong></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
