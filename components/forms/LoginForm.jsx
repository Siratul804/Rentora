"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const { loginAs } = useAuth();
  const [email, setEmail] = useState("owner@rentora.com");
  const [password, setPassword] = useState("••••••••");
  const [role, setRole] = useState(ROLES.OWNER);

  const handleSubmit = (e) => {
    e.preventDefault();
    const destination = loginAs(role);
    router.push(destination);
  };

  const handleQuickLogin = (selectedRole) => {
    setRole(selectedRole);
    const destination = loginAs(selectedRole);
    router.push(destination);
  };

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="name@example.com"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Select Role
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRole(ROLES.SUPER_ADMIN)}
              className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                role === ROLES.SUPER_ADMIN
                  ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold"
                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => setRole(ROLES.OWNER)}
              className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                role === ROLES.OWNER
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              🏢 Owner
            </button>
            <button
              type="button"
              onClick={() => setRole(ROLES.TENANT)}
              className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                role === ROLES.TENANT
                  ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              👤 Tenant
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full mt-2" size="lg">
          Sign In to Portal
        </Button>
      </form>

      {/* Quick 1-click test logins */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="text-xs font-medium text-zinc-500 text-center mb-3">
          ⚡ 1-Click Demo Login
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin(ROLES.SUPER_ADMIN)}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-colors"
          >
            <span>👑 Sign in as <strong>Super Admin</strong></span>
            <span>→</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin(ROLES.OWNER)}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors"
          >
            <span>🏢 Sign in as <strong>Owner / Landlord</strong></span>
            <span>→</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin(ROLES.TENANT)}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-colors"
          >
            <span>👤 Sign in as <strong>Tenant / Renter</strong></span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
