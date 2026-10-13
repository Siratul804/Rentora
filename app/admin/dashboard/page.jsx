"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/tables/DataTable";
import { formatCurrency } from "@/lib/utils";

const STATS = [
  { id: "owners", label: "Total Landlords / Owners", value: "148", change: "+12% this month", trend: "up", icon: "🏢" },
  { id: "subscriptions", label: "Active Subscriptions", value: "134", change: "90.5% renewal", trend: "up", icon: "💳" },
  { id: "providers", label: "Service Providers", value: "86", change: "24 cities", trend: "neutral", icon: "🛠️" },
  { id: "gmv", label: "Platform Volume (GMV)", value: formatCurrency(2840000), change: "+18.2%", trend: "up", icon: "💰" },
];

const INITIAL_OWNERS = [
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
  const [owners, setOwners] = useState(INITIAL_OWNERS);

  // Attempt to fetch latest owners from API if available
  useEffect(() => {
    fetch("/api/admin/owner")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.owners) && data.owners.length > 0) {
          const enriched = data.owners.map((owner, idx) => ({
            id: owner.id || String(idx + 1),
            name: owner.name,
            email: owner.email,
            plan: owner.plan || (idx % 2 === 0 ? "Enterprise" : "Growth"),
            properties: owner.properties ?? (idx + 2),
            status: owner.status || "Active",
          }));
          setOwners(enriched);
        }
      })
      .catch((err) => {
        console.error("ADMIN DASHBOARD API ERROR:", err);
      });
  }, []);

  const columns = [
    {
      header: "Landlord / Owner",
      accessor: (row) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
            {row.name}
          </div>
          <div className="text-xs text-zinc-400">
            {row.email}
          </div>
        </div>
      ),
    },
    {
      header: "Subscription Plan",
      accessor: (row) => (
        <Badge
          variant={
            row.plan === "Enterprise"
              ? "purple"
              : row.plan === "Growth"
                ? "info"
                : "neutral"
          }
        >
          {row.plan || "Starter"}
        </Badge>
      ),
    },
    {
      header: "Portfolio",
      accessor: (row) => (
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {row.properties ?? 1} Properties
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <Badge
          variant={
            row.status === "Active" || row.status === "Approved"
              ? "success"
              : row.status === "Suspended"
                ? "danger"
                : "warning"
          }
        >
          {row.status || "Active"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: () => (
        <Link href="/admin/owners">
          <Button size="sm" variant="outline">
            Manage
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <DashboardShell
      portal="admin"
      title="Platform Overview"
      subtitle="Super Admin governance, multi-tenant status, and dispatch telemetry"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/owners">
            <Button variant="outline" size="sm">
              All Owners
            </Button>
          </Link>
          <Link href="/admin/subscriptions">
            <Button variant="primary" size="sm">
              Billing & Plans
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <Card key={stat.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl">
                    {stat.icon}
                  </div>
                  <Badge
                    variant={
                      stat.trend === "up"
                        ? "success"
                        : stat.trend === "down"
                          ? "danger"
                          : "neutral"
                    }
                    size="sm"
                  >
                    {stat.change}
                  </Badge>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {stat.value}
                  </div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                    {stat.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Landlords */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Landlord Registrations</CardTitle>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Latest owners registered on the platform
                  </p>
                </div>
                <Link href="/admin/owners">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All Owners →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={owners}
                className="border-0 rounded-none shadow-none"
              />
            </CardContent>
          </Card>

          {/* Dispatch Feed */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Dispatch Feed</CardTitle>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Recent service activity & requests
                  </p>
                </div>
                <Link href="/admin/service-providers">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {RECENT_DISPATCHES.map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 block">
                        {d.service}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {d.id}
                      </span>
                    </div>
                    <Badge
                      variant={
                        d.status === "Resolved"
                          ? "success"
                          : d.status === "In Progress"
                            ? "warning"
                            : "info"
                      }
                      size="sm"
                    >
                      {d.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 flex items-center gap-1.5">
                    <span aria-hidden="true">📍</span>
                    <span>{d.city}</span>
                  </div>

                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                    <span className="text-[11px]">Provider:</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {d.provider}
                    </span>
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