"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function Rating({ value }) {
  return value == null ? (
    <span className="text-zinc-500">Not rated</span>
  ) : (
    <span aria-label={`${value} out of 5 stars`} className="font-semibold text-amber-600 dark:text-amber-400">
      {value} / 5
    </span>
  );
}

export default function ProviderJobHistoryPage() {
  const { role } = useAuth();
  const [filters, setFilters] = useState({ provider: "", property: "", from: "", to: "" });
  const [data, setData] = useState({ jobs: [], providers: [], properties: [], summaries: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadHistory = useCallback(async (nextFilters) => {
    setLoading(true);
    setError("");
    setMessage("");
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    try {
      const response = await fetch(`/api/provider-job-history?${params}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load provider job history.");
      setData(result);
      setMessage(`${result.jobs.length} completed job${result.jobs.length === 1 ? "" : "s"} found.`);
    } catch (loadError) {
      setData({ jobs: [], providers: [], properties: [], summaries: [] });
      setError(loadError.message || "Failed to load provider job history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory({ provider: "", property: "", from: "", to: "" });
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
      subtitle="Review completed service requests, feedback, and provider performance."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filter job history</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitFilters} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <label className="space-y-1 text-sm font-medium">
                <span>Provider</span>
                <select
                  name="provider"
                  value={filters.provider}
                  onChange={updateFilter}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="">All providers</option>
                  {data.providers.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
                </select>
              </label>
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

        {data.summaries.length > 0 && (
          <section aria-label="Provider performance summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.summaries.map((summary) => (
              <Card key={summary.provider}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{summary.provider}</h2>
                    <Badge variant="info" size="sm">{summary.completedJobs} jobs</Badge>
                  </div>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    Average rating:{" "}
                    <strong className="text-zinc-900 dark:text-zinc-100">
                      {summary.averageRating == null ? "Not rated" : `${summary.averageRating.toFixed(1)} / 5`}
                    </strong>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{summary.ratedJobs} rated job{summary.ratedJobs === 1 ? "" : "s"}</p>
                </CardContent>
              </Card>
            ))}
          </section>
        )}

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
                        <th scope="col" className="px-5 py-3">Issue / provider</th>
                        <th scope="col" className="px-5 py-3">Completed</th>
                        <th scope="col" className="px-5 py-3">Tenant / unit</th>
                        <th scope="col" className="px-5 py-3">Rating</th>
                        <th scope="col" className="px-5 py-3">Comments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {data.jobs.map((job) => (
                        <tr key={job.id} className="align-top">
                          <td className="px-5 py-4">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">{job.issue}</p>
                            <p className="mt-1 text-xs text-zinc-500">{job.provider} · {job.property}</p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-zinc-600 dark:text-zinc-400">{formatDate(job.completionDate)}</td>
                          <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{job.tenant}<br />{job.unit}</td>
                          <td className="px-5 py-4"><Rating value={job.rating} /></td>
                          <td className="max-w-xs px-5 py-4 text-zinc-600 dark:text-zinc-400">{job.comment || "No comments"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-3 p-4 md:hidden">
                  {data.jobs.map((job) => (
                    <article key={job.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{job.issue}</h2>
                        <Rating value={job.rating} />
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">{job.provider} · {job.property}</p>
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div><dt className="text-xs text-zinc-500">Completed</dt><dd>{formatDate(job.completionDate)}</dd></div>
                        <div><dt className="text-xs text-zinc-500">Tenant / unit</dt><dd>{job.tenant}, {job.unit}</dd></div>
                      </dl>
                      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{job.comment || "No comments"}</p>
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
