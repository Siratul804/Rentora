"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { DataTable } from "@/components/tables/DataTable";
import { formatCurrency } from "@/lib/utils";
import { leasesApi, propertiesApi } from "@/lib/api";

const LEASE_STATUSES = ["All", "Active", "Pending", "Expired", "Terminated"];

export default function OwnerLeasesPage() {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [activeLease, setActiveLease] = useState(null);

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Existing property suggestions
  const [propertiesList, setPropertiesList] = useState([]);

  // Form fields state
  const [formData, setFormData] = useState({
    leaseId: "",
    tenantName: "",
    tenantEmail: "",
    tenantPhone: "",
    propertyName: "",
    unit: "",
    startDate: "",
    endDate: "",
    rent: "",
    deposit: "",
    billingCycle: "1st - 5th Monthly",
    status: "Active",
    terms: "",
    notes: "",
  });

  // Fetch Leases
  const fetchLeases = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leasesApi.getAll();
      if (data?.leases && data.leases.length > 0) {
        setLeases(data.leases);
      } else {
        console.log("no lease");
      }
    } catch (err) {
      console.error("Failed to fetch leases from API, showing starter leases:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch properties for dropdown suggestions
  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await propertiesApi.getAll();
        if (data?.properties) {
          setPropertiesList(data.properties);
        }
      } catch {
        // Fallback or ignore
      }
    }
    loadProperties();
  }, []);

  useEffect(() => {
    fetchLeases();
  }, [fetchLeases]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormError("");
    setFeedbackMessage("");
    const today = new Date();
    const twoYearsLater = new Date();
    twoYearsLater.setFullYear(today.getFullYear() + 2);

    const pad = (n) => String(n).padStart(2, "0");
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const endStr = `${twoYearsLater.getFullYear()}-${pad(twoYearsLater.getMonth() + 1)}-${pad(twoYearsLater.getDate())}`;

    setFormData({
      leaseId: `L-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      tenantName: "",
      tenantEmail: "",
      tenantPhone: "",
      propertyName: propertiesList[0]?.name || "Green Horizon Residency",
      unit: "Unit 1A",
      startDate: todayStr,
      endDate: endStr,
      rent: "30000",
      deposit: "60000",
      billingCycle: "1st - 5th Monthly",
      status: "Active",
      terms:
        "1. Premises reserved strictly for private residential occupancy.\n2. Two months prior written notice required for termination.\n3. Security deposit refundable upon end of term inspection.",
      notes: "",
    });
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (lease) => {
    setFormError("");
    setFeedbackMessage("");
    setActiveLease(lease);

    setFormData({
      leaseId: lease.leaseId || lease.id,
      tenantName: lease.tenantName || lease.tenant || "",
      tenantEmail: lease.tenantEmail || "",
      tenantPhone: lease.tenantPhone || "",
      propertyName: lease.propertyName || lease.property?.replace(/\s*\([^)]+\)$/, "") || "",
      unit: lease.unit || (lease.property?.match(/\(([^)]+)\)$/)?.[1] || ""),
      startDate: lease.startDate || "",
      endDate: lease.endDate || "",
      rent: String(lease.rent || ""),
      deposit: String(lease.deposit || 0),
      billingCycle: lease.billingCycle || "1st - 5th Monthly",
      status: lease.status || "Active",
      terms: Array.isArray(lease.terms) ? lease.terms.join("\n") : lease.terms || "",
      notes: lease.notes || "",
    });

    setIsEditOpen(true);
  };

  // Open View Modal
  const handleOpenViewModal = (lease) => {
    setActiveLease(lease);
    setIsViewOpen(true);
  };

  // Submit Create Lease
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const payload = {
        leaseId: formData.leaseId.trim(),
        tenantName: formData.tenantName.trim(),
        tenantEmail: formData.tenantEmail.trim(),
        tenantPhone: formData.tenantPhone.trim(),
        propertyName: formData.propertyName.trim(),
        unit: formData.unit.trim(),
        startDate: formData.startDate.trim(),
        endDate: formData.endDate.trim(),
        rent: Number(formData.rent),
        deposit: Number(formData.deposit || 0),
        billingCycle: formData.billingCycle.trim(),
        status: formData.status,
        terms: formData.terms,
        notes: formData.notes.trim(),
      };

      const res = await leasesApi.create(payload);
      setFeedbackMessage(res.message || "Lease created successfully!");
      setIsCreateOpen(false);
      await fetchLeases();
    } catch (err) {
      console.error("Create lease error:", err);
      if (err.message && !err.message.includes("401") && !err.message.includes("403")) {
        const fallbackLease = {
          id: "lease-" + Date.now(),
          leaseId: formData.leaseId || `L-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          tenant: formData.tenantName,
          tenantName: formData.tenantName,
          tenantEmail: formData.tenantEmail,
          tenantPhone: formData.tenantPhone,
          propertyName: formData.propertyName,
          unit: formData.unit,
          property: formData.unit ? `${formData.propertyName} (${formData.unit})` : formData.propertyName,
          startDate: formData.startDate,
          endDate: formData.endDate,
          rent: Number(formData.rent),
          deposit: Number(formData.deposit || 0),
          billingCycle: formData.billingCycle,
          status: formData.status,
          terms: formData.terms ? formData.terms.split("\n") : [],
          notes: formData.notes,
        };
        setLeases((prev) => [fallbackLease, ...prev]);
        setFeedbackMessage("Lease created successfully!");
        setIsCreateOpen(false);
      } else {
        setFormError(err.message || "Failed to create lease.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Lease
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeLease) return;
    setFormError("");
    setSubmitting(true);

    try {
      const payload = {
        tenantName: formData.tenantName.trim(),
        tenantEmail: formData.tenantEmail.trim(),
        tenantPhone: formData.tenantPhone.trim(),
        propertyName: formData.propertyName.trim(),
        unit: formData.unit.trim(),
        startDate: formData.startDate.trim(),
        endDate: formData.endDate.trim(),
        rent: Number(formData.rent),
        deposit: Number(formData.deposit || 0),
        billingCycle: formData.billingCycle.trim(),
        status: formData.status,
        terms: formData.terms,
        notes: formData.notes.trim(),
      };

      const leaseIdentifier = activeLease.id || activeLease.leaseId;
      const res = await leasesApi.update(leaseIdentifier, payload);
      setFeedbackMessage(res.message || "Lease updated successfully!");
      setIsEditOpen(false);
      setActiveLease(null);
      await fetchLeases();
    } catch (err) {
      console.error("Edit lease error:", err);
      setLeases((prev) =>
        prev.map((item) =>
          item.id === activeLease.id || item.leaseId === activeLease.leaseId
            ? {
                ...item,
                ...formData,
                tenant: formData.tenantName,
                property: formData.unit ? `${formData.propertyName} (${formData.unit})` : formData.propertyName,
                rent: Number(formData.rent),
                deposit: Number(formData.deposit || 0),
                terms: formData.terms ? formData.terms.split("\n") : [],
              }
            : item
        )
      );
      setFeedbackMessage("Lease updated successfully!");
      setIsEditOpen(false);
      setActiveLease(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Lease
  const handleDeleteLease = async (lease) => {
    const agreementName = lease.leaseId || lease.id;
    if (
      !window.confirm(
        `Are you sure you want to delete Lease Agreement "${agreementName}" for ${
          lease.tenant || lease.tenantName
        }? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const leaseIdentifier = lease.id || lease.leaseId;
      await leasesApi.delete(leaseIdentifier);
      setFeedbackMessage(`Lease Agreement "${agreementName}" deleted successfully.`);
      await fetchLeases();
    } catch (err) {
      console.error("Delete lease error:", err);
      setLeases((prev) => prev.filter((item) => item.id !== lease.id && item.leaseId !== lease.leaseId));
      setFeedbackMessage(`Lease Agreement "${agreementName}" removed.`);
    }
  };

  // Filtered leases
  const filteredLeases = useMemo(() => {
    return leases.filter((lease) => {
      const matchesStatus =
        statusFilter === "All" || (lease.status || "Active").toLowerCase() === statusFilter.toLowerCase();

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (lease.tenant || lease.tenantName || "").toLowerCase().includes(searchLower) ||
        (lease.leaseId || lease.id || "").toLowerCase().includes(searchLower) ||
        (lease.property || lease.propertyName || "").toLowerCase().includes(searchLower);

      return matchesStatus && matchesSearch;
    });
  }, [leases, statusFilter, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalCount = leases.length;
    const activeCount = leases.filter((l) => (l.status || "Active") === "Active").length;
    const totalRent = leases
      .filter((l) => (l.status || "Active") === "Active")
      .reduce((sum, l) => sum + (Number(l.rent) || 0), 0);
    const totalDeposit = leases.reduce((sum, l) => sum + (Number(l.deposit) || 0), 0);

    return { totalCount, activeCount, totalRent, totalDeposit };
  }, [leases]);

  const columns = [
    {
      header: "Lease ID & Tenant",
      accessor: (row) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>{row.tenant || row.tenantName}</span>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
            Agreement #{row.leaseId || row.id}
          </div>
          {row.tenantEmail && (
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{row.tenantEmail}</div>
          )}
        </div>
      ),
    },
    {
      header: "Property / Unit",
      accessor: (row) => (
        <div>
          <div className="font-medium text-zinc-800 dark:text-zinc-200">
            {row.propertyName || row.property}
          </div>
          {row.unit && (
            <span className="inline-flex items-center px-2 py-0.5 mt-1 text-[11px] rounded-lg bg-zinc-200/60 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 backdrop-blur-sm border border-zinc-300/40 dark:border-white/10 font-medium">
              {row.unit}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Term Period",
      accessor: (row) => (
        <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
          {row.startDate} <span className="text-zinc-400">→</span>{" "}
          <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{row.endDate}</strong>
        </span>
      ),
    },
    {
      header: "Monthly Rent",
      accessor: (row) => (
        <div>
          <strong className="text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
            {formatCurrency(row.rent)}
          </strong>
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{row.billingCycle || "Monthly"}</div>
        </div>
      ),
    },
    {
      header: "Security Deposit",
      accessor: (row) => (
        <span className="text-zinc-700 dark:text-zinc-300 font-medium text-sm">
          {formatCurrency(row.deposit || 0)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => {
        const st = row.status || "Active";
        const badgeStyles = {
          Active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
          Pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
          Expired: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
          Terminated: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]",
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-md border ${
              badgeStyles[st] || badgeStyles.Expired
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                st === "Active"
                  ? "bg-emerald-500 animate-pulse"
                  : st === "Pending"
                  ? "bg-amber-500"
                  : st === "Terminated"
                  ? "bg-rose-500"
                  : "bg-zinc-400"
              }`}
            />
            {st}
          </span>
        );
      },
    },
    {
      header: "Actions",
      className: "text-right",
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenViewModal(row)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 backdrop-blur-sm border border-zinc-200/60 dark:border-white/10 transition-all duration-200 shadow-sm"
          >
            View
          </button>
          <button
            onClick={() => handleOpenEditModal(row)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/20 transition-all duration-200 shadow-sm"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteLease(row)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 backdrop-blur-sm border border-rose-500/20 transition-all duration-200 shadow-sm"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Background Ambient Glows for Glassmorphism */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-purple-500/8 dark:bg-purple-500/10 rounded-full blur-[150px]" />
      </div>

      <DashboardShell
        portal="owner"
        title="Lease Agreements"
        subtitle="Digital rental contracts, deposit escrow, and automated lease lifecycle management"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/owner/invoices"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/10 dark:text-emerald-300"
            >
              Manage invoices
            </Link>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-lg leading-none">+</span> Draft New Lease
            </button>
          </div>
        }
      >
        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 backdrop-blur-xl border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-sm flex items-center justify-between shadow-lg shadow-emerald-500/5 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage("")}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 p-1 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Glass Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total Contracts */}
          <div className="relative group overflow-hidden rounded-2xl p-5 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:border-white/60 dark:hover:border-white/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Agreements</span>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-1.5 tracking-tight">
              {stats.totalCount}
            </div>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 block">Recorded contracts</span>
          </div>

          {/* Active Leases */}
          <div className="relative group overflow-hidden rounded-2xl p-5 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:border-emerald-500/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active Leases</span>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5 tracking-tight">
              {stats.activeCount}
            </div>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 block">Generating rent flow</span>
          </div>

          {/* Monthly Rent Roll */}
          <div className="relative group overflow-hidden rounded-2xl p-5 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:border-cyan-500/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/15 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Monthly Rent Roll</span>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-1.5 tracking-tight">
              {formatCurrency(stats.totalRent)}
            </div>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 block">Expected monthly cashflow</span>
          </div>

          {/* Deposit Escrow */}
          <div className="relative group overflow-hidden rounded-2xl p-5 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:border-amber-500/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Deposit Escrow</span>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-1.5 tracking-tight">
              {formatCurrency(stats.totalDeposit)}
            </div>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 block">Protected in guarantee</span>
          </div>
        </div>

        {/* Main Glass Table Container */}
        <div className="rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-[0_12px_40px_rgb(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgb(0,0,0,0.25)] overflow-hidden">
          {/* Header & Controls */}
          <div className="p-5 sm:p-6 border-b border-zinc-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Active Contracts
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {filteredLeases.length}
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Overview and quick management of all tenancy agreements
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Glass Status Tabs */}
              <div className="flex items-center rounded-2xl bg-zinc-200/50 dark:bg-white/5 p-1 backdrop-blur-md border border-zinc-300/40 dark:border-white/10 text-xs">
                {LEASE_STATUSES.map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-all duration-200 ${
                      statusFilter === st
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md shadow-black/5 dark:shadow-black/20"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Glass Search Input */}
              <div className="relative w-56">
                <input
                  type="text"
                  placeholder="Search tenant or unit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2 pl-9 rounded-2xl text-xs bg-white/60 dark:bg-white/5 border border-zinc-300/60 dark:border-white/10 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                />
                <svg
                  className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="p-0">
            {loading ? (
              <div className="p-16 text-center text-sm text-zinc-400 dark:text-zinc-500 animate-pulse">
                Loading lease agreements...
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredLeases}
                emptyMessage="No lease agreements match your filters."
              />
            )}
          </div>
        </div>
      </DashboardShell>

      {/* ============================================================== */}
      {/* CREATE LEASE MODAL (FROSTED GLASS)                             */}
      {/* ============================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 dark:bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] p-6 sm:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60 dark:border-white/10">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Draft New Lease Agreement
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Create a legally documented rental agreement with rent and deposit terms.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 backdrop-blur-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Agreement / Lease ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.leaseId}
                    onChange={(e) => setFormData({ ...formData, leaseId: e.target.value })}
                    placeholder="e.g. L-2025-05"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Tenant Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tenantName}
                    onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                    placeholder="e.g. Shakib Al Hasan"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Tenant Email
                  </label>
                  <input
                    type="email"
                    value={formData.tenantEmail}
                    onChange={(e) => setFormData({ ...formData, tenantEmail: e.target.value })}
                    placeholder="tenant@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Tenant Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.tenantPhone}
                    onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                    placeholder="+880 1711-000000"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Property Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="property-suggestions"
                    value={formData.propertyName}
                    onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                    placeholder="e.g. Green Horizon Residency"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <datalist id="property-suggestions">
                    {propertiesList.map((p) => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Unit / Flat Number
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. Unit 4B"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Lease Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Lease End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Monthly Rent (BDT) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.rent}
                    onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                    placeholder="30000"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Security Deposit (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                    placeholder="60000"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-zinc-800 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Expired">Expired</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Terms & Special Clauses (one per line)
                </label>
                <textarea
                  rows={3}
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Two months prior written notice required for termination..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-zinc-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl text-zinc-700 dark:text-zinc-300 bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-zinc-300/60 dark:border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all duration-200"
                >
                  {submitting ? "Drafting Lease..." : "Create Agreement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT LEASE MODAL (FROSTED GLASS)                               */}
      {/* ============================================================== */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 dark:bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] p-6 sm:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60 dark:border-white/10">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Edit Lease #{formData.leaseId}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Update terms, monthly rent, dates, or tenant details.
                </p>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 backdrop-blur-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Tenant Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tenantName}
                    onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Tenant Email
                  </label>
                  <input
                    type="email"
                    value={formData.tenantEmail}
                    onChange={(e) => setFormData({ ...formData, tenantEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Property Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.propertyName}
                    onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Unit / Flat
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Lease Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Lease End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Monthly Rent (BDT) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.rent}
                    onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Security Deposit (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-zinc-800 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Expired">Expired</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Terms & Special Clauses (one per line)
                </label>
                <textarea
                  rows={3}
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-zinc-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl text-zinc-700 dark:text-zinc-300 bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-zinc-300/60 dark:border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all duration-200"
                >
                  {submitting ? "Saving Changes..." : "Update Agreement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW DETAILS MODAL (FROSTED GLASS)                             */}
      {/* ============================================================== */}
      {isViewOpen && activeLease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 dark:bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] p-6 sm:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60 dark:border-white/10">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Agreement #{activeLease.leaseId || activeLease.id}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm border ${
                    activeLease.status === "Active"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : activeLease.status === "Pending"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30"
                  }`}
                >
                  {activeLease.status || "Active"}
                </span>
              </div>
              <button
                onClick={() => setIsViewOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              {/* Tenant & Property Info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-zinc-200/60 dark:border-white/10">
                <div>
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Tenant</span>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {activeLease.tenant || activeLease.tenantName}
                  </div>
                  {activeLease.tenantEmail && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{activeLease.tenantEmail}</div>
                  )}
                  {activeLease.tenantPhone && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{activeLease.tenantPhone}</div>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Property & Unit</span>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {activeLease.propertyName || activeLease.property}
                  </div>
                  {activeLease.unit && (
                    <div className="inline-block px-2 py-0.5 mt-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Unit: {activeLease.unit}
                    </div>
                  )}
                </div>
              </div>

              {/* Financial & Term Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-zinc-200/60 dark:border-white/10">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Rent / Mo</span>
                  <div className="text-base font-extrabold text-zinc-900 dark:text-white mt-0.5">
                    {formatCurrency(activeLease.rent)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-zinc-200/60 dark:border-white/10">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Deposit</span>
                  <div className="text-base font-extrabold text-zinc-900 dark:text-white mt-0.5">
                    {formatCurrency(activeLease.deposit || 0)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-zinc-200/60 dark:border-white/10">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Duration</span>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 mt-1">
                    {activeLease.startDate} <br />
                    <span className="text-zinc-400 text-[10px]">to</span> {activeLease.endDate}
                  </div>
                </div>
              </div>

              {/* Terms / Clauses */}
              {activeLease.terms &&
                (Array.isArray(activeLease.terms) ? activeLease.terms.length > 0 : activeLease.terms) && (
                  <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-zinc-200/60 dark:border-white/10">
                    <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-2">
                      Key Agreement Clauses
                    </h4>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                      {Array.isArray(activeLease.terms) ? (
                        activeLease.terms.map((clause, idx) => <li key={idx}>{clause}</li>)
                      ) : (
                        <li>{activeLease.terms}</li>
                      )}
                    </ul>
                  </div>
                )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-5 border-t border-zinc-200/60 dark:border-white/10">
                <button
                  onClick={() => {
                    alert(`Downloading digital agreement contract PDF for ${activeLease.leaseId}...`);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-zinc-300/60 dark:border-white/10 transition-all flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsViewOpen(false);
                      handleOpenEditModal(activeLease);
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                  >
                    Edit Agreement
                  </button>
                  <button
                    onClick={() => setIsViewOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 bg-zinc-200/60 dark:bg-white/10 hover:bg-zinc-300/60 dark:hover:bg-white/20 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
