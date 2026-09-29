"use client";

import React from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

export default function OwnerReportsPage() {
  return (
    <DashboardShell
      portal="owner"
      title="Financial & Occupancy Reports"
      subtitle="Comprehensive revenue statements, unit vacancy metrics, and operating expenses"
      actions={
        <Button variant="outline" size="md">
          Export Tax Statement (PDF)
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Year-to-Date Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(3465000)}
            </div>
            <p className="text-xs text-emerald-600 font-semibold">+8.4% above forecast</p>
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 space-y-1">
              <div className="flex justify-between">
                <span>Green Horizon Residency</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatCurrency(1536000)}</span>
              </div>
              <div className="flex justify-between">
                <span>Lakeview Terrace</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatCurrency(1120000)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gulshan Heights</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatCurrency(809000)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance & Dispatch Costs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(124500)}
            </div>
            <p className="text-xs text-zinc-500">3.6% of total rental income</p>
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 space-y-1">
              <div className="flex justify-between">
                <span>Plumbing Dispatches</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatCurrency(48000)}</span>
              </div>
              <div className="flex justify-between">
                <span>Electrical Services</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatCurrency(36500)}</span>
              </div>
              <div className="flex justify-between">
                <span>HVAC Maintenance</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatCurrency(40000)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Occupancy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-extrabold text-emerald-600">
              91.6%
            </div>
            <p className="text-xs text-zinc-500">22 of 24 units occupied</p>
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 space-y-1">
              <div className="flex justify-between">
                <span>Average Tenancy Length</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">18.4 months</span>
              </div>
              <div className="flex justify-between">
                <span>On-Time Payment Rate</span>
                <span className="font-semibold text-emerald-600">94.2%</span>
              </div>
              <div className="flex justify-between">
                <span>Upcoming Leases Expiring</span>
                <span className="font-semibold text-amber-500">2 in next 60 days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
