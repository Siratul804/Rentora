"use client";

import React from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Glass tokens                                                        */
/* ------------------------------------------------------------------ */
// Main glass panel: translucent fill + strong blur + bright top edge highlight
const GLASS =
  "relative overflow-hidden rounded-3xl border border-white/60 dark:border-white/10 " +
  "bg-white/40 dark:bg-white/[0.05] backdrop-blur-2xl backdrop-saturate-150 " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_10px_40px_-10px_rgba(76,29,149,0.25)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_40px_-10px_rgba(0,0,0,0.6)]";

// Inner glass (items sitting inside a glass panel)
const GLASS_INNER =
  "rounded-2xl border border-white/60 dark:border-white/10 " +
  "bg-white/35 dark:bg-white/[0.04] backdrop-blur-md " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none";

const STATS = [
  { id: "owners", label: "Total Landlords / Owners", value: "148", change: "+12% this month", trend: "up", icon: "🏢" },
  { id: "subscriptions", label: "Active Subscriptions", value: "134", change: "90.5% renewal", trend: "up", icon: "💳" },
  { id: "providers", label: "Service Providers", value: "86", change: "24 cities", trend: "neutral", icon: "🛠️" },
  { id: "gmv", label: "Platform Volume (GMV)", value: formatCurrency(2840000), change: "+18.2%", trend: "up", icon: "💰" },
];

const TREND_STYLES = {
  up: "text-emerald-700 dark:text-emerald-300 bg-emerald-400/20 border-emerald-400/30",
  down: "text-red-700 dark:text-red-300 bg-red-400/20 border-red-400/30",
  neutral: "text-zinc-700 dark:text-zinc-300 bg-white/40 dark:bg-white/10 border-white/50 dark:border-white/10",
};

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

const STATUS_VARIANT = {
  Active: "success",
  Resolved: "success",
  "Pending Verification": "warning",
  "In Progress": "warning",
  Dispatched: "warning",
};

const getStatusVariant = (status) => STATUS_VARIANT[status] ?? "warning";

/* ------------------------------------------------------------------ */
/* Ambient background: glass needs something colorful to blur          */
/* ------------------------------------------------------------------ */
function GlassBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* soft base wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-sky-50 to-emerald-50 dark:from-[#0f0a1f] dark:via-[#0b1020] dark:to-[#081a18]" />

      {/* color blobs: these sit behind the cards and get blurred through the glass */}
      <div className="absolute -top-24 left-[18%] h-80 w-80 rounded-full bg-purple-400/50 dark:bg-purple-600/30 blur-3xl" />
      <div className="absolute top-[28%] right-[6%] h-96 w-96 rounded-full bg-sky-400/40 dark:bg-sky-600/25 blur-3xl" />
      <div className="absolute top-[55%] left-[30%] h-80 w-80 rounded-full bg-pink-300/40 dark:bg-fuchsia-600/20 blur-3xl" />
      <div className="absolute bottom-[-6rem] right-[28%] h-72 w-72 rounded-full bg-emerald-300/40 dark:bg-emerald-600/20 blur-3xl" />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <DashboardShell
      portal="admin"
      title="Platform Overview"
      subtitle="Super Admin governance, multi-tenant status, and dispatch telemetry"
    >
      <GlassBackdrop />

      <div className="relative z-10 space-y-6">
        {/* Hero */}
        <div className={`${GLASS} p-6 sm:p-8`}>
          {/* inner glow for depth */}
          <div className="absolute -top-16 -right-16 h-52 w-52 rounded-full bg-purple-500/25 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-11 h-11 rounded-2xl bg-white/50 dark:bg-white/10 border border-white/70 dark:border-white/15 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] flex items-center justify-center text-xl"
                aria-hidden="true"
              >
                👑
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Super Admin
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  Welcome to Rentora Admin
                </h2>
              </div>
            </div>

            <p className="text-sm text-zinc-700 dark:text-zinc-300 max-w-2xl mt-3">
              Monitor platform performance, manage owners and subscriptions, and
              keep track of service provider activity from one place.
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.id}
              className={`${GLASS} group p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/55 dark:hover:bg-white/[0.08] hover:border-white/80`}
            >
              {/* top sheen */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent dark:from-white/[0.06]" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div
                    className="w-11 h-11 rounded-2xl bg-white/50 dark:bg-white/10 border border-white/70 dark:border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] flex items-center justify-center text-xl"
                    aria-hidden="true"
                  >
                    {stat.icon}
                  </div>

                  <span
                    className={`text-[11px] font-semibold border px-2.5 py-1 rounded-full backdrop-blur-sm ${TREND_STYLES[stat.trend]}`}
                  >
                    {stat.change}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {stat.value}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    {stat.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Owners */}
          <div className={`${GLASS} lg:col-span-2`}>
            <CardHeader className="flex flex-row items-center justify-between !bg-white/20 dark:!bg-white/[0.03] !border-white/40 dark:!border-white/10">
              <div>
                <CardTitle>Recent Landlord Registrations</CardTitle>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Latest owners registered on the platform
                </p>
              </div>

              <Link
                href="/admin/owners"
                className="text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline"
              >
                View all →
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/25 dark:bg-white/[0.03] text-zinc-600 dark:text-zinc-400 uppercase font-semibold border-b border-white/40 dark:border-white/10">
                    <tr>
                      <th scope="col" className="px-5 py-3.5">Landlord</th>
                      <th scope="col" className="px-5 py-3.5">Subscription</th>
                      <th scope="col" className="px-5 py-3.5">Properties</th>
                      <th scope="col" className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/40 dark:divide-white/5">
                    {RECENT_OWNERS.map((owner) => (
                      <tr
                        key={owner.id}
                        className="hover:bg-white/40 dark:hover:bg-white/[0.05] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl bg-white/50 dark:bg-white/10 border border-white/70 dark:border-white/10 flex items-center justify-center"
                              aria-hidden="true"
                            >
                              👤
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {owner.name}
                              </div>
                              <div className="text-zinc-500 dark:text-zinc-500 mt-0.5">
                                {owner.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-medium text-zinc-800 dark:text-zinc-300">
                          {owner.plan}
                        </td>

                        <td className="px-5 py-4 font-medium text-zinc-800 dark:text-zinc-300">
                          {owner.properties}
                        </td>

                        <td className="px-5 py-4">
                          <Badge variant={getStatusVariant(owner.status)} size="sm">
                            {owner.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </div>

          {/* Dispatch Feed */}
          <div className={GLASS}>
            <CardHeader className="flex flex-row items-center justify-between !bg-white/20 dark:!bg-white/[0.03] !border-white/40 dark:!border-white/10">
              <div>
                <CardTitle>Dispatch Feed</CardTitle>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Recent service activity
                </p>
              </div>

              <Link
                href="/admin/service-providers"
                className="text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline"
              >
                View →
              </Link>
            </CardHeader>

            <CardContent className="space-y-3">
              {RECENT_DISPATCHES.map((d) => (
                <div
                  key={d.id}
                  className={`${GLASS_INNER} p-4 hover:bg-white/55 dark:hover:bg-white/[0.07] transition-colors`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {d.service}
                    </span>
                    <Badge variant={getStatusVariant(d.status)} size="sm">
                      {d.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                    <span aria-hidden="true">📍</span> {d.city}
                  </div>

                  <div className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-2">
                    Assigned to{" "}
                    <strong className="text-zinc-800 dark:text-zinc-300">
                      {d.provider}
                    </strong>
                  </div>
                </div>
              ))}
            </CardContent>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}