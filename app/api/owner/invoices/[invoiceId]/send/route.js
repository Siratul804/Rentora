import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "@/lib/session";
import User from "@/lib/models/User";
import { Invoice } from "@/lib/models/Invoice";
import { AuditLog } from "@/lib/models/AuditLog";
import Notification from "@/lib/models/Notification";

export async function POST(_request, context) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Please sign in to send invoices." }, { status: 401 });
    }
    if (session.role !== "owner") {
      return NextResponse.json({ error: "Only property owners can send invoices." }, { status: 403 });
    }

    const { invoiceId } = await context.params;
    if (!mongoose.isValidObjectId(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID." }, { status: 400 });
    }

    await dbConnect();
    let owner = mongoose.isValidObjectId(session.id)
      ? await User.findOne({ _id: session.id, role: "owner", isActive: { $ne: false } }).select("_id")
      : null;
    if (!owner && session.email) {
      owner = await User.findOne({
        email: String(session.email).toLowerCase(),
        role: "owner",
        isActive: { $ne: false },
      }).select("_id");
    }
    if (!owner) {
      return NextResponse.json({ error: "Owner account not found. Please sign in again." }, { status: 401 });
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, ownerId: owner._id });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }
    const tenant = await User.findOne({
      _id: invoice.tenantId,
      role: "tenant",
      isActive: { $ne: false },
    }).select("name");
    if (!tenant) {
      return NextResponse.json({ error: "The tenant account is no longer active." }, { status: 400 });
    }

    await Notification.create({
      tenantId: tenant._id,
      invoiceId: invoice._id,
      type: "invoice-sent",
      title: "Rent invoice sent",
      message: `Your ${invoice.billingPeriod || "rent"} invoice for ${invoice.propertyName}${invoice.unit ? `, ${invoice.unit}` : ""} was sent by your property owner.`,
    });
    invoice.sentAt = new Date();
    await invoice.save();
    await AuditLog.create({
      action: "send-invoice",
      invoiceId: invoice._id,
      tenantId: tenant._id,
      propertyId: invoice.propertyId,
      ownerId: owner._id,
      status: "sent",
    });

    return NextResponse.json({ message: `Invoice notification sent to ${tenant.name}.` });
  } catch (error) {
    console.error("Send invoice error:", error);
    return NextResponse.json({ error: "Failed to send invoice notification." }, { status: 500 });
  }
}
