"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable } from "@/components/tables/DataTable";

const TENANTS_DATA = [
  { id: "T-1", name: "Farhan Ahmed", email: "farhan@gmail.com", phone: "+880 1711-123456", property: "Green Horizon Residency", unit: "Unit 4B", leaseEnd: "2027-02-28", rentStatus: "Paid" },
  { id: "T-2", name: "Nabila Tabassum", email: "nabila.t@yahoo.com", phone: "+880 1812-345678", property: "Lakeview Terrace", unit: "Unit 2A", leaseEnd: "2026-11-30", rentStatus: "Pending" },
  { id: "T-3", name: "Tanvir Rahman", email: "tanvir.r@gmail.com", phone: "+880 1913-987654", property: "Green Horizon Residency", unit: "Unit 1A", leaseEnd: "2026-12-31", rentStatus: "Overdue" },
  { id: "T-4", name: "Sabbir Hossain", email: "sabbir.h@outlook.com", phone: "+880 1614-234567", property: "Gulshan Heights", unit: "Apt 7C", leaseEnd: "2027-04-15", rentStatus: "Paid" },
];

export default function OwnerTenantsPage() {
  const [search, setSearch] = useState("");

  const filtered = TENANTS_DATA.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.unit.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Tenant",
      accessor: (row) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</div>
          <div className="text-xs text-zinc-400">{row.email}</div>
        </div>
      ),
    },
    {
      header: "Assigned Unit",
      accessor: (row) => (
        <div>
          <div className="font-medium text-zinc-800 dark:text-zinc-200">{row.unit}</div>
          <div className="text-[11px] text-zinc-400">{row.property}</div>
        </div>
      ),
    },
    {
      header: "Phone",
      accessor: "phone",
    },
    {
      header: "Lease Expiry",
      accessor: "leaseEnd",
    },
    {
      header: "Rent Status",
      accessor: (row) => (
        <Badge
          variant={row.rentStatus === "Paid" ? "success" : row.rentStatus === "Overdue" ? "danger" : "warning"}
          size="sm"
        >
          {row.rentStatus}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: () => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            Message
          </Button>
          <Button size="sm" variant="ghost">
            View Lease
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      portal="owner"
      title="Tenants Directory"
      subtitle="View tenant contacts, assigned units, lease expiration dates, and payment health"
      actions={
        <Button variant="primary" size="md">
          + Onboard New Tenant
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Active Tenants ({filtered.length})</CardTitle>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search tenant or unit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={filtered} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
