"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { propertiesApi } from "@/lib/api";

const INITIAL_PROPERTIES = [
  {
    id: "prop-1",
    name: "Green Horizon Residency",
    address: "House 42, Road 11, Dhanmondi, Dhaka",
    totalUnits: 8,
    occupiedUnits: 7,
    monthlyYield: 256000,
    type: "Apartment",
    status: "Active",
  },
  {
    id: "prop-2",
    name: "Lakeview Terrace Apartments",
    address: "Plot 18, Block D, Bashundhara R/A, Dhaka",
    totalUnits: 10,
    occupiedUnits: 9,
    monthlyYield: 320000,
    type: "Apartment",
    status: "Active",
  },
  {
    id: "prop-3",
    name: "Gulshan Heights Studio Tower",
    address: "Avenue 4, Gulshan-2, Dhaka",
    totalUnits: 6,
    occupiedUnits: 6,
    monthlyYield: 270000,
    type: "Commercial",
    status: "Active",
  },
];

const PROPERTY_TYPES = ["Apartment", "House", "Commercial", "Office", "Other"];

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // New Property Form State
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    type: "Apartment",
    totalUnits: "4",
    status: "Active",
  });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const data = await propertiesApi.getAll();
      if (data?.properties && data.properties.length > 0) {
        const formatted = data.properties.map((p) => ({
          id: p.id,
          name: p.name,
          address: p.address,
          type: p.type,
          totalUnits: p.totalUnits,
          occupiedUnits: p.occupiedUnits || 0,
          monthlyYield: p.monthlyYield || p.totalUnits * 25000,
          status: p.status,
          createdAt: p.createdAt,
        }));
        setProperties(formatted);
        setSelectedProperty((prev) =>
          prev ? formatted.find((item) => item.id === prev.id) || formatted[0] : formatted[0]
        );
      } else {
        // If no properties created in DB yet, show initial mock set for preview
        setProperties(INITIAL_PROPERTIES);
        setSelectedProperty(INITIAL_PROPERTIES[0]);
      }
    } catch (err) {
      console.error("Failed to load properties:", err);
      setProperties(INITIAL_PROPERTIES);
      setSelectedProperty(INITIAL_PROPERTIES[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleOpenModal = () => {
    setFormError("");
    setSuccessMessage("");
    setFormData({
      name: "",
      address: "",
      type: "Apartment",
      totalUnits: "4",
      status: "Active",
    });
    setModalOpen(true);
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        type: formData.type,
        totalUnits: parseInt(formData.totalUnits, 10),
        status: formData.status,
      };

      const data = await propertiesApi.create(payload);

      setSuccessMessage(`Property "${data.property.name}" added successfully!`);
      setModalOpen(false);
      await fetchProperties();
    } catch (err) {
      console.error("Error creating property:", err);
      setFormError(err.message || "Failed to create property.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProperty = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await propertiesApi.delete(id);
      setSuccessMessage(`Property "${name}" deleted.`);
      fetchProperties();
    } catch (err) {
      alert("Error deleting property: " + err.message);
    }
  };

  const activeProperty = selectedProperty || properties[0] || INITIAL_PROPERTIES[0];

  return (
    <DashboardShell
      portal="owner"
      title="Properties & Units"
      subtitle="Manage your real estate portfolio, unit inventory, and rent allocations"
      actions={
        <Button variant="primary" size="md" onClick={handleOpenModal}>
          + Add New Property
        </Button>
      }
    >
      {/* Success Notification Alert */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium text-sm">
            <span>🎉</span>
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-zinc-500">
          Loading properties from database...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {properties.map((prop) => {
            const totalUnits = prop.totalUnits || 1;
            const occupied = prop.occupiedUnits || 0;
            const occupancy = Math.min(100, Math.round((occupied / totalUnits) * 100));
            const isSelected = activeProperty?.id === prop.id;

            return (
              <Card
                key={prop.id}
                className={`cursor-pointer transition-all hover:border-emerald-500/50 ${
                  isSelected
                    ? "border-emerald-500 ring-1 ring-emerald-500/50 shadow-md"
                    : ""
                }`}
                onClick={() => setSelectedProperty(prop)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant={prop.status === "Active" ? "success" : "neutral"} size="sm">
                      {prop.status}
                    </Badge>
                    <span className="text-xs font-semibold text-zinc-500">
                      {occupied}/{totalUnits} Units Occupied
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-base">{prop.name}</CardTitle>
                  <p className="text-xs text-zinc-500 truncate">{prop.address}</p>
                  <div className="mt-1">
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                      {prop.type}
                    </span>
                  </div>
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
                    <div>
                      <span className="text-xs text-zinc-400 block">Total Units</span>
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {totalUnits} Units
                      </span>
                    </div>
                    {prop.id.length === 24 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:text-rose-700 text-xs px-2 h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProperty(prop.id, prop.name);
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Selected Property Unit Breakdown */}
      {activeProperty && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{activeProperty.name} — Unit Directory</CardTitle>
              <p className="text-xs text-zinc-500 mt-0.5">{activeProperty.address}</p>
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
      )}

      {/* Add New Property Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Add New Property
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Register a new building or property in your portfolio
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

            <form onSubmit={handleCreateProperty} className="space-y-4 mt-4">
              <div>
                <Input
                  label="Property Name *"
                  required
                  placeholder="e.g. Green Horizon Residency"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="Full Address *"
                  required
                  placeholder="e.g. House 42, Road 11, Dhanmondi, Dhaka"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Property Type *
                  </label>
                  <select
                    className="w-full h-10 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Input
                    label="Total Units *"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 8"
                    value={formData.totalUnits}
                    onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Status
                </label>
                <select
                  className="w-full h-10 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
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
                  {submitting ? "Adding Property..." : "Add Property"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
