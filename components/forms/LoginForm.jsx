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
      {/* Role explanation & helper */}
      <div className="pt-5 border-t border-zinc-200/80 dark:border-zinc-800 space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-center">
          ⚡ Quick Fill Helper
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Admin — centered single */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => handleQuickFill("admin@rentora.com", "admin123456")}
              className="group w-full sm:w-1/2 p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/40 active:scale-[0.98] text-left transition-all duration-200 text-xs"
            >
              <div className="font-semibold text-purple-600 dark:text-purple-400 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">👑</span>
                  <span>Admin</span>
                </span>
                <span className="text-[10px] font-medium text-purple-400 opacity-70 group-hover:opacity-100 transition-opacity">
                  Fill →
                </span>
              </div>
            </button>
          </div>

          {/* Owner + Tenant — side by side */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickFill("23201128@uap-bd.edu", "23201128")}
              className="group p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 active:scale-[0.98] text-left transition-all duration-200 text-xs"
            >
              <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">🏢</span>
                  <span>Owner</span>
                </span>
                <span className="text-[10px] font-medium text-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity">
                  Fill →
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("23201111@uap-bd.edu", "23201111")}
              className="group p-3 rounded-xl border border-blue-500/25 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/40 active:scale-[0.98] text-left transition-all duration-200 text-xs"
            >
              <div className="font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">👤</span>
                  <span>Tenant</span>
                </span>
                <span className="text-[10px] font-medium text-blue-400 opacity-70 group-hover:opacity-100 transition-opacity">
                  Fill →
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
