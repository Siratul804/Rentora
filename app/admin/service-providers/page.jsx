"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/tables/DataTable";

const PROVIDERS_DATA = [
  { id: "SP-101", name: "Kamal Plumbing Co.", service: "Plumbing", city: "Dhaka (Dhanmondi / Mirpur)", rating: "4.9 ★", jobsDone: 142, status: "Active", contact: "+880 1711-889900" },
  { id: "SP-102", name: "VoltMasters Electrical", service: "Electrical", city: "Dhaka (Gulshan / Banani)", rating: "4.8 ★", jobsDone: 98, status: "Active", contact: "+880 1812-776655" },
  { id: "SP-103", name: "CoolBreeze HVAC Tech", service: "HVAC & AC", city: "Dhaka (Uttara / Bashundhara)", rating: "4.7 ★", jobsDone: 76, status: "Active", contact: "+880 1913-665544" },
  { id: "SP-104", name: "LockSmith 24/7 BD", service: "Carpentry & Locks", city: "Dhaka & Chittagong", rating: "4.6 ★", jobsDone: 34, status: "Active", contact: "+880 1614-554433" },
  { id: "SP-105", name: "Rapid Pipe Repair", service: "Plumbing", city: "Sylhet", rating: "4.2 ★", jobsDone: 12, status: "Under Review", contact: "+880 1515-443322" },
];

export default function AdminServiceProvidersPage() {
  const [selectedFilter, setSelectedFilter] = useState("All");

  const filtered = selectedFilter === "All"
    ? PROVIDERS_DATA
    : PROVIDERS_DATA.filter(p => p.service === selectedFilter);

  const columns = [
    {
      header: "Provider Name",
      accessor: (row) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</div>
          <div className="text-xs text-zinc-400">ID: {row.id}</div>
        </div>
      ),
    },
    {
      header: "Trade Specialty",
      accessor: (row) => (
        <Badge variant="purple" size="sm">
          {row.service}
        </Badge>
      ),
    },
    {
      header: "Coverage Zone",
      accessor: "city",
    },
    {
      header: "Rating",
      accessor: (row) => (
        <span className="text-xs font-semibold text-amber-500">
          {row.rating} ({row.jobsDone} jobs)
        </span>
      ),
    },
    {
      header: "Contact",
      accessor: "contact",
    },
    {
      header: "Status",
      accessor: (row) => (
        <Badge variant={row.status === "Active" ? "success" : "warning"} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: () => (
        <Button size="sm" variant="outline">
          View Profile
        </Button>
      ),
    },
  ];

  return (
    <DashboardShell
      portal="admin"
      title="Service Providers & Dispatch Fleet"
      subtitle="Oversee certified technicians, plumbers, and electricians available for dispatch"
      actions={
        <Button variant="primary" size="md">
          + Onboard New Provider
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Registered Technicians ({filtered.length})</CardTitle>
            <div className="flex items-center gap-2">
              {["All", "Plumbing", "Electrical", "HVAC & AC"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedFilter === cat
                      ? "bg-purple-600 text-white"
                      : "border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
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
