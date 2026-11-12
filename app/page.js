"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { ArrowRight, Building2, Check, Crown, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  const portalHref = (portal) => user?.role === portal
    ? `/${portal}/dashboard`
    : `/login?portal=${portal}&switch=1`;
  const accountFeatures = {
    admin: ["Approve and oversee owner accounts", "Manage subscriptions and service providers", "Review platform-wide operational reports"],
    owner: ["Manage buildings, units, tenants, and leases", "Track rent invoices and online or cash payments", "Assign and monitor tenant maintenance requests"],
    tenant: ["Review lease details and rent invoices", "Pay rent online and track payment history", "Request and follow up on property maintenance"],
  };
  return (
    <div className="home-page min-h-screen flex flex-col bg-transparent text-zinc-100 selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Top Navbar */}
      <header className="home-header min-h-20 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-12 py-3 sm:py-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {/*
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-emerald-500/20">
            R
          </div>
          */}
          <Image
              src="/rentora_logo.png"
              alt="Rentora Logo"
              width={38}
              height={40}
              className="h-10 w-auto shrink-0 rounded-2xl"
          />
          <span className="text-xl font-bold tracking-tight text-white">
            Rentora
          </span>
          <Badge variant="purple" size="sm" className="shrink-0 whitespace-nowrap leading-none">
            Multi-Tenant SaaS
          </Badge>
        </div>

        <div className="flex items-center justify-end gap-3 sm:shrink-0">
          <Link
            href="/login"
            className="whitespace-nowrap px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:text-white dark:rounded-xl dark:border dark:border-white/15 dark:bg-zinc-950/75 dark:text-zinc-100 dark:shadow-sm dark:backdrop-blur-md dark:hover:bg-zinc-900/90"
          >
            Sign In
          </Link>
          <Link href="/register" className="shrink-0 whitespace-nowrap">
            <Button size="sm" variant="primary">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-16 max-w-6xl mx-auto w-full text-center space-y-12">
        <div className="space-y-4 max-w-3xl mx-auto">

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            One Platform. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
              Three Powerful Portals.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Centralized property management, automated rent invoices via SSLCommerz, and instantaneous service-provider dispatching for plumbers and electricians.
          </p>
        </div>

        {/* 3 Portal Launch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {/* Admin Card */}
          <div className="home-portal-card p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-purple-950/20 to-zinc-900/60 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Crown aria-hidden="true" size={30} strokeWidth={1.8} />
                <Badge variant="purple" size="sm">Super Admin</Badge>
              </div>
              <h3 className="text-xl font-bold text-white">Platform Admin</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Platform governance, landlord subscriptions, service-provider fleet oversight, and system audits.
              </p>
              <div className="space-y-2 pt-2">
                {accountFeatures.admin.map((feature) => <div key={feature} className="flex items-start gap-2 text-xs text-zinc-400"><Check size={14} className="mt-0.5 shrink-0 text-purple-400" />{feature}</div>)}
              </div>
            </div>
            <div className="pt-6">
              <Link href={portalHref("admin")} className="block">
                <Button size="sm" variant="secondary" className="w-full bg-purple-900/50 hover:bg-purple-800 text-purple-200 border-purple-500/30">
                  Launch Admin Portal <ArrowRight aria-hidden="true" size={16} />
                </Button>
              </Link>
            </div>
          </div>

          {/* Owner Card */}
          <div className="home-portal-card p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-zinc-900/60 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500 transition-all duration-300 flex flex-col justify-between ring-1 ring-emerald-500/30">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Building2 aria-hidden="true" size={30} strokeWidth={1.8} />
                <Badge variant="success" size="sm">Landlord</Badge>
              </div>
              <h3 className="text-xl font-bold text-white">Property Owner</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Buildings, units, tenants, digital leases, automated rent invoices, and technician assignment.
              </p>
              <div className="space-y-2 pt-2">
                {accountFeatures.owner.map((feature) => <div key={feature} className="flex items-start gap-2 text-xs text-zinc-400"><Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />{feature}</div>)}
              </div>
            </div>
            <div className="pt-6">
              <Link href={portalHref("owner")} className="block">
                <Button size="sm" variant="primary" className="w-full">
                  Launch Owner Portal <ArrowRight aria-hidden="true" size={16} />
                </Button>
              </Link>
            </div>
          </div>

          {/* Tenant Card */}
          <div className="home-portal-card p-6 rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-zinc-900/60 backdrop-blur-xl relative overflow-hidden group hover:border-blue-500 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <UserRound aria-hidden="true" size={30} strokeWidth={1.8} />
                <Badge variant="info" size="sm">Resident</Badge>
              </div>
              <h3 className="text-xl font-bold text-white">Tenant Portal</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                View lease terms, pay monthly rent via SSLCommerz, and submit instant maintenance repair requests.
              </p>
              <div className="space-y-2 pt-2">
                {accountFeatures.tenant.map((feature) => <div key={feature} className="flex items-start gap-2 text-xs text-zinc-400"><Check size={14} className="mt-0.5 shrink-0 text-blue-400" />{feature}</div>)}
              </div>
            </div>
            <div className="pt-6">
              <Link href={portalHref("tenant")} className="block">
                <Button size="sm" variant="secondary" className="w-full bg-blue-900/50 hover:bg-blue-800 text-blue-200 border-blue-500/30">
                  Launch Tenant Portal <ArrowRight aria-hidden="true" size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 px-6 text-center text-xs text-zinc-500">
        <p>Rentora Multi-Tenant SaaS Platform • Academic Project</p>
      </footer>
    </div>
  );
}
