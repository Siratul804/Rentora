"use client";

import React, { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/forms/FormField";

const mapRequest = (request) => ({
  id: request.id,
  category: request.category,
  title: request.title,
  submittedAt: request.createdAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(request.createdAt))
    : "—",
  status: request.status,
  assignedTech: request.assignedTo || "Unassigned",
});

export default function TenantMaintenancePage() {
  const [requests, setRequests] = useState([]);
  const [category, setCategory] = useState("Plumbing");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/tenant/maintenance", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load your maintenance requests.");
      setRequests((data.requests || []).map(mapRequest));
    } catch (loadError) {
      setError(loadError.message || "Failed to load your maintenance requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/tenant/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, description }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit your service request.");
      setRequests((current) => [mapRequest(data.request), ...current]);
      setTitle("");
      setDescription("");
      setSuccess("Request submitted. Your property owner can now see it.");
    } catch (submitError) {
      setError(submitError.message || "Failed to submit your service request.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for Glass Status Badges
  const renderGlassStatusBadge = (status) => {
    if (status === "Resolved") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(16,185,129,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          Resolved
        </span>
      );
    }
    if (status === "Dispatched") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(14,165,233,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse mr-1.5" />
          Dispatched
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.15)]">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
        {status || "Pending"}
      </span>
    );
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Ambient Glowing Lights for Glassmorphism */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[130px]" />
        <div className="absolute top-1/2 right-12 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-[140px]" />
      </div>

      <DashboardShell
        portal="tenant"
        title="Maintenance & Repairs"
        subtitle="Report an issue in your unit for instant dispatch of certified plumbers, electricians & technicians"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ========================================== */}
          {/* 1. SUBMIT FORM (FROSTED GLASS CARD)       */}
          {/* ========================================== */}
          <div className="lg:col-span-1 rounded-3xl p-6 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-[0_12px_35px_rgb(0,0,0,0.06)] dark:shadow-[0_12px_35px_rgb(0,0,0,0.25)] h-fit transition-all duration-300">
            <div className="pb-4 border-b border-zinc-200/60 dark:border-white/10 mb-5">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Submit Service Request</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Dispatch certified repair technicians
              </p>
            </div>

            {success && (
              <div className="p-3.5 mb-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold backdrop-blur-md shadow-lg shadow-emerald-500/10 animate-fadeIn flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{success}</span>
              </div>
            )}
            {error && <p role="alert" className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-200">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
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
              </div>

              <div className="space-y-1.5">
                <Input
                  label="Issue Summary"
                  placeholder="e.g. Kitchen sink drain clogged"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Detailed Notes / Preferred Time
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe location in unit, best time for technician visit..."
                  className="w-full px-3.5 py-2.5 rounded-2xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Ticket"}
              </button>
            </form>
          </div>

          {/* ========================================== */}
          {/* 2. REQUESTS LIST (FROSTED GLASS CARD)      */}
          {/* ========================================== */}
          <div className="lg:col-span-2 rounded-3xl p-6 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-[0_12px_35px_rgb(0,0,0,0.06)] dark:shadow-[0_12px_35px_rgb(0,0,0,0.25)] transition-all duration-300">
            <div className="pb-4 border-b border-zinc-200/60 dark:border-white/10 mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>My Maintenance Requests</span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {requests.length}
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Real-time status updates and assigned dispatch personnel
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {loading ? (
                <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading your requests…</p>
              ) : requests.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">You have not submitted any maintenance requests.</p>
              ) : requests.map((req) => (
                <div
                  key={req.id}
                  className="group relative overflow-hidden p-5 rounded-2xl border border-white/60 dark:border-white/10 bg-white/50 dark:bg-white/[0.04] backdrop-blur-xl hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-lg bg-zinc-200/50 dark:bg-white/5 border border-zinc-300/40 dark:border-white/10">
                        {req.id}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20 backdrop-blur-sm">
                        {req.category}
                      </span>
                    </div>

                    {renderGlassStatusBadge(req.status)}
                  </div>

                  <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {req.title}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-500 dark:text-zinc-400 pt-3 border-t border-zinc-200/60 dark:border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">Submitted:</span>
                      <strong className="text-zinc-700 dark:text-zinc-300 font-medium">
                        {req.submittedAt}
                      </strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">Assigned:</span>
                      <strong className="text-zinc-700 dark:text-zinc-300 font-medium truncate">
                        {req.assignedTech}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardShell>
    </div>
  );
}