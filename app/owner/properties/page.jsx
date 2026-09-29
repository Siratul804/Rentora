"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

const PROPERTIES = [
  {
    id: "prop-1",
    name: "Green Horizon Residency",
    address: "House 42, Road 11, Dhanmondi, Dhaka",
    unitsCount: 8,
    occupiedUnits: 7,
    monthlyYield: 256000,
    type: "Residential Multi-family",
    status: "Active",
  },
  {
    id: "prop-2",
    name: "Lakeview Terrace Apartments",
    address: "Plot 18, Block D, Bashundhara R/A, Dhaka",
    unitsCount: 10,
    occupiedUnits: 9,
    monthlyYield: 320000,
    type: "Luxury Apartment Complex",
    status: "Active",
  },
  {
    id: "prop-3",
    name: "Gulshan Heights Studio Tower",
    address: "Avenue 4, Gulshan-2, Dhaka",
    unitsCount: 6,
    occupiedUnits: 6,
    monthlyYield: 270000,
    type: "Commercial & Studio Suites",
    status: "Active",
  },
];

export default function OwnerPropertiesPage() {
  const [selectedProperty, setSelectedProperty] = useState(PROPERTIES[0]);

  return (
    <DashboardShell
      portal="owner"
      title="Properties & Units"
      subtitle="Manage your real estate portfolio, unit inventory, and rent allocations"
      actions={
        <Button variant="primary" size="md">
          + Add New Property
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PROPERTIES.map((prop) => {
          const occupancy = Math.round((prop.occupiedUnits / prop.unitsCount) * 100);
          return (
            <Card
              key={prop.id}
              className={`cursor-pointer transition-all hover:border-emerald-500/50 ${
                selectedProperty.id === prop.id
                  ? "border-emerald-500 ring-1 ring-emerald-500/50 shadow-md"
                  : ""
              }`}
              onClick={() => setSelectedProperty(prop)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="success" size="sm">
                    {prop.status}
                  </Badge>
                  <span className="text-xs font-semibold text-zinc-500">
                    {prop.occupiedUnits}/{prop.unitsCount} Units Occupied
                  </span>
                </div>
                <CardTitle className="mt-2 text-base">{prop.name}</CardTitle>
                <p className="text-xs text-zinc-500 truncate">{prop.address}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Occupancy</span>
                  <span className="font-semibold text-emerald-600">{occupancy}%</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{ width: `${occupancy}%` }}
                  />
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Monthly Yield</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(prop.monthlyYield)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Property Unit Breakdown */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{selectedProperty.name} — Unit Directory</CardTitle>
            <p className="text-xs text-zinc-500 mt-0.5">{selectedProperty.address}</p>
          </div>
          <Button size="sm" variant="outline">
            + Add Unit to Building
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 uppercase font-semibold border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3">Unit #</th>
                  <th className="px-5 py-3">Bed / Bath</th>
                  <th className="px-5 py-3">Current Tenant</th>
                  <th className="px-5 py-3">Monthly Rent</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {[
                  { unit: "Unit 1A", beds: "3 Bed / 2 Bath", tenant: "Tanvir Rahman", rent: 25000, status: "Occupied" },
                  { unit: "Unit 2A", beds: "3 Bed / 2 Bath", tenant: "Nabila Tabassum", rent: 28000, status: "Occupied" },
                  { unit: "Unit 3B", beds: "2 Bed / 1 Bath", tenant: "Vacant (Available)", rent: 22000, status: "Vacant" },
                  { unit: "Unit 4B", beds: "3 Bed / 3 Bath", tenant: "Farhan Ahmed", rent: 32000, status: "Occupied" },
                ].map((u, i) => (
                  <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="px-5 py-3.5 font-bold text-zinc-900 dark:text-zinc-100">{u.unit}</td>
                    <td className="px-5 py-3.5 text-zinc-500">{u.beds}</td>
                    <td className="px-5 py-3.5 font-medium">{u.tenant}</td>
                    <td className="px-5 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(u.rent)}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={u.status === "Occupied" ? "success" : "neutral"} size="sm">
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Button size="sm" variant="ghost">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
