"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: `${phone}@rentora.com`, // temporary until you add email field
          password,
          role: "tenant",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registration successful!");
        // redirect or clear form here
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (err) {
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
            Manage properties, tenants, and payments.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-5">
          <h2 className="text-2xl font-bold text-center text-[#1F2933] mb-2">
            Create Account
          </h2>
          <p className="text-gray-500 text-center mb-6">
            Register to get started with Rentora
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#556B2F] focus:border-[#556B2F] transition"
              required
            />

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

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#556B2F] focus:border-[#556B2F] transition"
              required
            />

            <button
              type="submit"
              className="w-full bg-[#556B2F] text-white py-3 rounded-lg font-semibold hover:bg-[#2C3A1A] transition duration-200 shadow-md"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-[#556B2F] font-semibold hover:text-[#2C3A1A] hover:underline"
            >
              Login
            </a>
          </p>

          <div className="text-center mt-3">
            <a
              href="/forgot-password"
              className="text-sm text-[#556B2F] hover:text-[#2C3A1A] hover:underline"
            >
              Forgot Password?
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
