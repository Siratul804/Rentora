"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable } from "@/components/tables/DataTable";

const OWNERS_DATA = [
  { id: "1", name: "Siratul Islam", email: "siratul@rentora.com", phone: "+880 1711-223344", properties: 6, units: 24, plan: "Enterprise", status: "Active", joined: "2026-01-15" },
  { id: "2", name: "Ahmed Zubair", email: "zubair.realty@gmail.com", phone: "+880 1812-998877", properties: 4, units: 16, plan: "Growth", status: "Active", joined: "2026-02-01" },
  { id: "3", name: "Mariam Sultana", email: "mariam.props@outlook.com", phone: "+880 1913-445566", properties: 1, units: 4, plan: "Starter", status: "Pending Verification", joined: "2026-03-10" },
  { id: "4", name: "Rashid Chowdhury", email: "rashid@ctgproperties.com", phone: "+880 1614-778899", properties: 3, units: 12, plan: "Growth", status: "Active", joined: "2026-02-20" },
  { id: "5", name: "Tanvir Hasan", email: "tanvir.holding@gmail.com", phone: "+880 1515-332211", properties: 2, units: 8, plan: "Starter", status: "Suspended", joined: "2025-11-05" },
];

export default function AdminOwnersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOwners = OWNERS_DATA.filter((o) =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: "Landlord / Owner",
      accessor: (row) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</div>
          <div className="text-xs text-zinc-400">{row.email}</div>
        </div>
      ),
    },
    {
      header: "Phone",
      accessor: "phone",
    },
    {
      header: "Portfolio",
      accessor: (row) => (
        <span className="text-xs font-medium">
          {row.properties} Properties ({row.units} units)
        </span>
      ),
    },
    {
      header: "Plan",
      accessor: (row) => (
        <Badge variant={row.plan === "Enterprise" ? "purple" : row.plan === "Growth" ? "info" : "neutral"}>
          {row.plan}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <Badge variant={row.status === "Active" ? "success" : row.status === "Suspended" ? "danger" : "warning"}>
          {row.status}
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
          <Button size="sm" variant={row.status === "Active" ? "ghost" : "primary"}>
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
            <CardTitle>All Landlords ({filteredOwners.length})</CardTitle>
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
          <DataTable columns={columns} data={filteredOwners} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
