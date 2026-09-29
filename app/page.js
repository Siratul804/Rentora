import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Top Navbar */}
      <header className="h-20 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-emerald-500/20">
            R
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Rentora
          </span>
          <Badge variant="purple" size="sm" className="hidden sm:inline-flex ml-2">
            Multi-Tenant SaaS
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold px-4 py-2 text-zinc-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link href="/register">
            <Button size="sm" variant="primary">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-16 max-w-6xl mx-auto w-full text-center space-y-12">
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
            <span>✨</span> Next-Generation Rental Operations & On-Demand Dispatch
          </div>
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
          <div className="p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-purple-950/20 to-zinc-900/60 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">👑</span>
                <Badge variant="purple" size="sm">Super Admin</Badge>
              </div>
              <h3 className="text-xl font-bold text-white">Platform Admin</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Platform governance, landlord subscriptions, service-provider fleet oversight, and system audits.
              </p>
              <div className="text-[11px] text-zinc-500 space-y-1 pt-2">
                <div>• /admin/dashboard</div>
                <div>• /admin/owners</div>
                <div>• /admin/subscriptions</div>
                <div>• /admin/service-providers</div>
                <div>• /admin/reports</div>
              </div>
            </div>
            <div className="pt-6">
              <Link href="/admin/dashboard" className="block">
                <Button size="sm" variant="secondary" className="w-full bg-purple-900/50 hover:bg-purple-800 text-purple-200 border-purple-500/30">
                  Launch Admin Portal →
                </Button>
              </Link>
            </div>
          </div>

          {/* Owner Card */}
          <div className="p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-zinc-900/60 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500 transition-all duration-300 flex flex-col justify-between ring-1 ring-emerald-500/30">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">🏢</span>
                <Badge variant="success" size="sm">Landlord</Badge>
              </div>
              <h3 className="text-xl font-bold text-white">Property Owner</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Buildings, units, tenants, digital leases, automated rent invoices, and technician assignment.
              </p>
              <div className="text-[11px] text-zinc-500 space-y-1 pt-2">
                <div>• /owner/dashboard</div>
                <div>• /owner/properties & /tenants</div>
                <div>• /owner/leases & /invoices</div>
                <div>• /owner/payments & /maintenance</div>
                <div>• /owner/reports</div>
              </div>
            </div>
            <div className="pt-6">
              <Link href="/owner/dashboard" className="block">
                <Button size="sm" variant="primary" className="w-full">
                  Launch Owner Portal →
                </Button>
              </Link>
            </div>
          </div>

          {/* Tenant Card */}
          <div className="p-6 rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-zinc-900/60 backdrop-blur-xl relative overflow-hidden group hover:border-blue-500 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">👤</span>
                <Badge variant="info" size="sm">Resident</Badge>
              </div>
              <h3 className="text-xl font-bold text-white">Tenant Portal</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                View lease terms, pay monthly rent via SSLCommerz, and submit instant maintenance repair requests.
              </p>
              <div className="text-[11px] text-zinc-500 space-y-1 pt-2">
                <div>• /tenant/dashboard</div>
                <div>• /tenant/payments</div>
                <div>• /tenant/maintenance</div>
                <div>• /tenant/lease</div>
                <div>• /tenant/profile</div>
              </div>
            </div>
            <div className="pt-6">
              <Link href="/tenant/dashboard" className="block">
                <Button size="sm" variant="secondary" className="w-full bg-blue-900/50 hover:bg-blue-800 text-blue-200 border-blue-500/30">
                  Launch Tenant Portal →
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Architecture Visual Diagram */}
        <div className="w-full p-8 rounded-3xl border border-zinc-800 bg-zinc-900/40 text-left space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-zinc-400">
              System Architecture & Routing Flow
            </span>
            <Badge variant="neutral" size="sm">Multi-Tenant RBAC</Badge>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed border border-zinc-800/80">
            <pre className="text-emerald-400 font-bold mb-2">                    RENTORA WEB APP</pre>
            <pre className="text-zinc-500">                          │</pre>
            <pre className="text-teal-400 font-bold">                       Next.js</pre>
            <pre className="text-zinc-500">                          │</pre>
            <pre className="text-zinc-400">          ┌───────────────┼───────────────┐</pre>
            <pre className="text-zinc-400">          ↓               ↓               ↓</pre>
            <pre><span className="text-purple-400 font-bold">       /admin</span><span className="text-zinc-500">           </span><span className="text-emerald-400 font-bold">/owner</span><span className="text-zinc-500">          </span><span className="text-blue-400 font-bold">/tenant</span></pre>
            <pre className="text-zinc-400">          │               │               │</pre>
            <pre className="text-zinc-400">          └───────────────┼───────────────┘</pre>
            <pre className="text-zinc-500">                          ↓</pre>
            <pre className="text-amber-400 font-bold">                     Backend API</pre>
            <pre className="text-zinc-500">                          ↓</pre>
            <pre className="text-emerald-500 font-bold">                       MongoDB</pre>
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
