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
    fetch("/api/provider-job-history")
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

  const providers = useMemo(() => {
    const records = new Map();
    jobs.forEach((job) => {
      const current = records.get(job.provider) || {
        name: job.provider,
        jobs: [],
        categories: new Set(),
        properties: new Set(),
        ratingTotal: 0,
        ratedJobs: 0,
      };
      current.jobs.push(job);
      current.categories.add(job.category || "Other");
      if (job.property) current.properties.add(job.property);
      if (Number.isFinite(job.rating)) {
        current.ratingTotal += job.rating;
        current.ratedJobs += 1;
      }
      records.set(job.provider, current);
    });
    return [...records.values()].map((record) => ({
      ...record,
      service: [...record.categories].join(", "),
      city: [...record.properties].join(", ") || "No property recorded",
      jobsDone: record.jobs.length,
      rating: record.ratedJobs ? `${(record.ratingTotal / record.ratedJobs).toFixed(1)} ★` : "Not rated",
    }));
  }, [jobs]);

  const filters = useMemo(() => [
    "All",
    ...new Set(jobs.map((job) => job.category || "Other").filter(Boolean)),
  ], [jobs]);
  const filtered = selectedFilter === "All"
    ? providers
    : providers.filter((provider) => provider.categories.has(selectedFilter));

  const columns = [
    {
      header: "Provider Name",
      accessor: (row) => <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</div>,
    },
    {
      header: "Trade Specialty",
      accessor: (row) => <Badge variant="purple" size="sm">{row.service}</Badge>,
    },
    { header: "Properties Served", accessor: "city" },
    {
      header: "Rating / Completed Jobs",
      accessor: (row) => <span className="text-xs font-semibold text-amber-500">{row.rating} · {row.jobsDone} jobs</span>,
    },
    { header: "Contact", accessor: () => "Not recorded" },
    {
      header: "Record",
      accessor: () => <Badge variant="success" size="sm">Completed work</Badge>,
    },
  ];

  return (
    <DashboardShell
      portal="admin"
      title="Service Providers & Dispatch Fleet"
      subtitle="Providers and ratings are derived from completed maintenance work recorded in the platform"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Providers with Completed Work ({filtered.length})</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {filters.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedFilter(category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedFilter === category
                      ? "bg-purple-600 text-white"
                      : "border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <p role="alert" className="p-5 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          ) : loading ? (
            <p role="status" className="p-8 text-center text-sm text-zinc-500">Loading completed provider work...</p>
          ) : filtered.length ? (
            <DataTable columns={columns} data={filtered} />
          ) : (
            <p className="p-8 text-center text-sm text-zinc-500">No completed provider work found for this category.</p>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
