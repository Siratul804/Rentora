"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/tables/DataTable";
import { formatCurrency } from "@/lib/utils";

const PAYMENT_HISTORY = [
  { id: "INV-109", month: "September 2026", amount: 34500, paidVia: "bKash (SSLCommerz)", date: "2026-09-03", status: "Paid" },
  { id: "INV-098", month: "August 2026", amount: 34500, paidVia: "Visa Card (SSLCommerz)", date: "2026-08-04", status: "Paid" },
  { id: "INV-087", month: "July 2026", amount: 34500, paidVia: "Nagad (SSLCommerz)", date: "2026-07-02", status: "Paid" },
];

export default function TenantPaymentsPage() {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setPaid(true);
    }, 1200);
  };

  const columns = [
    {
      header: "Invoice #",
      accessor: "id",
    },
    {
      header: "Billing Period",
      accessor: "month",
    },
    {
      header: "Amount",
      accessor: (row) => <strong>{formatCurrency(row.amount)}</strong>,
    },
    {
      header: "Payment Channel",
      accessor: "paidVia",
    },
    {
      header: "Paid Date",
      accessor: "date",
    },
    {
      header: "Status",
      accessor: (row) => <Badge variant="success" size="sm">{row.status}</Badge>,
    },
    {
      header: "Receipt",
      accessor: () => (
        <Button size="sm" variant="ghost">
          Download PDF
        </Button>
      ),
    },
  ];

  return (
    <DashboardShell
      portal="tenant"
      title="Rent & Utility Payments"
      subtitle="Pay monthly rent securely through SSLCommerz (bKash, Nagad, Visa, Mastercard, Internet Banking)"
    >
      {/* Current Invoice Checkout Card */}
      <Card className="border-emerald-500/40 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold opacity-90">
              Current Statement
            </span>
            <h3 className="text-xl font-bold">October 2026 Rent Invoice</h3>
          </div>
          <Badge variant="neutral" className="bg-white/20 text-white border-white/30 self-start sm:self-auto">
            Due in 6 Days (Oct 05, 2026)
          </Badge>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <div className="flex justify-between text-sm py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Unit Rent (3 Bed / 3 Bath):</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(32000)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Service & Water Charge:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(2500)}</span>
              </div>
              <div className="flex justify-between text-base py-3 border-b border-zinc-200 dark:border-zinc-700 font-bold">
                <span className="text-zinc-900 dark:text-zinc-100">Total Payable:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-xl">{formatCurrency(34500)}</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-center space-y-4">
              <div className="text-xs text-zinc-500">
                🔒 Secured by SSLCommerz 256-bit Bank Grade Gateway
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400">
                <span>bKash</span> • <span>Nagad</span> • <span>Rocket</span> • <span>Visa</span> • <span>Mastercard</span>
              </div>

              {paid ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 font-semibold text-sm">
                  ✓ Payment Successful! Receipt generated.
                </div>
              ) : (
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full text-base"
                  onClick={handlePay}
                  disabled={paying}
                >
                  {paying ? "Connecting to SSLCommerz..." : "Proceed to Pay ৳ 34,500"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Past Payment Receipts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={PAYMENT_HISTORY} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
