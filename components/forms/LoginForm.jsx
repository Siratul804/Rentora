"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        router.push(res.redirectUrl);
        router.refresh();
      } else {
        setError(res.error || "Failed to log in. Please check your credentials.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (fillEmail, fillPass) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError("");
  };

  return (
    <div className="w-full space-y-5">
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="name@example.com"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          disabled={loading}
        >
          {loading ? "Authenticating..." : "Sign In to Portal"}
        </Button>
      </form>

      {/* Role explanation & helper */}
      <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800 space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-center">
          ⚡ Quick Fill Helper
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill("admin@rentora.com", "admin123456")}
            className="p-2.5 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-left transition-colors text-xs"
          >
            <div className="font-semibold text-purple-600 dark:text-purple-400 flex items-center justify-between">
              <span>👑 Admin (.env)</span>
              <span className="text-[10px] text-purple-400">Fill</span>
            </div>
            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
              admin@rentora.com
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill("owner@rentora.com", "owner123456")}
            className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-left transition-colors text-xs"
          >
            <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>🏢 Owner</span>
              <span className="text-[10px] text-emerald-400">Fill</span>
            </div>
            <div className="text-[11px] text-zinc-400 truncate mt-0.5">
              owner@rentora.com
            </div>
          </button>
        </div>

        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center">
          👤 <strong>Tenants:</strong> Log in using the email and password assigned by your property owner.
        </div>
      </div>
    </div>
  );
}
