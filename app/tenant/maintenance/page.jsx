"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/forms/FormField";

const MY_REQUESTS = [
  {
    id: "M-301",
    category: "Plumbing",
    title: "Master bathroom faucet leaking and low pressure",
    submittedAt: "2026-09-28",
    status: "Dispatched",
    assignedTech: "Kamal Plumbing Co. (Mr. Kamal - +880 1711-889900)",
    eta: "Today, 3:30 PM",
  },
  {
    id: "M-289",
    category: "Electrical",
    title: "Balcony light switch replacement",
    submittedAt: "2026-08-15",
    status: "Resolved",
    assignedTech: "VoltMasters BD",
    eta: "Completed",
  },
];

export default function TenantMaintenancePage() {
  const [requests, setRequests] = useState(MY_REQUESTS);
  const [category, setCategory] = useState("Plumbing");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;

    const newReq = {
      id: `M-${Math.floor(100 + Math.random() * 900)}`,
      category,
      title,
      submittedAt: "Just now",
      status: "Pending",
      assignedTech: "Dispatching technician...",
      eta: "Within 2 hours",
    };

    setRequests([newReq, ...requests]);
    setTitle("");
    setDescription("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <DashboardShell
      portal="tenant"
      title="Maintenance & Repairs"
      subtitle="Report an issue in your unit for instant dispatch of certified plumbers, electricians & technicians"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submit Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Submit Service Request</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold">
                ✓ Request submitted! Landlord and dispatch team notified.
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Trade Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { value: "Plumbing", label: "🚰 Plumbing (Leaks, Taps, Drainage)" },
                  { value: "Electrical", label: "⚡ Electrical (Wiring, Switches, Breakers)" },
                  { value: "HVAC", label: "❄️ HVAC & Air Conditioning" },
                  { value: "Carpentry", label: "🔨 Carpentry & Locks" },
                  { value: "Appliance", label: "🔌 Appliance Repair" },
                ]}
              />

              <Input
                label="Issue Summary"
                placeholder="e.g. Kitchen sink drain clogged"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Detailed Notes / Preferred Time
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe location in unit, best time for technician visit..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full">
                Submit Ticket
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Requests Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My Maintenance Requests ({requests.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-500">{req.id}</span>
                    <Badge variant="purple" size="sm">{req.category}</Badge>
                  </div>
                  <Badge
                    variant={req.status === "Resolved" ? "success" : req.status === "Dispatched" ? "info" : "warning"}
                    size="sm"
                  >
                    {req.status}
                  </Badge>
                </div>

                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  {req.title}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-500 pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                  <div>
                    <span>Submitted: </span>
                    <strong className="text-zinc-700 dark:text-zinc-300">{req.submittedAt}</strong>
                  </div>
                  <div>
                    <span>Assigned: </span>
                    <strong className="text-zinc-700 dark:text-zinc-300">{req.assignedTech}</strong>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
