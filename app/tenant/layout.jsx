import React from "react";

export const metadata = {
  title: "Tenant Portal — Rentora",
  description: "Tenant self-service, pay rent online via SSLCommerz, submit repair tickets",
};

export default function TenantLayout({ children }) {
  return <div className="min-h-screen">{children}</div>;
}
