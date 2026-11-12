"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function getLocalDateBoundary(value, nextDay = false) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day + Number(nextDay)).toISOString();
}

export default function ProviderJobHistoryPage() {
  const { role } = useAuth();
  const [filters, setFilters] = useState({ property: "", from: "", to: "" });
  const [data, setData] = useState({ jobs: [], properties: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadHistory = useCallback(async (nextFilters) => {
    setLoading(true);
    setError("");
    setMessage("");
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (!value) return;
      if (key === "from") params.set(key, getLocalDateBoundary(value));
      else if (key === "to") params.set(key, getLocalDateBoundary(value, true));
      else params.set(key, value);
    });

    try {
      const response = await fetch(`/api/provider-job-history?${params}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load provider job history.");
      setData(result);
      setMessage(`${result.jobs.length} completed job${result.jobs.length === 1 ? "" : "s"} found.`);
    } catch (loadError) {
      setData({ jobs: [], properties: [] });
      setError(loadError.message || "Failed to load provider job history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory({ property: "", from: "", to: "" });
  }, [loadHistory]);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function submitFilters(event) {
    event.preventDefault();
    loadHistory(filters);
  }

  return (
    <DashboardShell
      portal={role === "admin" ? "admin" : "owner"}
      title="Provider Job History"
      subtitle="Review completed and closed service requests."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filter job history</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitFilters} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1 text-sm font-medium">
                <span>Property</span>
                <select
                  name="property"
                  value={filters.property}
                  onChange={updateFilter}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="">All properties</option>
                  {data.properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-sm font-medium">
                <span>From</span>
                <input
                  type="date"
                  name="from"
                  value={filters.from}
                  onChange={updateFilter}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </label>
              <label className="space-y-1 text-sm font-medium">
                <span>To</span>
                <input
                  type="date"
                  name="to"
                  value={filters.to}
                  onChange={updateFilter}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Loading…" : "Apply filters"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div aria-live="polite" role={error ? "alert" : "status"} className="text-sm">
          {error ? (
            <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          ) : message ? (
            <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              {message}
            </p>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Completed requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-sm text-zinc-500">Loading job history…</p>
            ) : error ? (
              <p className="p-6 text-sm text-zinc-500">Job history could not be displayed.</p>
            ) : data.jobs.length === 0 ? (
              <p className="p-6 text-sm text-zinc-500">No completed provider jobs match these filters.</p>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60">
                      <tr>
                        <th scope="col" className="px-5 py-3">Issue / property</th>
                        <th scope="col" className="px-5 py-3">Completed</th>
                        <th scope="col" className="px-5 py-3">Tenant / unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {data.jobs.map((job) => (
                        <tr key={job.id} className="align-top">
                          <td className="px-5 py-4">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">{job.issue}</p>
                            <p className="mt-1 text-xs text-zinc-500">{job.property}</p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-zinc-600 dark:text-zinc-400">{formatDate(job.completionDate)}</td>
                          <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{job.tenant}<br />{job.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-3 p-4 md:hidden">
                  {data.jobs.map((job) => (
                    <article key={job.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                      <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{job.issue}</h2>
                      <p className="mt-1 text-sm text-zinc-500">{job.property}</p>
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div><dt className="text-xs text-zinc-500">Completed</dt><dd>{formatDate(job.completionDate)}</dd></div>
                        <div><dt className="text-xs text-zinc-500">Tenant / unit</dt><dd>{job.tenant}, {job.unit}</dd></div>
                      </dl>
                    </article>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
