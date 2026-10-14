"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable } from "@/components/tables/DataTable";

export default function OwnerTenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive"

  // Onboard Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [createdTenantInfo, setCreatedTenantInfo] = useState(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState("");
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    property: "",
    unit: "",
    leaseEnd: "",
    rentStatus: "Pending",
    password: "",
    isActive: true,
  });

  // Action status message
  const [actionNotice, setActionNotice] = useState(null);

  // Form State for Onboarding
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "tenant" + Math.floor(1000 + Math.random() * 9000),
    phone: "",
    property: "Green Horizon Residency",
    unit: "Unit 101",
    leaseEnd: "2027-12-31",
    rentStatus: "Pending",
  });

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/owner/tenants");
      if (res.ok) {
        const data = await res.json();
        if (data?.tenants) {
          setTenants(data.tenants);
        }
      }
    } catch (err) {
      console.error("Failed to load tenants:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleOpenModal = () => {
    setFormError("");
    setCreatedTenantInfo(null);
    setFormData({
      name: "",
      email: "",
      password: "tenant" + Math.floor(1000 + Math.random() * 9000),
      phone: "",
      property: "Green Horizon Residency",
      unit: "Unit " + Math.floor(10 + Math.random() * 80) + "A",
      leaseEnd: "2027-12-31",
      rentStatus: "Pending",
    });
    setModalOpen(true);
  };

  const handleSubmitTenant = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/owner/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to onboard tenant");
        return;
      }

      setCreatedTenantInfo({
        name: data.tenant.name,
        email: data.tenant.email,
        password: formData.password,
      });

      setModalOpen(false);
      // Refresh list
      fetchTenants();
    } catch {
      setFormError("Network error while creating tenant.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (tenant) => {
    setEditingTenant(tenant);
    setEditFormError("");
    setEditFormData({
      name: tenant.name || "",
      email: tenant.email || "",
      phone: tenant.phone === "—" ? "" : tenant.phone || "",
      property: tenant.property === "Not Assigned" ? "" : tenant.property || "",
      unit: tenant.unit === "Not Assigned" ? "" : tenant.unit || "",
      leaseEnd: tenant.leaseEnd === "—" ? "" : tenant.leaseEnd || "",
      rentStatus: tenant.rentStatus || "Pending",
      password: "",
      isActive: tenant.isActive !== false,
    });
    setEditModalOpen(true);
  };

  const handleSubmitEditTenant = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;
    setEditFormError("");
    setEditSubmitting(true);

    try {
      const payload = {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        property: editFormData.property,
        unit: editFormData.unit,
        leaseEnd: editFormData.leaseEnd,
        rentStatus: editFormData.rentStatus,
        isActive: editFormData.isActive,
      };

      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }

      const res = await fetch(`/api/owner/tenants/${editingTenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditFormError(data.error || "Failed to update tenant");
        return;
      }

      setTenants((prev) =>
        prev.map((t) => (t.id === editingTenant.id ? { ...t, ...data.tenant } : t))
      );
      setEditModalOpen(false);
      setActionNotice({ type: "success", text: data.message || "Tenant updated successfully!" });
      setTimeout(() => setActionNotice(null), 4000);
    } catch {
      setEditFormError("Network error while updating tenant.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleStatus = async (tenant) => {
    const nextStatus = tenant.isActive === false;
    const actionName = nextStatus ? "activate" : "deactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${actionName} "${tenant.name}"? ${
          !nextStatus
            ? "They will be blocked from logging into the Tenant Portal."
            : "They will regain access to their portal."
        }`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/owner/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        setTenants((prev) =>
          prev.map((t) => (t.id === tenant.id ? { ...t, isActive: nextStatus } : t))
        );
        setActionNotice({
          type: "success",
          text: data.message || `Tenant "${tenant.name}" ${nextStatus ? "activated" : "deactivated"}.`,
        });
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        alert(data.error || `Failed to ${actionName} tenant`);
      }
    } catch (e) {
      alert(`Error while changing status: ${e.message}`);
    }
  };

  const handleDeleteTenant = async (id, name) => {
    if (!window.confirm(`Are you sure you want to completely remove tenant "${name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/owner/tenants/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTenants((prev) => prev.filter((t) => t.id !== id));
        setActionNotice({ type: "info", text: `Tenant "${name}" has been removed.` });
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete tenant");
      }
    } catch (e) {
      alert("Error deleting tenant: " + e.message);
    }
  };

  // Filtered by search & active/inactive tab
  const filtered = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      (t.unit && t.unit.toLowerCase().includes(search.toLowerCase())) ||
      (t.property && t.property.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? t.isActive !== false
        : t.isActive === false;

    return matchesSearch && matchesStatus;
  });

  const activeCount = tenants.filter((t) => t.isActive !== false).length;
  const inactiveCount = tenants.filter((t) => t.isActive === false).length;

  const columns = [
    {
      header: "Tenant",
      accessor: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</span>
            {row.isActive === false && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                Inactive
              </span>
            )}
          </div>
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
      accessor: (row) => row.phone || "—",
    },
    {
      header: "Lease Expiry",
      accessor: (row) => row.leaseEnd || "—",
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
      header: "Account Access",
      accessor: (row) =>
        row.isActive !== false ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Deactivated
          </span>
        ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          {/* Edit Tenant Button */}
          <Button
            size="sm"
            variant="outline"
            className="text-xs py-1 px-2.5"
            onClick={() => handleOpenEditModal(row)}
          >
            Edit
          </Button>

          {/* Toggle Deactivate / Activate Button */}
          {row.isActive !== false ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs py-1 px-2.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              onClick={() => handleToggleStatus(row)}
              title="Deactivate account login"
            >
              Deactivate
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs py-1 px-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-medium"
              onClick={() => handleToggleStatus(row)}
              title="Activate account login"
            >
              Activate
            </Button>
          )}

          {/* Remove / Delete Button */}
          <Button
            size="sm"
            variant="ghost"
            className="text-xs py-1 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            onClick={() => handleDeleteTenant(row.id, row.name)}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      portal="owner"
      title="Tenants Directory"
      subtitle="Manage onboarded tenants, edit unit assignments, and control portal login access"
      actions={
        <Button variant="primary" size="md" onClick={handleOpenModal}>
          + Onboard New Tenant
        </Button>
      }
    >
      {/* Toast Notice */}
      {actionNotice && (
        <div
          className={`mb-5 p-3.5 rounded-2xl flex items-center justify-between text-xs font-medium border ${
            actionNotice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-zinc-500/10 border-zinc-500/30 text-zinc-700 dark:text-zinc-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{actionNotice.type === "success" ? "✓" : "ℹ"}</span>
            <span>{actionNotice.text}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Newly Created Tenant Alert */}
      {createdTenantInfo && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <span>🎉</span>
              <span>Tenant Onboarded Successfully!</span>
            </div>
            <button
              onClick={() => setCreatedTenantInfo(null)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs mt-1 text-emerald-700 dark:text-emerald-300">
            Share these login credentials with <strong>{createdTenantInfo.name}</strong> so they can sign in to the Tenant Portal:
          </p>
          <div className="mt-3 p-3 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-emerald-500/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-zinc-500">Login Email: </span>
              <code className="font-bold text-zinc-900 dark:text-zinc-100">{createdTenantInfo.email}</code>
            </div>
            <div>
              <span className="text-zinc-500">Password: </span>
              <code className="font-bold text-zinc-900 dark:text-zinc-100">{createdTenantInfo.password}</code>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === "all"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            All ({tenants.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === "active"
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === "inactive"
                ? "bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm"
                : "text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Deactivated ({inactiveCount})
          </button>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search tenant, email, property, or unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>
                {statusFilter === "all"
                  ? "Tenants Roster"
                  : statusFilter === "active"
                  ? "Active Tenants"
                  : "Deactivated Tenants"}{" "}
                ({filtered.length})
              </CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Manage personal information, lease terms, and toggle login permissions
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-sm text-zinc-500">
              Loading tenants from database...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="text-4xl">👥</div>
              <div className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
                {search
                  ? "No matching tenants found"
                  : statusFilter !== "all"
                  ? `No ${statusFilter} tenants found`
                  : "No tenants onboarded yet"}
              </div>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {search
                  ? "Try adjusting your search query or switching filters."
                  : "As an owner, you can onboard tenants, edit their profiles, and control portal access at any time."}
              </p>
              {!search && statusFilter === "all" && (
                <Button variant="primary" size="sm" onClick={handleOpenModal}>
                  + Onboard First Tenant
                </Button>
              )}
            </div>
          ) : (
            <DataTable columns={columns} data={filtered} />
          )}
        </CardContent>
      </Card>

      {/* Onboard Tenant Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Onboard New Tenant
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Create tenant account & assign unit credentials
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitTenant} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Tenant Full Name *"
                  required
                  placeholder="e.g. Farhan Ahmed"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label="Email Address (Login ID) *"
                  type="email"
                  required
                  placeholder="e.g. farhan@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Input
                    label="Assign Login Password *"
                    type="text"
                    required
                    placeholder="Temporary password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <div className="text-[11px] text-zinc-400">
                    Tenant will log in using this password
                  </div>
                </div>

                <Input
                  label="Phone Number"
                  placeholder="+880 1711-000000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Assigned Property"
                  placeholder="e.g. Green Horizon Residency"
                  value={formData.property}
                  onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                />
                <Input
                  label="Unit Number"
                  placeholder="e.g. Unit 4B"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Lease Expiration Date"
                  type="date"
                  value={formData.leaseEnd}
                  onChange={(e) => setFormData({ ...formData, leaseEnd: e.target.value })}
                />
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Initial Rent Status
                  </label>
                  <select
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.rentStatus}
                    onChange={(e) => setFormData({ ...formData, rentStatus: e.target.value })}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting}
                >
                  {submitting ? "Onboarding..." : "Save & Create Tenant Account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {editModalOpen && editingTenant && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Edit Tenant Profile
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Update details, lease status, or manage portal login access
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {editFormError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {editFormError}
              </div>
            )}

            <form onSubmit={handleSubmitEditTenant} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Tenant Full Name *"
                  required
                  placeholder="e.g. Farhan Ahmed"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
                <Input
                  label="Email Address (Login ID) *"
                  type="email"
                  required
                  placeholder="e.g. farhan@gmail.com"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Phone Number"
                  placeholder="+880 1711-000000"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
                <div className="space-y-1">
                  <Input
                    label="Reset Password (Optional)"
                    type="password"
                    placeholder="Leave blank to keep unchanged"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  />
                  <div className="text-[11px] text-zinc-400">
                    Only fill if you want to reset password
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Assigned Property"
                  placeholder="e.g. Green Horizon Residency"
                  value={editFormData.property}
                  onChange={(e) => setEditFormData({ ...editFormData, property: e.target.value })}
                />
                <Input
                  label="Unit Number"
                  placeholder="e.g. Unit 4B"
                  value={editFormData.unit}
                  onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Lease Expiration Date"
                  type="date"
                  value={editFormData.leaseEnd}
                  onChange={(e) => setEditFormData({ ...editFormData, leaseEnd: e.target.value })}
                />
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Rent Status
                  </label>
                  <select
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={editFormData.rentStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, rentStatus: e.target.value })}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              {/* Account Access Status Toggle */}
              <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                      Portal Access Status
                    </label>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {editFormData.isActive
                        ? "Active: Tenant can log in and view their portal dashboard"
                        : "Deactivated: Tenant will be blocked from logging into the portal"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, isActive: !editFormData.isActive })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      editFormData.isActive ? "bg-emerald-600" : "bg-zinc-400 dark:bg-zinc-600"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        editFormData.isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
