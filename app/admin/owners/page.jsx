"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable } from "@/components/tables/DataTable";

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get owners from Admin API
  useEffect(() => {
  fetch("/api/admin/owner")
    .then((res) => res.json())
    .then((data) => {
      console.log("OWNER API DATA:", data);

      if (data.success) {
        setOwners(data.owners);
      } else {
        setError(data.message || "Failed to load owners");
      }
    })
    .catch((err) => {
      console.error("OWNER API ERROR:", err);
      setError("Failed to load owners");
    })
    .finally(() => {
      setLoading(false);
    });
}, []);

  // Search owners
  const filteredOwners = owners.filter((owner) => {
    const name = owner.name?.toLowerCase() || "";
    const email = owner.email?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    return name.includes(search) || email.includes(search);
  });

  const columns = [
    {
      header: "Landlord / Owner",
      accessor: (row) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
            {row.name}
          </div>

          <div className="text-xs text-zinc-400">
            {row.email}
          </div>
        </div>
      ),
    },

    {
      header: "Phone",
      accessor: (row) => row.phone || "—",
    },

    {
      header: "Portfolio",
      accessor: (row) => (
        <span className="text-xs font-medium">
          {row.properties ?? "—"} Properties
          {row.units !== undefined ? ` (${row.units} units)` : ""}
        </span>
      ),
    },

    {
      header: "Plan",
      accessor: (row) => (
        <Badge
          variant={
            row.plan === "Enterprise"
              ? "purple"
              : row.plan === "Growth"
                ? "info"
                : "neutral"
          }
        >
          {row.plan || "—"}
        </Badge>
      ),
    },

    {
      header: "Status",
      accessor: (row) => (
        <Badge
          variant={
            row.status === "Active"
              ? "success"
              : row.status === "Suspended"
                ? "danger"
                : "warning"
          }
        >
          {row.status || "—"}
        </Badge>
      ),
    },

    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            Inspect
          </Button>

          <Button
            size="sm"
            variant={row.status === "Active" ? "ghost" : "primary"}
          >
            {row.status === "Active" ? "Manage" : "Approve"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      portal="admin"
      title="Property Owners Directory"
      subtitle="Manage registered landlords, oversee property portfolios, and verify accounts"
      actions={
        <Button variant="primary" size="md">
          + Add New Owner
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>
              All Landlords ({filteredOwners.length})
            </CardTitle>

            <div className="w-full sm:w-64">
              <Input
                placeholder="Search owner name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-zinc-500">
              Loading owners...
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">
              {error}
            </div>
          ) : filteredOwners.length === 0 ? (
            <div className="p-6 text-center text-zinc-500">
              No owners found.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredOwners}
            />
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}