"use client";

import React from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

const TIERS = [
  {
    name: "Starter",
    price: 1999,
    period: "/month",
    description: "Ideal for landlords managing 1 - 2 residential buildings.",
    features: ["Up to 10 Units", "Automated Rent Invoices", "Tenant Portal Access", "SSLCommerz Payment Link", "Email Notifications"],
    activeSubscribers: 42,
    badge: "Popular for Solo Landlords",
  },
  {
    name: "Growth",
    price: 4999,
    period: "/month",
    description: "For growing property managers and small real estate firms.",
    features: ["Up to 50 Units", "Maintenance Dispatching", "SMS & WhatsApp Reminders", "Financial & Expense Reports", "Priority Support"],
    activeSubscribers: 68,
    badge: "Most Popular",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: 12999,
    period: "/month",
    description: "Unlimited units, dedicated account manager, API integrations.",
    features: ["Unlimited Units", "Dedicated Dispatch Coordinator", "Custom Tenant Contracts", "White-label Portal", "SLA Guarantee 99.9%"],
    activeSubscribers: 24,
    badge: "Full Power",
  },
];

export default function AdminSubscriptionsPage() {
  return (
    <DashboardShell
      portal="admin"
      title="SaaS Subscriptions & Billing"
      subtitle="Manage pricing tiers, recurring billing with SSLCommerz, and active landlord licenses"
      actions={
        <Button variant="outline" size="md">
          Export Billing Ledger
        </Button>
      }
    >
      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIERS.map((tier) => (
          <Card
            key={tier.name}
            className={`relative overflow-hidden flex flex-col justify-between ${
              tier.highlight ? "border-purple-500 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500" : ""
            }`}
          >
            {tier.highlight && (
              <div className="bg-purple-600 text-white text-[11px] font-bold text-center py-1 uppercase tracking-wider">
                {tier.badge}
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{tier.name}</CardTitle>
                <Badge variant={tier.highlight ? "purple" : "neutral"} size="sm">
                  {tier.activeSubscribers} Active
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{tier.description}</p>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(tier.price)}
                </span>
                <span className="text-xs text-zinc-400 ml-1">{tier.period}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-xs space-y-2 text-zinc-600 dark:text-zinc-300">
                {tier.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Button
                  variant={tier.highlight ? "primary" : "outline"}
                  className="w-full text-xs"
                >
                  Edit Plan Parameters
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
