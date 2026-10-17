import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "@/lib/session";
import User from "@/lib/models/User";
import { Invoice } from "@/lib/models/Invoice";
import Notification from "@/lib/models/Notification";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Please sign in to view your invoices." }, { status: 401 });
    }
    if (session.role !== "tenant") {
      return NextResponse.json({ error: "Only tenants can view this invoice list." }, { status: 403 });
    }

    await dbConnect();
    let tenant = mongoose.isValidObjectId(session.id)
      ? await User.findOne({ _id: session.id, role: "tenant", isActive: { $ne: false } }).select("_id")
      : null;
    if (!tenant && session.email) {
      tenant = await User.findOne({
        email: String(session.email).toLowerCase(),
        role: "tenant",
        isActive: { $ne: false },
      }).select("_id");
    }
    if (!tenant) {
      return NextResponse.json({ error: "Tenant account not found. Please sign in again." }, { status: 401 });
    }

    const [invoices, notifications] = await Promise.all([
      Invoice.find({ tenantId: tenant._id }).sort({ createdAt: -1 }).lean(),
      Notification.find({ tenantId: tenant._id }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    return NextResponse.json({
      invoices: invoices.map((invoice) => ({
        ...invoice,
        _id: invoice._id.toString(),
        leaseId: invoice.leaseId?.toString() || null,
        tenantId: invoice.tenantId.toString(),
        propertyId: invoice.propertyId?.toString() || null,
        ownerId: invoice.ownerId.toString(),
      })),
      notifications: notifications.map((notification) => ({
        ...notification,
        _id: notification._id.toString(),
        tenantId: notification.tenantId.toString(),
        invoiceId: notification.invoiceId.toString(),
      })),
    });
  } catch (error) {
    console.error("Fetch tenant invoices error:", error);
    return NextResponse.json({ error: "Failed to load your invoices and notifications." }, { status: 500 });
  }
}
