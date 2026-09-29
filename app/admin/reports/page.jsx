"use client";

import React from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

export default function AdminReportsPage() {
  return (
    <DashboardShell
      portal="admin"
      title="Platform Analytics & Reports"
      subtitle="Financial performance, subscription MRR, dispatch metrics, and system audits"
      actions={
        <Button variant="outline" size="md">
          Download PDF Report
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Recurring Revenue (MRR)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(584000)}
            </div>
            <p className="text-xs text-emerald-600 font-semibold">+14.6% vs previous month</p>
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 space-y-1">
              <div className="flex justify-between">
                <span>Starter Tier</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatCurrency(83958)}</span>
              </div>
              <div className="flex justify-between">
                <span>Growth Tier</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatCurrency(339932)}</span>
              </div>
              <div className="flex justify-between">
                <span>Enterprise Tier</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatCurrency(311976)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance & Dispatch Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              98.2%
            </div>
            <p className="text-xs text-emerald-600 font-semibold">Average response time: 42 mins</p>
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 space-y-1">
              <div className="flex justify-between">
                <span>Total Dispatched</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">312 requests</span>
              </div>
              <div className="flex justify-between">
                <span>Resolved & Closed</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">298 requests</span>
              </div>
              <div className="flex justify-between">
                <span>Tenant Satisfaction</span>
                <span className="font-semibold text-amber-500">4.8 / 5.0 ★</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System & Database Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-extrabold text-emerald-500">
              100%
            </div>
            <p className="text-xs text-zinc-500">MongoDB Replica Set & API operational</p>
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 space-y-1">
              <div className="flex justify-between">
                <span>API Latency</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">34ms</span>
              </div>
              <div className="flex justify-between">
                <span>SSLCommerz Gateway</span>
                <span className="font-semibold text-emerald-500">Connected</span>
              </div>
              <div className="flex justify-between">
                <span>Active User Sessions</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">419 online</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
