"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

function DemoCheckout() {
  const searchParams = useSearchParams();
  const tranId = searchParams.get("tran_id") || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const completeDemoPayment = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payment/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tran_id: tranId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not complete the demo payment.");
      }
      window.location.assign(data.redirectUrl);
    } catch (paymentError) {
      setError(paymentError.message || "Could not complete the demo payment.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <section className="w-full max-w-md space-y-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-center">
          <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            RENTORA · DEMO CHECKOUT
          </div>
          <h1 className="mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Owner activation
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            This is a simulated payment. No money or payment details are collected.
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800">
          <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-300">
            <span>Owner account activation</span>
            <span>BDT 499</span>
          </div>
          <div className="mt-3 border-t border-zinc-200 pt-3 text-xs text-zinc-500 dark:border-zinc-700">
            Demo transaction: {tranId || "Missing transaction ID"}
          </div>
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <Button
          type="button"
          className="w-full"
          disabled={loading || !tranId}
          onClick={completeDemoPayment}
        >
          {loading ? "Completing demo..." : "Simulate successful payment"}
        </Button>

        <Link
          href="/login?payment=cancelled"
          className="block text-center text-sm text-zinc-500 hover:underline"
        >
          Cancel and return to sign in
        </Link>
      </section>
    </main>
  );
}

export default function DemoPaymentPage() {
  return (
    <Suspense fallback={<main className="p-8 text-center">Loading demo checkout...</main>}>
      <DemoCheckout />
    </Suspense>
  );
}
