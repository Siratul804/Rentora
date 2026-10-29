"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/tables/DataTable";

async function fetchData(url) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || `Failed to load ${url}.`);
  return data;
}

export default function AdminDashboardPage() {
  const [owners, setOwners] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([fetchData("/api/admin/owner"), fetchData("/api/provider-job-history")])
      .then(([ownerData, jobData]) => {
        if (!active) return;
        if (!Array.isArray(ownerData.owners) || !Array.isArray(jobData.jobs)) {
          throw new Error("The server returned invalid dashboard data.");
        }
        setOwners(ownerData.owners);
        setJobs(jobData.jobs);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Failed to load dashboard data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => [
    { id: "owners", label: "Registered Owners", value: owners.length, icon: "🏢" },
    { id: "paid", label: "Paid Owner Accounts", value: owners.filter((owner) => owner.paymentStatus === "Paid").length, icon: "💳" },
    { id: "properties", label: "Listed Properties", value: owners.reduce((total, owner) => total + (Number(owner.properties) || 0), 0), icon: "🏠" },
    { id: "jobs", label: "Completed Provider Jobs", value: jobs.length, icon: "🛠️" },
  ], [owners, jobs]);

  const columns = [
    {
      header: "Landlord / Owner",
      accessor: (row) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.name || "Unnamed owner"}</div>
          <div className="text-xs text-zinc-400">{row.email || "—"}</div>
        </div>
      ),
    },
    {
      header: "Account Payment",
      accessor: (row) => (
        <Badge variant={row.paymentStatus === "Paid" ? "success" : "warning"}>
          {row.paymentStatus || "Unknown"}
        </Badge>
      ),
    },
    {
      header: "Portfolio",
      accessor: (row) => (
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {row.properties} Properties · {row.units} Units
        </span>
      ),
    },
    {
      header: "Approval",
      accessor: (row) => (
        <Badge variant={row.status === "Approved" ? "success" : row.status === "Rejected" ? "danger" : "warning"}>
          {row.status || "Pending"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: () => <Link href="/admin/owners"><Button size="sm" variant="outline">Manage</Button></Link>,
    },
  ];

  return (
    <DashboardShell
      portal="admin"
      title="Platform Overview"
      subtitle="Current owner accounts, portfolio records, and completed provider work"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/owners"><Button variant="outline" size="sm">All Owners</Button></Link>
          <Link href="/admin/subscriptions"><Button variant="primary" size="sm">Billing &amp; Plans</Button></Link>
        </div>
      }
    >
      <div className="space-y-6">
        {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
        {loading ? (
          <p role="status" className="py-8 text-center text-sm text-zinc-500">Loading platform records...</p>
        ) : !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card key={stat.id}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl">{stat.icon}</div>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{stat.value}</div>
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">{stat.label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Owner Registrations</CardTitle>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Latest owner accounts from the platform database</p>
                    </div>
                    <Link href="/admin/owners"><Button variant="ghost" size="sm" className="text-xs">View All Owners →</Button></Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {owners.length ? <DataTable columns={columns} data={owners.slice(0, 5)} className="border-0 rounded-none shadow-none" /> : <p className="p-8 text-center text-sm text-zinc-500">No owner accounts found.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Completed Work</CardTitle>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Recent recorded provider jobs</p>
                    </div>
                    <Link href="/admin/service-providers"><Button variant="ghost" size="sm" className="text-xs">View All →</Button></Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {jobs.slice(0, 4).map((job) => (
                    <div key={job.id} className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 block">{job.issue}</span>
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">{job.category} · {new Date(job.completionDate).toLocaleDateString()}</span>
                        </div>
                        <Badge variant="success" size="sm">Completed</Badge>
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2">{[job.property, job.unit].filter(Boolean).join(" · ")}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex justify-between gap-2">
                        <span>Provider</span><span className="font-medium text-zinc-800 dark:text-zinc-200">{job.provider}</span>
                      </div>
                    </div>
                  ))}
                  {jobs.length === 0 && <p className="py-6 text-center text-sm text-zinc-500">No completed provider jobs found.</p>}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
