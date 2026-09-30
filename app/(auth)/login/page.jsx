
import React from "react";
import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata = {
  title: "Sign In — Rentora",
  description: "Sign in to your Rentora portal account (Super Admin, Owner, or Tenant)",
};

export default function LoginPage() {
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
            Welcome back
          </h1>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Access your property management or tenant portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/30 dark:bg-zinc-900/30 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-zinc-900/10">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Create an account
          </Link>
        </p>

      </div>
    </div>
  );
}

