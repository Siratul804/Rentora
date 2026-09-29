"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layouts/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function TenantProfilePage() {
  const [name, setName] = useState("Farhan Ahmed");
  const [email, setEmail] = useState("farhan@gmail.com");
  const [phone, setPhone] = useState("+880 1711-123456");
  const [emergencyContact, setEmergencyContact] = useState("Naimur Rahman (+880 1819-223344)");
  const [nid, setNid] = useState("8928 1092 8491");
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <DashboardShell
      portal="tenant"
      title="My Resident Profile"
      subtitle="Manage your personal details, national ID, emergency contacts, and notifications"
    >
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            {saved && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold">
                ✓ Profile changes saved successfully!
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Mobile Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <Input
                label="National ID (NID) / Passport #"
                value={nid}
                onChange={(e) => setNid(e.target.value)}
                helperText="Verified against tenancy records"
                disabled
              />

              <Input
                label="Emergency Contact (Name & Phone)"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                required
              />

              <div className="pt-2">
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
