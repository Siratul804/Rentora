import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "@/lib/session";
import User from "@/lib/models/User";
import { Invoice } from "@/lib/models/Invoice";
import { AuditLog } from "@/lib/models/AuditLog";
import { ROLES } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["Pending", "Paid", "Overdue"];

async function getAuthorizedOwner(session) {
  if (!session) {
    return { response: NextResponse.json({ error: "Please sign in to manage invoices." }, { status: 401 }) };
  }
  if (session.role !== ROLES.OWNER) {
    return { response: NextResponse.json({ error: "Only property owners can manage invoices." }, { status: 403 }) };
  }

  await dbConnect();
  let owner = mongoose.isValidObjectId(session.id)
    ? await User.findOne({ _id: session.id, role: ROLES.OWNER, isActive: { $ne: false } }).select("_id")
    : null;
  if (!owner && session.email) {
    owner = await User.findOne({
      email: String(session.email).toLowerCase(),
      role: ROLES.OWNER,
      isActive: { $ne: false },
    }).select("_id");
  }
  if (!owner) {
    return { response: NextResponse.json({ error: "Owner account not found. Please sign in again." }, { status: 401 }) };
  }

  return { ownerId: owner._id };
}

export async function GET(request, { params }) {
  try {
    const auth = await getAuthorizedOwner(await getServerSession());
    if (auth.response) return auth.response;

    const { invoiceId } = await params;
    if (!invoiceId || !mongoose.isValidObjectId(invoiceId)) {
      return NextResponse.json({ error: "Valid invoice ID is required." }, { status: 400 });
    }

    await dbConnect();
    const invoice = await Invoice.findOne({ _id: invoiceId, ownerId: auth.ownerId })
      .populate("tenantId", "name email")
      .lean();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      invoice: {
        ...invoice,
        _id: invoice._id.toString(),
        leaseId: invoice.leaseId?.toString() || null,
        propertyId: invoice.propertyId?.toString() || null,
        ownerId: invoice.ownerId.toString(),
      },
    });
  } catch (error) {
    console.error("Get invoice error:", error);
    return NextResponse.json({ error: "Failed to fetch invoice." }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await getAuthorizedOwner(await getServerSession());
    if (auth.response) return auth.response;

    const { invoiceId } = await params;
    if (!invoiceId || !mongoose.isValidObjectId(invoiceId)) {
      return NextResponse.json({ error: "Valid invoice ID is required." }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const { status } = body || {};
    if (!status || typeof status !== "string" || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid payment status. Allowed values: ${ALLOWED_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    await dbConnect();
    // Scope strictly to authenticated owner to enforce authorization boundary
    const invoice = await Invoice.findOne({ _id: invoiceId, ownerId: auth.ownerId });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found or unauthorized." }, { status: 404 });
    }

    // Preserve existing record data and guarantee type cannot be altered
    const prevStatus = invoice.status;
    invoice.status = status;
    await invoice.save();

    await AuditLog.create({
      action: "update-invoice-status",
      invoiceId: invoice._id,
      tenantId: invoice.tenantId,
      propertyId: invoice.propertyId,
      ownerId: auth.ownerId,
      status,
      prevStatus,
    });

    return NextResponse.json({
      success: true,
      message: `Invoice payment status updated to "${status}".`,
      invoice: {
        _id: invoice._id.toString(),
        type: invoice.type,
        status: invoice.status,
        billingPeriod: invoice.billingPeriod,
        rentAmount: invoice.rentAmount,
        dueDate: invoice.dueDate,
        tenantName: invoice.tenantName,
        propertyName: invoice.propertyName,
        unit: invoice.unit,
        updatedAt: invoice.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update invoice payment status error:", error);
    return NextResponse.json({ error: "Failed to update payment status." }, { status: 500 });
  }
}

export async function PUT(request, context) {
  return PATCH(request, context);
}
