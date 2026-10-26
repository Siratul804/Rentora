"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

const glassCard =
  "bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg shadow-zinc-900/5 dark:shadow-black/10 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/10 hover:border-emerald-500/30";

export default function OwnerBillsPage() {
  const [data, setData] = useState({ payment: null, bills: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBills() {
      try {
        const res = await fetch("/api/owner/payment-info");
        if (res.ok) {
          const result = await res.json();
          setData({
            payment: result.payment || null,
            bills: result.bills || [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch owner bills:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBills();
  }, []);

  const payment = data.payment;
  const bills = data.bills;

  return (
    <DashboardShell
      portal="owner"
      title="My Bills"
      subtitle="View your property owner platform subscription bills, payment status, and gateway transaction records."
      actions={
        <div className="flex items-center gap-2">
          <Link href="/owner/dashboard">
            <Button variant="outline" size="sm">
              ← Dashboard
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={glassCard}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-2xl">💳</span>
                <Badge variant={payment?.status === "Paid" ? "success" : "warning"} size="sm">
                  {payment?.status === "Paid" ? "Paid ✓" : "Pending"}
                </Badge>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {payment?.status === "Paid" ? "Active Account" : "Pending Activation"}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Membership Status
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-2xl">💰</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  One-time
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(payment?.amount || 499)}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Total Platform Billed
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🔒</span>
                <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                  SSLCommerz
                </span>
              </div>
              <div className="mt-3">
                <div className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                  {payment?.gateway || "SSLCommerz Sandbox"}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Payment Gateway
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-2xl">📜</span>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                  Lifetime
                </span>
              </div>
              <div className="mt-3">
                <div className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                  Owner Platform License
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Subscription Plan
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Bills Table Card */}
        <Card className={glassCard}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">My Bills</CardTitle>
                <Badge variant={payment?.status === "Paid" ? "success" : "warning"} size="sm">
                  {payment?.status === "Paid" ? "Paid in Full ✓" : "Pending"}
                </Badge>
              </div>
              <CardDescription>
                Detailed breakdown of your property owner platform bills and charges
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-xs text-zinc-400">Loading your bills...</div>
            ) : bills.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400">No bills found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/30 dark:bg-zinc-950/30 backdrop-blur-lg text-zinc-500 dark:text-zinc-400 uppercase font-semibold border-y border-white/40 dark:border-zinc-700/50">
                    <tr>
                      <th className="px-5 py-3">Bill Item</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Payment Method</th>
                      <th className="px-5 py-3">Transaction ID</th>
                      <th className="px-5 py-3">Validation ID</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40 dark:divide-zinc-700/40">
                    {bills.map((bill, index) => (
                      <tr
                        key={bill.id || index}
                        className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors duration-200"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <span>🧾</span>
                            <span>{bill.title}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {bill.description}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400 font-medium">
                          {bill.category}
                        </td>
                        <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatCurrency(bill.amount)}
                        </td>
                        <td className="px-5 py-4 text-zinc-700 dark:text-zinc-300">
                          <span className="font-medium">{bill.gateway}</span>
                        </td>
                        <td className="px-5 py-4 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                          {bill.tranId || "N/A"}
                        </td>
                        <td className="px-5 py-4 font-mono text-[11px] text-zinc-500">
                          {bill.valId || "Verified"}
                        </td>
                        <td className="px-5 py-4 text-zinc-500">
                          {bill.paidAt ? new Date(bill.paidAt).toLocaleDateString() : "Active"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Badge
                            variant={bill.status === "Paid" ? "success" : "warning"}
                            size="sm"
                          >
                            {bill.status === "Paid" ? "Paid ✓" : "Pending"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security & Verification Note */}
        <div className="p-4 rounded-2xl bg-zinc-100/60 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
          <div className="font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
            <span>🛡️</span>
            <span>SSLCommerz Server Verification Guarantee</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            All owner licensing payments are authorized and securely verified through SSLCommerz Order Validation API.
            Transactions are recorded in your account ledger and permanently attached to your Property Owner profile.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
