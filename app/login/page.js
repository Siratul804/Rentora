"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!phone || !password) {
      alert("Please enter phone number and password!");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Login successful!");
        router.push("/dashboard");
      } else {
        alert(data.error || "Login failed");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2C3A1A] to-[#556B2F] px-4 py-8">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl">

        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-[#2C3A1A] tracking-tight">
            Rent<span className="text-[#556B2F]">ora</span>
          </h1>

          <p className="text-gray-600 mt-1">
            Find your place. Make it yours.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-5">

          <h2 className="text-2xl font-bold text-center text-[#1F2933] mb-2">
            Welcome Back
          </h2>

          <p className="text-gray-500 text-center mb-6">
            Login to continue with Rentora
          </p>

          <form onSubmit={handleLogin} className="space-y-4">

            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#556B2F] focus:border-[#556B2F] transition"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#556B2F] focus:border-[#556B2F] transition"
              required
            />

            <button
              type="submit"
              className="w-full bg-[#556B2F] text-white py-3 rounded-lg font-semibold hover:bg-[#2C3A1A] transition duration-200 shadow-md"
            >
              Login
            </button>

          </form>

          <div className="text-center mt-4">
            <a
              href="/forgot-password"
              className="text-sm text-[#556B2F] hover:text-[#2C3A1A] hover:underline"
            >
              Forgot Password?
            </a>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-[#556B2F] font-semibold hover:text-[#2C3A1A] hover:underline"
            >
              Create Account
            </a>
          </p>

        </div>
      </div>
    </main>
  );
}