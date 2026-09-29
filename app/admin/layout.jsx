import React from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";

export const metadata = {
  title: "Super Admin Portal — Rentora",
  description: "Platform management, owner oversight, subscriptions & service dispatch",
};

export default function AdminLayout({ children }) {
  return <div className="min-h-screen">{children}</div>;
}
