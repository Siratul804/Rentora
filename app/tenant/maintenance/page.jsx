"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";

const CATEGORIES = ["Plumbing", "Electrical", "HVAC", "Appliance", "Carpentry", "Other"];
const STATUS_TABS = ["All", "Open", "In Progress", "Resolved", "Closed"];

const PRIORITIES = [
  { value: "LOW", label: "Low", color: "text-zinc-400", bg: "bg-zinc-800/40 border-white/10" },
  { value: "MEDIUM", label: "Medium", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { value: "HIGH", label: "High", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { value: "URGENT", label: "Urgent", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30 font-bold" },
];

export default function TenantMaintenancePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const [formData, setFormData] = useState({
    category: "Plumbing",
    priority: "MEDIUM",
    description: "",
    notes: "",
    permissionToEnter: true,
  });

  const [attachments, setAttachments] = useState([]);

  // Fetch Requests from API
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/maintenance", { cache: "no-store" });
      const data = await res.json();
      if (data?.requests && data.requests.length > 0) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle File Uploads (Mock / Preview)
  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).map((file) => ({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: file.type,
      url: URL.createObjectURL(file),
    }));

    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Handler -> Calls your exact POST /api/tenant/maintenance
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      setFormError("Description is required");
      return;
    }
    if (!formData.priority) {
      setFormError("Priority is required");
      return;
    }

    setSubmitting(true);
    setFormError("");

    const payload = {
      ...formData,
      attachments,
    };

    try {
      const res = await fetch("/api/tenant/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setFeedbackMessage(data.message || "Maintenance request created successfully");
      setIsSubmitOpen(false);

      if (data?.data) {
        setRequests((prev) => [data.data, ...prev]);
      } else {
        await fetchRequests();
      }
    } catch (err) {
      setFormError(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const formattedStatus = (r.status || "OPEN").replace("_", " ").toLowerCase();
      const matchesFilter =
        statusFilter === "All" || formattedStatus === statusFilter.toLowerCase();

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        r.ticketNumber?.toLowerCase().includes(searchLower) ||
        r.category?.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower);

      return matchesFilter && matchesSearch;
    });
  }, [requests, statusFilter, searchQuery]);

  // Black Glass Status Badge UI
  const renderStatusBadge = (status) => {
    const st = (status || "OPEN").toUpperCase();
    if (st === "OPEN") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
          Open
        </span>
      );
    }
    if (st === "IN_PROGRESS") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(6,182,212,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse mr-1.5" />
          In Progress
        </span>
      );
    }
    if (st === "RESOLVED") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(16,185,129,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
          Resolved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-zinc-400 border border-white/10 backdrop-blur-md">
        Closed
      </span>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#090a0f] text-zinc-100 selection:bg-emerald-500 selection:text-black">
      {/* ============================================================== */}
      {/* OBSIDIAN AMBIENT GLOWS (Black Glass Background)                 */}
      {/* ============================================================== */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-cyan-500/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 left-12 w-[600px] h-[600px] bg-purple-500/6 rounded-full blur-[180px]" />
      </div>

      <DashboardShell
        portal="tenant"
        title="Maintenance & Repairs"
        subtitle="Submit service requests with photo attachments and monitor dispatch status"
        actions={
          <button
            onClick={() => {
              setFormError("");
              setFeedbackMessage("");
              setAttachments([]);
              setFormData({
                category: "Plumbing",
                priority: "MEDIUM",
                description: "",
                notes: "",
                permissionToEnter: true,
              });
              setIsSubmitOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-2xl text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.98] shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.45)] transition-all duration-300 border border-emerald-400/30"
          >
            <span className="text-lg leading-none">+</span> Submit Request
          </button>
        }
      >
        {/* Success Feedback Alert */}
        {feedbackMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-sm flex items-center justify-between backdrop-blur-xl shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage("")}
              className="text-emerald-400 hover:text-emerald-200 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Black Glass Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-5 rounded-3xl bg-zinc-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
            <span className="text-xs font-medium text-zinc-400">Total Requests</span>
            <div className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
              {requests.length}
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Lifetime tickets submitted</span>
          </div>

          <div className="p-5 rounded-3xl bg-zinc-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
            <span className="text-xs font-medium text-amber-400">Open Tickets</span>
            <div className="text-3xl font-extrabold text-amber-400 mt-1.5 tracking-tight">
              {requests.filter((r) => r.status === "OPEN").length}
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Pending assignment</span>
          </div>

          <div className="p-5 rounded-3xl bg-zinc-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
            <span className="text-xs font-medium text-cyan-400">In Progress</span>
            <div className="text-3xl font-extrabold text-cyan-400 mt-1.5 tracking-tight">
              {requests.filter((r) => r.status === "IN_PROGRESS").length}
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Technician dispatched</span>
          </div>

          <div className="p-5 rounded-3xl bg-zinc-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
            <span className="text-xs font-medium text-emerald-400">Resolved</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1.5 tracking-tight">
              {requests.filter((r) => r.status === "RESOLVED" || r.status === "CLOSED").length}
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Completed repairs</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MAIN OBSIDIAN BLACK GLASS TABLE CONTAINER                      */}
        {/* ============================================================== */}
        <div className="rounded-3xl bg-zinc-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Header & Filter Controls */}
          <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Maintenance Feed</span>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {filteredRequests.length}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Track status updates and inspect audit trail in real time
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Glass Status Tabs */}
              <div className="flex items-center rounded-2xl bg-black/50 p-1 backdrop-blur-md border border-white/10 text-xs">
                {STATUS_TABS.map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3.5 py-1.5 rounded-xl font-medium transition-all duration-200 ${
                      statusFilter === st
                        ? "bg-white/15 text-white shadow-lg border border-white/20"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Glass Search Box */}
              <div className="relative w-56">
                <input
                  type="text"
                  placeholder="Search ticket or issue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl text-xs bg-black/40 border border-white/10 text-white placeholder-zinc-500 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Records List */}
          <div className="p-5 sm:p-6 space-y-3.5">
            {loading ? (
              <div className="py-16 text-center text-sm text-zinc-500 animate-pulse">
                Loading maintenance requests...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-16 text-center text-sm text-zinc-500">
                No maintenance requests match your filters.
              </div>
            ) : (
              filteredRequests.map((req) => (
                <div
                  key={req.id || req.ticketNumber}
                  className="group relative p-5 rounded-2xl bg-black/30 hover:bg-black/50 backdrop-blur-xl border border-white/10 hover:border-emerald-500/30 transition-all duration-300 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-zinc-400 px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10">
                        #{req.ticketNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        {req.category}
                      </span>
                      {renderStatusBadge(req.status)}
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {req.description}
                    </h4>

                    <div className="text-xs text-zinc-400 flex items-center gap-3">
                      <span>{req.propertyName || "Green Horizon Residency"}</span>
                      <span>•</span>
                      <span className="font-mono text-emerald-400">{req.unitNumber || "Unit 4B"}</span>
                      {req.notes && (
                        <>
                          <span>•</span>
                          <span className="italic text-zinc-500 truncate max-w-xs">{req.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setActiveRequest(req);
                        setIsDetailOpen(true);
                      }}
                      className="px-4 py-2 text-xs font-semibold rounded-xl text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    >
                      Track Status
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DashboardShell>

      {/* ============================================================== */}
      {/* 1. CREATE MODAL (OBSIDIAN BLACK GLASS)                         */}
      {/* ============================================================== */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#0f1117]/95 border border-white/15 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-6 sm:p-7 backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold text-white">Report Maintenance Issue</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Sends request directly to the maintenance dispatch team
                </p>
              </div>
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">Issue Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-zinc-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Selection (Required) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Priority Level <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p.value })}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        formData.priority === p.value
                          ? `${p.bg} ${p.color} ring-2 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]`
                          : "bg-black/30 border-white/10 text-zinc-400 hover:bg-white/5"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description (Required) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Issue Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue in detail (location, pipe leak, electric spark, etc.)..."
                  className="w-full px-4 py-3 rounded-xl text-sm bg-black/50 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Attachments */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Photos & Documents (Optional)
                </label>
                <div className="border-2 border-dashed border-white/15 rounded-2xl p-4 text-center bg-black/30 hover:bg-black/50 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="text-xs text-zinc-400">
                    <span className="font-semibold text-emerald-400">Upload photos or files</span> (JPG, PNG, PDF up to 10MB)
                  </div>
                </div>

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attachments.map((file, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs bg-white/5 border border-white/10 text-zinc-200"
                      >
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="text-zinc-400 hover:text-rose-400 font-bold"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Special Notes / Preferred Time (Optional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Call before arrival; dog is caged."
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/50 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 text-xs font-medium rounded-xl text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TRACK STATUS & AUDIT LOG MODAL (OBSIDIAN BLACK GLASS)        */}
      {/* ============================================================== */}
      {isDetailOpen && activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#0f1117]/95 border border-white/15 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-6 sm:p-7 backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    Ticket #{activeRequest.ticketNumber}
                  </h3>
                  {renderStatusBadge(activeRequest.status)}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {activeRequest.propertyName || "Green Horizon Residency"} • {activeRequest.unitNumber || "Unit 4B"}
                </p>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Lifecycle Progression Stepper */}
            <div className="mt-5 p-4 rounded-2xl bg-black/40 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-3">
                Lifecycle Progression
              </span>
              <div className="flex items-center justify-between">
                {["Open", "In Progress", "Resolved", "Closed"].map((step, idx) => {
                  const statusMap = { OPEN: 0, IN_PROGRESS: 1, RESOLVED: 2, CLOSED: 3 };
                  const currentIdx = statusMap[activeRequest.status?.toUpperCase()] ?? 0;
                  const isDone = idx <= currentIdx;

                  return (
                    <div key={step} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isDone
                            ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)] ring-4 ring-emerald-500/20"
                            : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {isDone ? "✓" : idx + 1}
                      </div>
                      <span
                        className={`text-[11px] mt-1.5 font-medium ${
                          isDone ? "text-emerald-400 font-semibold" : "text-zinc-500"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Description Box */}
            <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-white/10 text-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                Issue Description
              </span>
              <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {activeRequest.description}
              </p>
              {activeRequest.notes && (
                <p className="text-zinc-400 italic pt-1 border-t border-white/5">
                  Notes: {activeRequest.notes}
                </p>
              )}
            </div>

            {/* Audit Logs */}
            <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-white/10 text-xs">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
                Activity Audit Trail
              </h4>
              <div className="space-y-2.5">
                {(activeRequest.auditLogs || [
                  { action: "SUBMITTED", performedBy: "Tenant", details: "Ticket submitted" },
                ]).map((log, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-zinc-200">{log.details || log.action}</div>
                      <div className="text-[10px] text-zinc-500">
                        by {log.performedBy || "Tenant"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-5 border-t border-white/10 mt-5">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-white/10 text-zinc-200 hover:bg-white/20 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}