import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "@/lib/session";
import User from "@/lib/models/User";
import Lease from "@/lib/models/Lease";
import { Invoice } from "@/lib/models/Invoice";

function getPaymentFrequency(billingCycle) {
  const frequency = billingCycle.match(/\b(monthly|weekly|biweekly|bi-weekly|quarterly|annually|yearly)\b/i)?.[0];
  return frequency
    ? frequency.replace(/(^|-)([a-z])/g, (match) => match.toUpperCase())
    : billingCycle;
}

function getNextDueDate(billingCycle) {
  const days = [...billingCycle.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)?\b/gi)].map((match) => Number(match[1]));
  const dueDay = days.length ? days[days.length - 1] : 1;
  const today = new Date();
  let year = today.getUTCFullYear();
  let month = today.getUTCMonth();
  const day = Math.min(dueDay, new Date(Date.UTC(year, month + 1, 0)).getUTCDate());

  if (Date.UTC(year, month, day) < Date.UTC(year, month, today.getUTCDate())) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return new Date(Date.UTC(year, month, Math.min(dueDay, new Date(Date.UTC(year, month + 1, 0)).getUTCDate())))
    .toISOString()
    .slice(0, 10);
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Please sign in to view your rent details." }, { status: 401 });
    }
    if (session.role !== "tenant") {
      return NextResponse.json({ error: "Only tenants can view rent details." }, { status: 403 });
    }

    await dbConnect();
    let tenant = mongoose.isValidObjectId(session.id)
      ? await User.findOne({ _id: session.id, role: "tenant", isActive: { $ne: false } }).select("_id email rentStatus")
      : null;
    if (!tenant && session.email) {
      tenant = await User.findOne({
        email: String(session.email).toLowerCase(),
        role: "tenant",
        isActive: { $ne: false },
      }).select("_id email rentStatus");
    }
    if (!tenant) {
      return NextResponse.json({ error: "Tenant account not found. Please sign in again." }, { status: 401 });
    }

    const leaseConditions = [{ tenantId: tenant._id }];
    if (tenant.email) leaseConditions.push({ tenantEmail: tenant.email });
    const lease = await Lease.findOne({ status: "Active", $or: leaseConditions })
      .sort({ updatedAt: -1 })
      .lean();

    if (!lease) {
      return NextResponse.json({ rent: null });
    }

    const invoice = await Invoice.findOne({ tenantId: tenant._id, leaseId: lease._id })
      .sort({ billingPeriod: -1, dueDate: -1 })
      .lean();
    const billingCycle = lease.billingCycle || "1st - 5th Monthly";
    const invoiceDueDate = invoice?.dueDate
      ? new Date(invoice.dueDate).toISOString().slice(0, 10)
      : null;
    const dueDate = invoiceDueDate || getNextDueDate(billingCycle);
    let status = invoice?.status || tenant.rentStatus || "Pending";
    if (status === "Pending" && invoiceDueDate && invoiceDueDate < new Date().toISOString().slice(0, 10)) {
      status = "Overdue";
    }

    return NextResponse.json({
      rent: {
        amount: Number(lease.rent),
        paymentFrequency: getPaymentFrequency(billingCycle),
        dueDate,
        status,
        propertyName: lease.propertyName,
        unit: lease.unit || "",
        invoiceId: invoice?._id?.toString() || null,
      },
    });
  } catch (error) {
    console.error("Fetch tenant rent summary error:", error);
    return NextResponse.json({ error: "Failed to load your rent details. Please try again." }, { status: 500 });
  }
}
