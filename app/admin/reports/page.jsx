"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

function MetricCard({ title, value, detail }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">{value}</div>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{detail}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/reports", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load platform reports.");
        if (!data.report) throw new Error("The server returned invalid report data.");
        if (active) setReport(data.report);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Failed to load platform reports.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function downloadReport() {
    setDownloading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/reports", { method: "POST" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to download the report.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "rentora-platform-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.message || "Failed to download the report.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <DashboardShell
      portal="admin"
      title="Platform Analytics & Reports"
      subtitle="Current financial, property, maintenance, and audit records"
      actions={
        <Button variant="outline" size="md" className="dark:border-white/15 dark:bg-white/10 dark:text-zinc-100 dark:hover:bg-white/15" disabled={loading || !report || downloading} onClick={downloadReport}>
          {downloading ? "Preparing PDF..." : "Download PDF Report"}
        </Button>
      }
    >
      {error && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
      {loading ? (
        <p role="status" className="py-12 text-center text-sm text-zinc-500">Loading live platform reports...</p>
      ) : report && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <MetricCard title="Platform Accounts" value={report.owners} detail={`${report.tenants} tenant accounts`} />
            <MetricCard title="Property Portfolio" value={report.properties} detail={`${report.units} total units`} />
            <MetricCard title="Owner Registration Revenue" value={formatCurrency(report.ownerRegistrationRevenue)} detail={`${report.paidOwnerAccounts} paid owner accounts`} />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <MetricCard title="Maintenance Requests" value={report.maintenanceRequests} detail={`${report.assignedRequests} assigned to a provider`} />
            <MetricCard title="Completed Work" value={report.completedRequests} detail={report.averageRating === null ? "No completed work has been rated" : `Average rating: ${Number(report.averageRating).toFixed(1)} / 5`} />
            <MetricCard title="Pending Work & Audits" value={report.pendingRequests} detail={`${report.auditEventsLast30Days} audit events in the last 30 days`} />
          </div>
          <p className="text-xs text-zinc-500">
            Report data refreshed {new Date(report.generatedAt).toLocaleString()}.
          </p>
        </div>
      )}
    </DashboardShell>
  );
}
