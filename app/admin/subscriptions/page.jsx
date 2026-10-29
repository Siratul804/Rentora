"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/tables/DataTable";

export default function AdminSubscriptionsPage() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/owner")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load owner accounts.");
        if (!Array.isArray(data.owners)) throw new Error("The server returned invalid owner account data.");
        return data.owners;
      })
      .then((data) => {
        if (active) setOwners(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Failed to load owner accounts.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => ({
    total: owners.length,
    paid: owners.filter((owner) => owner.paymentStatus === "Paid").length,
    unpaid: owners.filter((owner) => owner.paymentStatus !== "Paid").length,
  }), [owners]);

  const columns = [
    {
      header: "Owner",
      accessor: (owner) => (
        <div>
          <div className="font-medium text-zinc-900 dark:text-zinc-100">{owner.name || "Unnamed owner"}</div>
          <div className="text-xs text-zinc-500">{owner.email || "—"}</div>
        </div>
      ),
    },
    {
      header: "Properties / Units",
      accessor: (owner) => `${owner.properties} Properties · ${owner.units} Units`,
    },
    {
      header: "Payment",
      accessor: (owner) => (
        <Badge variant={owner.paymentStatus === "Paid" ? "success" : "warning"}>
          {owner.paymentStatus || "Unknown"}
        </Badge>
      ),
    },
    {
      header: "Approval",
      accessor: (owner) => (
        <Badge variant={owner.status === "Approved" ? "success" : owner.status === "Rejected" ? "danger" : "warning"}>
          {owner.status || "Pending"}
        </Badge>
      ),
    },
  ];

  return (
    <DashboardShell
      portal="admin"
      title="Owner Subscriptions & Billing"
      subtitle="Current payment and approval status for registered owner accounts"
    >
      {error && <p role="alert" className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
      {loading ? (
        <p role="status" className="py-12 text-center text-sm text-zinc-500">Loading owner billing records...</p>
      ) : !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Registered Owners", value: counts.total },
              { label: "Paid Accounts", value: counts.paid },
              { label: "Unpaid / Unspecified", value: counts.unpaid },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="p-5">
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{item.value}</div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{item.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle>Owner Billing Records</CardTitle></CardHeader>
            <CardContent className="p-0">
              {owners.length ? <DataTable columns={columns} data={owners} /> : <p className="p-8 text-center text-sm text-zinc-500">No owner billing records found.</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
