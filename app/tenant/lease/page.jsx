"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

function formatDate(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function leaseDuration(start, end) {
  if (!start || !end) return "";
  const first = new Date(start);
  const last = new Date(end);
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime()) || last < first) return "";
  const months = Math.max(1, (last.getFullYear() - first.getFullYear()) * 12 + last.getMonth() - first.getMonth());
  return `${months} month${months === 1 ? "" : "s"}`;
}

export default function TenantLeasePage() {
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/tenant/lease", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load your lease.");
        if (!data.lease) throw new Error("The server returned invalid lease details.");
        if (active) setLease(data.lease);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Failed to load your lease.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const duration = lease ? leaseDuration(lease.startDate, lease.endDate) : "";

  return (
    <DashboardShell
      portal="tenant"
      title="My Lease Agreement"
      subtitle="Review your lease terms, rent, deposit, and landlord details."
    >
      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
      {loading ? (
        <p role="status" className="py-12 text-center text-sm text-zinc-500">Loading lease details...</p>
      ) : lease && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>{lease.id ? `Tenancy Contract #${lease.id}` : "Tenancy Contract"}</CardTitle>
                <Badge variant={lease.status === "Active" ? "success" : "warning"}>{lease.status}</Badge>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {lease.propertyName || "Property not assigned"}{lease.unit ? ` · ${lease.unit}` : ""}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  <span className="text-zinc-500">Monthly Rent</span>
                  <div className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-50">{formatCurrency(lease.rent)}</div>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  <span className="text-zinc-500">Security Deposit</span>
                  <div className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-50">{formatCurrency(lease.deposit)}</div>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  <span className="text-zinc-500">Billing Cycle</span>
                  <div className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-50">{lease.billingCycle}</div>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  <span className="text-zinc-500">Lease Start</span>
                  <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">{formatDate(lease.startDate)}</div>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  <span className="text-zinc-500">Lease End</span>
                  <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">{formatDate(lease.endDate)}</div>
                </div>
                {duration && (
                  <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                    <span className="text-zinc-500">Duration</span>
                    <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">{duration}</div>
                  </div>
                )}
              </div>
              <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Key Terms &amp; Clauses</h2>
                {lease.terms.length ? (
                  <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
                    {lease.terms.map((term, index) => <li key={`${index}-${term}`}>{term}</li>)}
                  </ul>
                ) : (
                  <p>No additional lease terms have been recorded.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Landlord &amp; Property Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-zinc-500">Landlord / Owner</span>
                <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">{lease.owner?.name || "Not recorded"}</div>
                {lease.owner?.email && <div className="break-all text-zinc-500">{lease.owner.email}</div>}
                {lease.owner?.phone && <div className="text-zinc-500">{lease.owner.phone}</div>}
              </div>
              <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <span className="text-zinc-500">Property</span>
                <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">{lease.propertyName || "Not assigned"}</div>
                <div className="text-zinc-500">{lease.propertyAddress || "Address not recorded"}</div>
                {lease.unit && <div className="text-zinc-500">Unit {lease.unit}</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
