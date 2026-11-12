"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/tables/DataTable";

export default function AdminServiceProvidersPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/provider-job-history?includeAll=true")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load provider work records.");
        if (!Array.isArray(data.jobs)) throw new Error("The server returned invalid provider job data.");
        return data.jobs;
      })
      .then((data) => {
        if (active) setJobs(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Failed to load provider work records.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filters = useMemo(() => [
    "All",
    ...new Set(jobs.map((job) => job.category || "Other").filter(Boolean)),
  ], [jobs]);
  const filtered = selectedFilter === "All"
    ? jobs
    : jobs.filter((job) => (job.category || "Other") === selectedFilter);

  const columns = [
    {
      header: "Maintenance Request",
      accessor: (row) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.issue}</div>
          <div className="text-xs text-zinc-500">{row.category}</div>
        </div>
      ),
    },
    { header: "Property / Unit", accessor: (row) => [row.property, row.unit].filter(Boolean).join(" · ") || "—" },
    {
      header: "Status",
      accessor: (row) => (
        <Badge variant={["Resolved", "Closed"].includes(row.status) ? "success" : "warning"} size="sm">
          {row.status || "Pending"}
        </Badge>
      ),
    },
    {
      header: "Last Updated",
      accessor: (row) => row.completionDate ? new Date(row.completionDate).toLocaleDateString() : "—",
    },
  ];

  return (
    <DashboardShell
      portal="admin"
      title="Service Providers & Dispatch Fleet"
      subtitle="View maintenance requests, properties, and request status"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Maintenance Assignments ({filtered.length})</CardTitle>

          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <p role="alert" className="p-5 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          ) : loading ? (
            <p role="status" className="p-8 text-center text-sm text-zinc-500">Loading maintenance assignments...</p>
          ) : filtered.length ? (
            <DataTable columns={columns} data={filtered} />
          ) : (
            <p className="p-8 text-center text-sm text-zinc-500">No maintenance requests found for this category.</p>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
