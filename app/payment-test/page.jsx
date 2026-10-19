"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

function PaymentTestContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const tranId = searchParams.get("tran_id");
  const valId = searchParams.get("val_id");
  const amount = searchParams.get("amount");
  const cardType = searchParams.get("card_type");
  const errorParam = searchParams.get("error");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (data.success && data.gatewayUrl) {
        setRedirecting(true);
        // Automatically open the official SSLCOMMERZ hosted checkout page
        window.location.href = data.gatewayUrl;
      } else {
        setErrorMessage(
          data.error || "Failed to initialize SSLCOMMERZ payment session."
        );
        setLoading(false);
      }
    } catch (err) {
      setErrorMessage(
        err.message || "Network error while connecting to payment API."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-black py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand / Title Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-emerald-600/30">
              R
            </div>
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Rentora
            </span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            SSLCOMMERZ Sandbox
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Payment Gateway Test
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Test dummy payments and hosted checkout redirection without charging real money.
          </p>
        </div>

        {/* Callback Status Alerts */}
        {status === "success" && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm text-emerald-700 dark:text-emerald-300">
              <span>✅</span>
              <span>Gateway Returned Success (Sandbox Demo)</span>
            </div>
            <div className="text-xs space-y-1 font-mono bg-white/60 dark:bg-black/30 p-2.5 rounded-xl border border-emerald-500/20">
              {tranId && <div><span className="text-zinc-500">Transaction ID:</span> {tranId}</div>}
              {valId && <div><span className="text-zinc-500">Validation ID:</span> {valId}</div>}
              {amount && <div><span className="text-zinc-500">Amount Paid:</span> BDT {amount}</div>}
              {cardType && <div><span className="text-zinc-500">Payment Channel:</span> {cardType}</div>}
            </div>
            <div className="text-[11px] text-emerald-800 dark:text-emerald-300/90 leading-relaxed bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
              <strong>⚠️ Academic Note:</strong> This frontend redirect is for user feedback only. In production, this redirect is <em>never</em> treated as proof of payment. A secure backend IPN listener and SSLCOMMERZ Validation API call are required before updating databases or granting access.
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm text-rose-700 dark:text-rose-300">
              <span>❌</span>
              <span>Payment Failed / Declined</span>
            </div>
            <p className="text-xs text-rose-800 dark:text-rose-300/90">
              The sandbox payment was rejected or declined by the test gateway.
              {errorParam && <span className="block mt-1 font-mono">Reason: {errorParam}</span>}
            </p>
          </div>
        )}

        {status === "cancelled" && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm text-amber-700 dark:text-amber-300">
              <span>⚠️</span>
              <span>Payment Cancelled</span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300/90">
              You cancelled the transaction on the SSLCOMMERZ checkout screen.
            </p>
          </div>
        )}

        {/* Main Payment Card */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-3 pb-5 border-b border-zinc-200/80 dark:border-zinc-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Item</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Rentora Academic Service Fee
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Environment</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                Sandbox (Test Mode)
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Currency</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                BDT (Bangladeshi Taka)
              </span>
            </div>
            <div className="pt-2 flex justify-between items-baseline">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Total Payable
              </span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                BDT 180.00
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-start gap-2">
              <span className="text-sm leading-none">⚠️</span>
              <div className="space-y-0.5">
                <div className="font-semibold">Payment Initiation Failed</div>
                <div className="text-[11px] opacity-90">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button
            type="button"
            onClick={handlePay}
            disabled={loading || redirecting}
            className="w-full text-base py-3.5 font-semibold"
            variant="primary"
          >
            {redirecting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Redirecting to SSLCOMMERZ...
              </span>
            ) : loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Initializing Sandbox Session...
              </span>
            ) : (
              "Pay BDT 180 (Sandbox)"
            )}
          </Button>

          {/* Micro Footer Notes */}
          <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500">
            🔒 SSLCOMMERZ Test Mode. No real credit card or money will be charged.
          </p>
        </div>

        {/* Sandbox Guide Card */}
        <div className="bg-zinc-100/70 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-4 text-xs space-y-2.5 text-zinc-600 dark:text-zinc-400">
          <div className="font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
            <span>💡</span> How to complete test payment in Sandbox:
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
            <li>
              <strong>Mobile Banking (bKash/Nagad):</strong> Select any test wallet, enter dummy phone <code className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">01711111111</code>, and OTP <code className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">123456</code>.
            </li>
            <li>
              <strong>Test Cards:</strong> Click on any listed test bank card (e.g., EBL Visa / City Bank) to test success or failure scenarios.
            </li>
            <li>
              <strong>Cancel:</strong> Click &quot;Cancel and return to merchant website&quot; on the gateway page to test cancellation flow.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function PaymentTestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-zinc-500">
          Loading payment sandbox...
        </div>
      }
    >
      <PaymentTestContent />
    </Suspense>
  );
}
