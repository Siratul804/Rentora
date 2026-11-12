
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Search,
  Plus,
  X,
  Layers3,
  CheckCircle2,
  Users,
  Wrench,
  SlidersHorizontal,
  MoreHorizontal,
  DoorOpen,
  RefreshCw,
  AlertCircle,
  LoaderCircle,
  BedDouble,
  Bath,
  Ruler,
  Wallet,
  ArrowUpRight,
  ChevronDown,
  Inbox,
} from "lucide-react";

const API_URL = "/api/units";
const PROPERTIES_URL = "/api/properties";

const STATUSES = ["Vacant", "Occupied", "Maintenance"];

const EMPTY_FORM = {
  propertyId: "",
  unitNumber: "",
  rentAmount: "",
  deposit: "",
  bedrooms: "1",
  bathrooms: "1",
  size: "",
  status: "Vacant",
};

const money = (value) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function getErrorMessage(data, fallback) {
  return data?.error || data?.message || fallback;
}

function normalizeProperty(item) {
  return {
    id: String(item.id || item._id || ""),
    name: item.name || item.propertyName || "Unnamed property",
  };
}

function StatusBadge({ status }) {
  const styles = {
    Vacant: "border-emerald-300/20 bg-emerald-400/10 text-emerald-300",
    Occupied: "border-sky-300/20 bg-sky-400/10 text-sky-300",
    Maintenance: "border-amber-300/20 bg-amber-400/10 text-amber-300",
  };

  const dotStyles = {
    Vacant: "bg-emerald-400",
    Occupied: "bg-sky-400",
    Maintenance: "bg-amber-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
        styles[status] || "border-white/10 bg-white/5 text-slate-300"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          dotStyles[status] || "bg-slate-400"
        }`}
      />
      {status || "Unknown"}
    </span>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, accent }) {
  const accents = {
    violet: "bg-violet-400/15 text-violet-300 ring-violet-300/15",
    emerald: "bg-emerald-400/15 text-emerald-300 ring-emerald-300/15",
    blue: "bg-sky-400/15 text-sky-300 ring-sky-300/15",
    amber: "bg-amber-400/15 text-amber-300 ring-amber-300/15",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.045] p-5 shadow-xl shadow-black/10 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-white/[0.16] hover:bg-white/[0.07]">
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-violet-500/[0.08] blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
        </div>

        <div
          className={`rounded-xl p-3 ring-1 ${accents[accent] || accents.violet}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="min-w-0 space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#101326]/90 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/10";

export default function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [propertyError, setPropertyError] = useState("");
  const [notice, setNotice] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [propertyFilter, setPropertyFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Could not load units.")
        );
      }

      if (!Array.isArray(data.units)) {
        throw new Error("Unexpected response from the units API.");
      }

      setUnits(data.units);
    } catch (error) {
      setLoadError(error.message || "Could not load units.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    setPropertiesLoading(true);
    setPropertyError("");

    try {
      const response = await fetch(PROPERTIES_URL, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Could not load properties.")
        );
      }

      const rawProperties = Array.isArray(data)
        ? data
        : data.properties || data.data?.properties || [];

      if (!Array.isArray(rawProperties)) {
        throw new Error("Unexpected response from the properties API.");
      }

      const normalized = rawProperties
        .map(normalizeProperty)
        .filter((property) => property.id);

      setProperties(normalized);

      if (normalized.length === 0) {
        setPropertyError(
          "No properties were returned. Create a property first or check the properties API."
        );
      }
    } catch (error) {
      setPropertyError(
        error.message ||
          "Could not load properties. Check your properties API route."
      );
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
    fetchProperties();
  }, [fetchUnits, fetchProperties]);

  const stats = useMemo(
    () => ({
      total: units.length,
      vacant: units.filter((unit) => unit.status === "Vacant").length,
      occupied: units.filter((unit) => unit.status === "Occupied").length,
      maintenance: units.filter(
        (unit) => unit.status === "Maintenance"
      ).length,
    }),
    [units]
  );

  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase();

    return units.filter((unit) => {
      const matchesSearch =
        !query ||
        String(unit.unitNumber || "").toLowerCase().includes(query) ||
        String(unit.propertyName || "").toLowerCase().includes(query) ||
        String(unit.tenant?.name || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || unit.status === statusFilter;

      const matchesProperty =
        propertyFilter === "All" ||
        String(unit.propertyId) === propertyFilter;

      return matchesSearch && matchesStatus && matchesProperty;
    });
  }, [units, search, statusFilter, propertyFilter]);

  function openModal() {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSubmitError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setFieldErrors({});
    setSubmitError("");
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setSubmitError("");
  }

  function validateForm() {
    const errors = {};

    if (!form.propertyId) {
      errors.propertyId = "Select a property.";
    }

    const unitNumber = form.unitNumber.trim();

    if (!unitNumber) {
      errors.unitNumber = "Unit number is required.";
    } else if (unitNumber.length > 50) {
      errors.unitNumber = "Unit number must be 50 characters or fewer.";
    }

    const rent = Number(form.rentAmount);
    if (form.rentAmount.trim() === "" || !Number.isFinite(rent) || rent < 0) {
      errors.rentAmount = "Enter a valid non-negative rent.";
    }

    const deposit =
      form.deposit.trim() === "" ? 0 : Number(form.deposit);

    if (!Number.isFinite(deposit) || deposit < 0) {
      errors.deposit = "Deposit must be zero or greater.";
    }

    for (const key of ["bedrooms", "bathrooms"]) {
      const value = Number(form[key]);

      if (
        form[key].trim() === "" ||
        !Number.isInteger(value) ||
        value < 0
      ) {
        errors[key] = "Enter a non-negative whole number.";
      }
    }

    if (form.size.trim() !== "") {
      const size = Number(form.size);

      if (!Number.isFinite(size) || size <= 0) {
        errors.size = "Size must be greater than zero.";
      }
    }

    if (!STATUSES.includes(form.status)) {
      errors.status = "Select a valid status.";
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    const errors = validateForm();
    setFieldErrors(errors);
    setSubmitError("");

    if (Object.keys(errors).length > 0) return;

    setSaving(true);

    try {
      const payload = {
        propertyId: form.propertyId,
        unitNumber: form.unitNumber.trim(),
        rentAmount: Number(form.rentAmount),
        deposit: form.deposit.trim() === "" ? 0 : Number(form.deposit),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        size: form.size.trim() === "" ? null : Number(form.size),
        status: form.status,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 409) {
        setSubmitError(
          data.error ||
            `This unit number already exists in the selected property.`
        );
        setFieldErrors((current) => ({
          ...current,
          unitNumber: "This unit already exists in this property.",
        }));
        return;
      }

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to create unit.")
        );
      }

      setModalOpen(false);
      setForm(EMPTY_FORM);
      setFieldErrors({});
      setNotice({
        type: "success",
        message: data.message || "Unit created successfully.",
      });

      await fetchUnits();
    } catch (error) {
      setSubmitError(error.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090b18] text-slate-100">
      {/* Ambient glassmorphism background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-24 h-96 w-96 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-[110px]" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/[0.08] px-3 py-1.5 text-xs font-medium text-violet-200">
              <Building2 size={14} />
              PROPERTY MANAGEMENT
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Unit Management
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage your properties, availability and rental units.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                fetchUnits();
                fetchProperties();
              }}
              disabled={loading || propertiesLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
            >
              <Plus size={18} />
              Add Unit
            </button>
          </div>
        </header>

        {/* Notification */}
        {notice && (
          <div
            role="status"
            className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              {notice.message}
            </span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss notification"
              className="rounded-lg p-1 hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Statistics */}
        <section
          aria-label="Unit statistics"
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            title="Total Units"
            value={loading ? "—" : stats.total}
            subtitle="Across all accessible properties"
            icon={Layers3}
            accent="violet"
          />
          <StatCard
            title="Vacant Units"
            value={loading ? "—" : stats.vacant}
            subtitle="Available for new tenants"
            icon={CheckCircle2}
            accent="emerald"
          />
          <StatCard
            title="Occupied Units"
            value={loading ? "—" : stats.occupied}
            subtitle="Currently occupied"
            icon={Users}
            accent="blue"
          />
          <StatCard
            title="Maintenance"
            value={loading ? "—" : stats.maintenance}
            subtitle="Units requiring attention"
            icon={Wrench}
            accent="amber"
          />
        </section>

        {/* Main panel */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.035] shadow-2xl shadow-black/20 backdrop-blur-2xl">
          <div className="flex flex-col gap-5 border-b border-white/[0.08] p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                All Units
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {loading
                  ? "Loading your units..."
                  : `${filteredUnits.length} of ${units.length} units`}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex">
              <label className="relative block xl:w-64">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search unit, property, tenant..."
                  aria-label="Search units"
                  className={`${inputClass} pl-10`}
                />
              </label>

              <label className="relative block xl:w-44">
                <SlidersHorizontal
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by status"
                  className={`${inputClass} appearance-none pl-10 pr-9`}
                >
                  <option value="All">All statuses</option>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </label>

              <label className="relative block xl:w-48">
                <select
                  value={propertyFilter}
                  onChange={(event) => setPropertyFilter(event.target.value)}
                  aria-label="Filter by property"
                  className={`${inputClass} appearance-none pr-9`}
                >
                  <option value="All">All properties</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </label>
            </div>
          </div>

          {loadError && (
            <div
              role="alert"
              className="m-5 flex flex-col gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="flex items-start gap-2 text-sm text-rose-200">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                {loadError}
              </p>
              <button
                type="button"
                onClick={fetchUnits}
                className="self-start rounded-lg border border-rose-300/20 px-3 py-2 text-xs text-rose-200 hover:bg-rose-400/10 sm:self-auto"
              >
                Try again
              </button>
            </div>
          )}

          {/* Responsive table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                  {[
                    "UNIT",
                    "PROPERTY",
                    "RENT / MONTH",
                    "TENANT",
                    "STATUS",
                    "DETAILS",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 text-[10px] font-semibold tracking-[0.13em] text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.055]">
                {loading && units.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-20 text-center">
                      <LoaderCircle
                        size={28}
                        className="mx-auto animate-spin text-violet-300"
                      />
                      <p className="mt-4 text-sm text-slate-400">
                        Loading units...
                      </p>
                    </td>
                  </tr>
                ) : !loadError && filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-20 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                        <Inbox size={25} className="text-slate-500" />
                      </div>
                      <p className="mt-4 font-medium text-slate-200">
                        {units.length === 0
                          ? "No units yet"
                          : "No matching units"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {units.length === 0
                          ? "Add your first unit to get started."
                          : "Try changing your search or filters."}
                      </p>
                      {units.length === 0 && (
                        <button
                          type="button"
                          onClick={openModal}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
                        >
                          <Plus size={16} />
                          Add your first unit
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map((unit) => (
                    <tr
                      key={unit.id}
                      className="transition hover:bg-white/[0.035]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/10 bg-violet-400/[0.09]">
                            <DoorOpen
                              size={19}
                              className="text-violet-300"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {unit.unitNumber || "Unnamed unit"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              ID: {String(unit.id || "").slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-48 truncate text-sm text-slate-200">
                          {unit.propertyName || "Unknown property"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="whitespace-nowrap text-sm font-semibold text-white">
                          {money(unit.rentAmount)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Deposit: {money(unit.deposit)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {unit.tenant ? (
                          <>
                            <p className="text-sm text-slate-200">
                              {unit.tenant.name || "Tenant"}
                            </p>
                            <p className="mt-1 max-w-44 truncate text-xs text-slate-500">
                              {unit.tenant.email || "No email"}
                            </p>
                          </>
                        ) : (
                          <span className="text-sm text-slate-500">
                            No tenant
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={unit.status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <BedDouble size={14} />
                            {unit.bedrooms ?? 0}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Bath size={14} />
                            {unit.bathrooms ?? 0}
                          </span>
                          {unit.size != null && (
                            <span className="inline-flex items-center gap-1">
                              <Ruler size={13} />
                              {unit.size}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-col gap-2 border-t border-white/[0.07] px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {filteredUnits.length} unit
              {filteredUnits.length === 1 ? "" : "s"}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live data from your units API
            </span>
          </footer>
        </section>

        <p className="mt-6 text-center text-xs text-slate-600">
          Property Management · Unit Overview
        </p>
      </div>

      {/* Add Unit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-md sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-unit-title"
            className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#111426]/95 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          >
            <div className="flex items-start justify-between border-b border-white/[0.08] p-5 sm:p-6">
              <div>
                <div className="mb-2 inline-flex rounded-lg bg-violet-400/10 p-2.5 text-violet-300">
                  <Building2 size={21} />
                </div>
                <h2
                  id="add-unit-title"
                  className="text-xl font-semibold text-white"
                >
                  Add New Unit
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Enter the unit details below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close dialog"
                className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <div className="sm:col-span-2">
                  <Field label="Property *" error={fieldErrors.propertyId}>
                    <select
                      name="propertyId"
                      value={form.propertyId}
                      onChange={updateField}
                      disabled={propertiesLoading || saving}
                      className={inputClass}
                      aria-invalid={!!fieldErrors.propertyId}
                    >
                      <option value="">
                        {propertiesLoading
                          ? "Loading properties..."
                          : "Select a property"}
                      </option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                    {propertyError && (
                      <p className="mt-2 text-xs text-amber-300">
                        {propertyError}
                      </p>
                    )}
                  </Field>
                </div>

                <Field label="Unit Number *" error={fieldErrors.unitNumber}>
                  <input
                    name="unitNumber"
                    value={form.unitNumber}
                    onChange={updateField}
                    placeholder="e.g. A-101"
                    maxLength={50}
                    autoComplete="off"
                    className={inputClass}
                    aria-invalid={!!fieldErrors.unitNumber}
                    disabled={saving}
                  />
                </Field>

                <Field label="Monthly Rent (BDT) *" error={fieldErrors.rentAmount}>
                  <input
                    name="rentAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.rentAmount}
                    onChange={updateField}
                    placeholder="18000"
                    className={inputClass}
                    aria-invalid={!!fieldErrors.rentAmount}
                    disabled={saving}
                  />
                </Field>

                <Field label="Security Deposit (BDT)" error={fieldErrors.deposit}>
                  <input
                    name="deposit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.deposit}
                    onChange={updateField}
                    placeholder="0"
                    className={inputClass}
                    aria-invalid={!!fieldErrors.deposit}
                    disabled={saving}
                  />
                </Field>

                <Field label="Unit Status *" error={fieldErrors.status}>
                  <select
                    name="status"
                    value={form.status}
                    onChange={updateField}
                    className={inputClass}
                    disabled={saving}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Bedrooms" error={fieldErrors.bedrooms}>
                  <input
                    name="bedrooms"
                    type="number"
                    min="0"
                    step="1"
                    value={form.bedrooms}
                    onChange={updateField}
                    className={inputClass}
                    aria-invalid={!!fieldErrors.bedrooms}
                    disabled={saving}
                  />
                </Field>

                <Field label="Bathrooms" error={fieldErrors.bathrooms}>
                  <input
                    name="bathrooms"
                    type="number"
                    min="0"
                    step="1"
                    value={form.bathrooms}
                    onChange={updateField}
                    className={inputClass}
                    aria-invalid={!!fieldErrors.bathrooms}
                    disabled={saving}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Size (sq ft, optional)" error={fieldErrors.size}>
                    <input
                      name="size"
                      type="number"
                      min="0.01"
                      step="any"
                      value={form.size}
                      onChange={updateField}
                      placeholder="e.g. 1200"
                      className={inputClass}
                      aria-invalid={!!fieldErrors.size}
                      disabled={saving}
                    />
                  </Field>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-3.5 text-sm text-rose-200 sm:col-span-2"
                  >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] bg-white/[0.02] p-5 sm:flex-row sm:justify-end sm:p-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || propertiesLoading || properties.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:from-violet-500 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Creating Unit...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Create Unit
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
