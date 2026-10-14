"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { tenantRentalApi } from "@/lib/api";

export default function TenantLeasePage() {
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRentalInfo = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await tenantRentalApi.getRentalInfo();
      if (data?.rental) {
        setRental(data.rental);
      } else {
        setError("Rental information not found.");
      }
    } catch (err) {
      console.error("Failed to load rental details:", err);
      setError(err.message || "Failed to load rental information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRentalInfo();
  }, [fetchRentalInfo]);

  if (loading) {
    return (
      <DashboardShell
        portal="tenant"
        title="My Lease Agreement"
        subtitle="Digital contract details, house rules, landlord contacts, and security deposit terms"
      >
        <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
          Loading your rental information...
        </div>
      </DashboardShell>
    );
  }

  if (error && !rental) {
    return (
      <DashboardShell
        portal="tenant"
        title="My Lease Agreement"
        subtitle="Digital contract details, house rules, landlord contacts, and security deposit terms"
      >
        <Card className="p-8 text-center space-y-3">
          <div className="text-3xl">⚠️</div>
          <div className="font-semibold text-zinc-800 dark:text-zinc-200">
            {error}
          </div>
          <p className="text-xs text-zinc-500">
            Please contact your landlord or property management office to verify your tenancy assignment.
          </p>
          <div className="pt-2">
            <Button size="sm" variant="outline" onClick={fetchRentalInfo}>
              Retry Loading
            </Button>
          </div>
        </Card>
      </DashboardShell>
    );
  }

  const monthlyRent = rental?.financials?.monthlyRent || 32000;
  const securityDeposit = rental?.financials?.securityDeposit || 64000;
  const billingCycle = rental?.financials?.billingCycle || "1st - 5th Monthly";
  const leaseStart = rental?.terms?.leaseStart ? formatDate(rental.terms.leaseStart) : "March 01, 2025";
  const leaseEnd = rental?.terms?.leaseEnd ? formatDate(rental.terms.leaseEnd) : "February 28, 2027";

  return (
    <DashboardShell
      portal="tenant"
      title="My Lease Agreement"
      subtitle="Digital contract details, house rules, landlord contacts, and security deposit terms"
      actions={
        <Button variant="outline" size="md">
          Download Signed Copy (PDF)
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tenancy Contract #{rental?.contractId || "L-2025-01"}</CardTitle>
              <Badge variant={rental?.status === "Active Lease" ? "success" : "warning"}>
                {rental?.status || "Active Lease"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <span className="text-zinc-400">Monthly Rent</span>
                <div className="text-base font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
                  {formatCurrency(monthlyRent)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <span className="text-zinc-400">Security Deposit</span>
                <div className="text-base font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
                  {formatCurrency(securityDeposit)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <span className="text-zinc-400">Billing Cycle</span>
                <div className="text-base font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
                  {billingCycle}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Key Terms & Clauses</h4>
              <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
                <li>Lease duration from {leaseStart} to {leaseEnd}.</li>
                <li>Electricity & Gas utility bills to be settled directly or bundled into the monthly statement.</li>
                <li>Premises reserved strictly for private residential occupancy by the registered tenant.</li>
                <li>Maintenance & repairs of internal fixtures serviced via Rentora On-Demand Technicians.</li>
                <li>Two months prior written notice required for voluntary lease termination or renewal.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Landlord Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Landlord & Building Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <span className="text-zinc-400">Landlord / Owner:</span>
              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5">
                {rental?.landlord?.name || "Siratul Islam"}
              </div>
              <div className="text-zinc-500">{rental?.landlord?.email || "siratul@rentora.com"}</div>
              <div className="text-zinc-500">{rental?.landlord?.phone || "+880 1711-223344"}</div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-400">Building Management:</span>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {rental?.property?.managementOffice || `${rental?.property?.name || "Green Horizon Residency"} Caretaker Office`}
              </div>
              <div className="text-zinc-500">{rental?.property?.address || "Gate #1, Ground Floor"}</div>
              <div className="text-zinc-500">{rental?.property?.hotline || "Security Hotline: +880 1911-001122"}</div>
            </div>

            <div className="pt-4">
              <Button variant="outline" className="w-full text-xs">
                Request Lease Extension / Renewal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
