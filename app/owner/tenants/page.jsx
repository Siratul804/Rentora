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
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [createdTenantInfo, setCreatedTenantInfo] = useState(null);

  // Form State
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

      // Refresh list
      fetchTenants();
    } catch {
      setFormError("Network error while creating tenant.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTenant = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove tenant "${name}"?`)) return;
    try {
      const res = await fetch(`/api/owner/tenants/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTenants((prev) => prev.filter((t) => t.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete tenant");
      }
    } catch (e) {
      alert("Error deleting tenant: " + e.message);
    }
  };

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      (t.unit && t.unit.toLowerCase().includes(search.toLowerCase()))
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
        <Badge
          variant={row.rentStatus === "Paid" ? "success" : row.rentStatus === "Overdue" ? "danger" : "warning"}
          size="sm"
        >
          {row.rentStatus}
        </Badge>
      ),
    },
    {
      header: "RBAC Status",
      accessor: () => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Can Log In
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
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
      subtitle="Onboard tenants, assign units, and issue login credentials for the Tenant Portal"
      actions={
        <Button variant="primary" size="md" onClick={handleOpenModal}>
          + Onboard New Tenant
        </Button>
      }
    >
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
    </DashboardShell>
  );
}
