import React from "react";

export const metadata = {
  title: "Owner Portal — Rentora",
  description: "Property and tenant management, automated lease and invoice tracking",
};

export default function OwnerLayout({ children }) {
  return <div className="min-h-screen">{children}</div>;
}
