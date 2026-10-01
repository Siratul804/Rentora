"use client";

import React from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export default function TenantDashboardPage() {
  const { user, loading } = useAuth();

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

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                Next Rent Due
              </span>
              <span className="text-xl">💰</span>
            </div>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(34500)}
            </div>
            <div className="text-xs text-zinc-500">
              Due on: <strong className="text-zinc-800 dark:text-zinc-200">October 05, 2026</strong>
            </div>
            <div className="pt-2">
              <Link href="/tenant/payments">
                <Button size="sm" variant="primary" className="w-full">
                  Pay via SSLCommerz (bKash/Card)
                </Button>
              </Link>
            </div>
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
