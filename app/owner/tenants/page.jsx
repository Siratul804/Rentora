"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable } from "@/components/tables/DataTable";
import { propertiesApi } from "@/lib/api";

export default function OwnerTenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [createdTenantInfo, setCreatedTenantInfo] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    property: "",
    unit: "",
    rentAmount: "32000",
    deposit: "64000",
    leaseEnd: "2027-12-31",
    rentStatus: "Pending",
  });

  // 1. Fetch tenants list
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

  // 2. Fetch owner's properties for property dropdown
  const fetchProperties = useCallback(async () => {
    try {
      const data = await propertiesApi.getAll();
      if (data?.properties && data.properties.length > 0) {
        setProperties(data.properties);
      }
    } catch (err) {
      console.error("Failed to load properties for tenant assignment:", err);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
    fetchProperties();
  }, [fetchTenants, fetchProperties]);

  // Open modal in "Add New Tenant" mode
  const handleOpenAddModal = () => {
    setFormError("");
    setSuccessNotice("");
    setCreatedTenantInfo(null);
    setEditingTenant(null);

    const defaultProp = properties[0]?.name || "Green Horizon Residency";
    const defaultUnit = "Unit " + Math.floor(10 + Math.random() * 80) + "A";

    setFormData({
      name: "",
      email: "",
      password: "tenant" + Math.floor(1000 + Math.random() * 9000),
      phone: "",
      property: defaultProp,
      unit: defaultUnit,
      rentAmount: "32000",
      deposit: "64000",
      leaseEnd: "2027-12-31",
      rentStatus: "Pending",
    });
    setModalOpen(true);
  };

  // Open modal in "Edit Tenant" mode
  const handleOpenEditModal = (tenant) => {
    setFormError("");
    setSuccessNotice("");
    setCreatedTenantInfo(null);
    setEditingTenant(tenant);

    setFormData({
      name: tenant.name || "",
      email: tenant.email || "",
      password: "", // Optional during edit
      phone: tenant.phone === "—" ? "" : tenant.phone || "",
      property: tenant.property === "Not Assigned" ? (properties[0]?.name || "") : tenant.property || "",
      unit: tenant.unit === "Not Assigned" ? "" : tenant.unit || "",
      rentAmount: tenant.rentAmount ? String(tenant.rentAmount) : "32000",
      deposit: tenant.deposit ? String(tenant.deposit) : "64000",
      leaseEnd: tenant.leaseEnd === "—" ? "" : tenant.leaseEnd || "2027-12-31",
      rentStatus: tenant.rentStatus || "Pending",
    });
    setModalOpen(true);
  };

  // Submit handler (Add or Edit)
  const handleSubmitTenant = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessNotice("");
    setSubmitting(true);

    const chosenProperty = (formData.property || "").trim();
    const chosenUnit = (formData.unit || "").trim().toLowerCase();

    // Validation: Prevent assigning an already occupied unit in the same property
    if (chosenProperty && chosenUnit) {
      const occupiedConflict = tenants.find((t) => {
        const isSameProp = (t.property || "").trim().toLowerCase() === chosenProperty.toLowerCase();
        const isSameUnit = (t.unit || "").trim().toLowerCase() === chosenUnit;
        const isDifferentTenant = editingTenant ? t.id !== editingTenant.id : true;
        const isActive = t.rentStatus !== "Inactive" && t.status !== "Inactive";
        return isSameProp && isSameUnit && isDifferentTenant && isActive;
      });

      if (occupiedConflict) {
        setFormError(
          `Unit "${formData.unit.trim()}" in "${chosenProperty}" is already occupied by ${occupiedConflict.name}. Please select an available unit.`
        );
        setSubmitting(false);
        return;
      }
    }

    try {
      if (editingTenant) {
        // Edit Tenant flow: dispatch to backend update endpoint
        const updatePayload = {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          property: formData.property.trim(),
          unit: formData.unit.trim(),
          rentAmount: Number(formData.rentAmount) || 0,
          deposit: Number(formData.deposit) || 0,
          leaseEnd: formData.leaseEnd,
          rentStatus: formData.rentStatus,
        };

        if (formData.password.trim()) {
          updatePayload.password = formData.password.trim();
        }

        const res = await fetch(`/api/owner/tenants/${editingTenant.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });

        // Check if teammate's endpoint is available
        if (res.status === 404 || res.status === 405) {
          setFormError(
            "The Edit Tenant backend endpoint (PATCH /api/owner/tenants/[id]) is pending teammate implementation. Changes were not saved to the database."
          );
          setSubmitting(false);
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "Failed to update tenant details.");
          setSubmitting(false);
          return;
        }

        setModalOpen(false);
        setEditingTenant(null);
        setSuccessNotice(`Tenant "${formData.name}" details updated successfully!`);
        fetchTenants();
      } else {
        // Add Tenant flow: uses existing POST /api/owner/tenants
        const res = await fetch("/api/owner/tenants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "Failed to onboard tenant");
          setSubmitting(false);
          return;
        }

        setCreatedTenantInfo({
          name: data.tenant.name,
          email: data.tenant.email,
          password: formData.password,
        });

        setModalOpen(false);
        fetchTenants();
      }
    } catch {
      setFormError("Network error while communicating with the server.");
    } finally {
      setSubmitting(false);
    }
  };

  // Safe Deactivate Tenant handler (No permanent record deletion)
  const handleDeactivateTenant = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate tenant "${name}"? Their portal access will be suspended without permanently deleting their tenancy record.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/owner/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentStatus: "Inactive", status: "Inactive" }),
      });

      // Check if teammate's deactivation endpoint is available
      if (res.status === 404 || res.status === 405) {
        alert(
          `The Deactivate Tenant backend endpoint (PATCH /api/owner/tenants/[id]) is pending teammate implementation. The record for "${name}" was NOT deleted.`
        );
        return;
      }

      if (res.ok) {
        setSuccessNotice(`Tenant "${name}" has been deactivated.`);
        fetchTenants();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Failed to deactivate tenant.");
      }
    } catch (e) {
      alert("Error contacting server: " + e.message);
    }
  };

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      (t.unit && t.unit.toLowerCase().includes(search.toLowerCase())) ||
      (t.property && t.property.toLowerCase().includes(search.toLowerCase()))
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
      accessor: (row) => row.phone || "—",
    },
    {
      header: "Lease Expiry",
      accessor: (row) => row.leaseEnd || "—",
    },
    {
      header: "Rent Status",
      accessor: (row) => (
        <div>
          <Badge
            variant={
              row.rentStatus === "Paid"
                ? "success"
                : row.rentStatus === "Overdue"
                ? "danger"
                : row.rentStatus === "Inactive"
                ? "neutral"
                : "warning"
            }
            size="sm"
          >
            {row.rentStatus}
          </Badge>
          {row.rentAmount > 0 && (
            <div className="text-[11px] text-zinc-500 font-medium mt-0.5">
              ৳ {Number(row.rentAmount).toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "RBAC Status",
      accessor: (row) =>
        row.rentStatus === "Inactive" || row.status === "Inactive" ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Inactive
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Can Log In
          </span>
        ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs px-2.5 h-7 font-medium"
            onClick={() => handleOpenEditModal(row)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs px-2.5 h-7 font-medium"
            onClick={() => handleDeactivateTenant(row.id, row.name)}
          >
            Deactivate
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      portal="owner"
      title="Tenants Directory"
      subtitle="Onboard tenants, assign units, and issue login credentials for the Tenant Portal"
      actions={
        <Button variant="primary" size="md" onClick={handleOpenAddModal}>
          + Onboard New Tenant
        </Button>
      }
    >
      {/* Success Notification Alert */}
      {successNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium text-sm">
            <span>🎉</span>
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice("")}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Newly Created Tenant Credentials Alert */}
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

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Active Tenants ({filtered.length})</CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Tenants added here can authenticate at <code className="font-semibold">/login</code> and view their portal
              </p>
            </div>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search tenant, email, or unit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                {search ? "No matching tenants found" : "No tenants onboarded yet"}
              </div>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {search
                  ? "Try adjusting your search criteria."
                  : "As an owner, you can onboard tenants by clicking the button below. Once onboarded, they can sign in with their assigned email and password."}
              </p>
              {!search && (
                <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
                  + Onboard First Tenant
                </Button>
              )}
            </div>
          ) : (
            <DataTable columns={columns} data={filtered} />
          )}
        </CardContent>
      </Card>

      {/* Tenant Modal (Add & Edit) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {editingTenant ? "Edit Tenant Details" : "Onboard New Tenant"}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {editingTenant
                    ? `Update tenancy details and unit assignment for ${editingTenant.name}`
                    : "Create tenant account & assign unit credentials"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingTenant(null);
                }}
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
                  disabled={!!editingTenant}
                  placeholder="e.g. farhan@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  helperText={editingTenant ? "Email cannot be changed (primary login ID)" : undefined}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Input
                    label={editingTenant ? "Change Password (Optional)" : "Assign Login Password *"}
                    type="text"
                    required={!editingTenant}
                    placeholder={editingTenant ? "Leave blank to keep current password" : "Temporary password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <div className="text-[11px] text-zinc-400">
                    {editingTenant ? "Only enter if resetting tenant password" : "Tenant will log in using this password"}
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
                {/* Property Selection using real properties API */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Assigned Property *
                  </label>
                  {properties.length > 0 ? (
                    <select
                      className="w-full h-10 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={formData.property}
                      onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                      required
                    >
                      {properties.map((prop) => (
                        <option key={prop.id} value={prop.name}>
                          {prop.name} ({prop.type})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="e.g. Green Horizon Residency"
                      value={formData.property}
                      onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                      required
                    />
                  )}
                </div>

                <div>
                  <Input
                    label="Unit Number *"
                    required
                    placeholder="e.g. Unit 4B"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Monthly Rent (৳)"
                  type="number"
                  placeholder="32000"
                  value={formData.rentAmount}
                  onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                />
                <Input
                  label="Security Deposit (৳)"
                  type="number"
                  placeholder="64000"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
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
                    Rent Status
                  </label>
                  <select
                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.rentStatus}
                    onChange={(e) => setFormData({ ...formData, rentStatus: e.target.value })}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingTenant(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting}
                >
                  {submitting
                    ? editingTenant
                      ? "Saving Changes..."
                      : "Onboarding..."
                    : editingTenant
                    ? "Save Changes"
                    : "Save & Create Tenant Account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
