"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await register({ name, email, password, phone });
      if (res.success) {
        router.push(res.redirectUrl || "/owner/dashboard");
        router.refresh();
      } else {
        setError(res.error || "Failed to create account. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-emerald-600/30">
              R
            </div>
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Rentora
            </span>
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Property Owner Sign Up
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Create an owner account to manage your properties and onboard tenants
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <span className="text-xl">🏢</span>
              <div>
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Role: Property Owner / Landlord
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  Full control over properties, leases, and tenant onboarding
                </div>
              </div>
            </div>

            <Input
              label="Full Name"
              type="text"
              required
              placeholder="e.g. Siratul Islam"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Email Address"
              type="email"
              required
              placeholder="e.g. owner@rentora.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+880 1700-000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Input
              label="Create Password"
              type="password"
              required
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              className="w-full mt-4"
              size="lg"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Register as Property Owner"}
            </Button>
          </form>

          {/* Tenant note */}
          <div className="mt-5 pt-4 border-t border-zinc-200/80 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-1.5">
            <p>
              👤 <strong>Are you a Tenant?</strong>
            </p>
            <p className="text-[11px] text-zinc-400">
              Tenants do not register here. Your property owner will create your account and assign your unit. Once created, you can simply{" "}
              <Link href="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Sign in here
              </Link>
              .
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
