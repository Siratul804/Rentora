import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "@/lib/session";
import User from "@/lib/models/User";
import Lease from "@/lib/models/Lease";
import { Invoice } from "@/lib/models/Invoice";
import { AuditLog } from "@/lib/models/AuditLog";
import Notification from "@/lib/models/Notification";

async function getOwnerId() {
  const session = await getServerSession();
  if (!session) {
    return { response: NextResponse.json({ error: "Please sign in to manage invoices." }, { status: 401 }) };
  }
  if (session.role !== "owner") {
    return { response: NextResponse.json({ error: "Only property owners can manage invoices." }, { status: 403 }) };
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
    return { response: NextResponse.json({ error: "Owner account not found. Please sign in again." }, { status: 401 }) };
  }

  return { ownerId: owner._id };
}

function isLeaseActiveForPeriod(lease, billingPeriod) {
  if (!lease.startDate || !lease.endDate) return false;
  const [year, month] = billingPeriod.split("-").map(Number);
  const periodStart = `${billingPeriod}-01`;
  const periodEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return lease.startDate <= periodEnd && lease.endDate >= periodStart;
}

function validPeriod(period) {
  if (typeof period !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return false;
  const [year, month] = period.split("-").map(Number);
  return year >= 2000 && year <= 2100 && month >= 1 && month <= 12;
}

export async function GET(request) {
  try {
    const owner = await getOwnerId();
    if (owner.response) return owner.response;

    const invoices = await Invoice.find({ ownerId: owner.ownerId })
      .sort({ createdAt: -1 })
      .populate("tenantId", "name email")
      .lean();
    const period = new URL(request.url).searchParams.get("period");
    let leases = [];
    if (period && !validPeriod(period)) {
      return NextResponse.json({ error: "Billing period must be a valid YYYY-MM month." }, { status: 400 });
    }

    if (period) {
      const activeLeases = await Lease.find({ ownerId: owner.ownerId, status: "Active" })
        .sort({ tenantName: 1 })
        .lean();
      const tenantIds = activeLeases
        .map((lease) => lease.tenantId)
        .filter((id) => mongoose.isValidObjectId(id));
      const tenantEmails = activeLeases
        .map((lease) => lease.tenantEmail?.trim().toLowerCase())
        .filter(Boolean);
      const tenantConditions = [
        ...(tenantIds.length ? [{ _id: { $in: tenantIds } }] : []),
        ...(tenantEmails.length ? [{ email: { $in: tenantEmails } }] : []),
      ];
      const tenants = tenantConditions.length
        ? await User.find({
            role: "tenant",
            isActive: { $ne: false },
            createdBy: owner.ownerId,
            $or: tenantConditions,
          }).select("name email")
        : [];
      const tenantById = new Map(tenants.map((tenant) => [tenant._id.toString(), tenant]));
      const tenantByEmail = new Map(tenants.map((tenant) => [tenant.email.toLowerCase(), tenant]));

      leases = activeLeases
        .filter((lease) => isLeaseActiveForPeriod(lease, period))
        .map((lease) => {
          const tenant = (lease.tenantId && tenantById.get(lease.tenantId.toString())) ||
            (lease.tenantEmail && tenantByEmail.get(lease.tenantEmail.toLowerCase()));
          if (!tenant) return null;
          return {
            id: lease._id.toString(),
            tenantId: tenant._id.toString(),
            tenantName: tenant.name || lease.tenantName,
            tenantEmail: tenant.email,
            propertyName: lease.propertyName,
            unit: lease.unit || "",
            rent: Number(lease.rent),
            billingCycle: lease.billingCycle || "",
          };
        })
        .filter(Boolean);
    }

    return NextResponse.json({
      invoices: invoices.map((invoice) => ({
        ...invoice,
        _id: invoice._id.toString(),
        leaseId: invoice.leaseId?.toString() || null,
        tenantId: invoice.tenantId
          ? { ...invoice.tenantId, _id: invoice.tenantId._id.toString() }
          : null,
        propertyId: invoice.propertyId?.toString() || null,
        ownerId: invoice.ownerId.toString(),
      })),
      leases,
    });
  } catch (error) {
    console.error("Fetch owner invoices error:", error);
    return NextResponse.json({ error: "Failed to load invoices and active leases." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const owner = await getOwnerId();
    if (owner.response) return owner.response;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
    }
    const rawLeaseIds = Array.isArray(body.leaseIds)
      ? body.leaseIds
      : body.leaseId
      ? [body.leaseId]
      : [];

    if (
      !rawLeaseIds.length ||
      rawLeaseIds.some((id) => !mongoose.isValidObjectId(id)) ||
      new Set(rawLeaseIds).size !== rawLeaseIds.length
    ) {
      return NextResponse.json({ error: "Select at least one valid active lease." }, { status: 400 });
    }
    const { billingPeriod, dueDate, paymentInstructions = "" } = body;
    if (!validPeriod(billingPeriod)) {
      return NextResponse.json({ error: "Select a valid billing month." }, { status: 400 });
    }
    if (
      typeof dueDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
      !validPeriod(dueDate.slice(0, 7)) ||
      dueDate.slice(0, 7) !== billingPeriod ||
      new Date(`${dueDate}T00:00:00.000Z`).toISOString().slice(0, 10) !== dueDate
    ) {
      return NextResponse.json({ error: "Due date must be a valid date in the billing month." }, { status: 400 });
    }
    if (typeof paymentInstructions !== "string" || paymentInstructions.length > 1000) {
      return NextResponse.json({ error: "Payment instructions must be 1000 characters or fewer." }, { status: 400 });
    }

    const leases = await Lease.find({
      _id: { $in: rawLeaseIds },
      ownerId: owner.ownerId,
      status: "Active",
    }).lean();
    if (leases.length !== rawLeaseIds.length) {
      return NextResponse.json({ error: "One or more selected leases are no longer active or accessible." }, { status: 400 });
    }
    if (leases.some((lease) => !isLeaseActiveForPeriod(lease, billingPeriod))) {
      return NextResponse.json({ error: "One or more leases are not active during the selected billing month." }, { status: 400 });
    }

    const tenantIds = leases.map((lease) => lease.tenantId).filter((id) => mongoose.isValidObjectId(id));
    const tenantEmails = leases.map((lease) => lease.tenantEmail?.trim().toLowerCase()).filter(Boolean);
    const tenantConditions = [
      ...(tenantIds.length ? [{ _id: { $in: tenantIds } }] : []),
      ...(tenantEmails.length ? [{ email: { $in: tenantEmails } }] : []),
    ];
    const tenants = tenantConditions.length
      ? await User.find({
          role: "tenant",
          isActive: { $ne: false },
          createdBy: owner.ownerId,
          $or: tenantConditions,
        }).select("name email")
      : [];
    const tenantById = new Map(tenants.map((tenant) => [tenant._id.toString(), tenant]));
    const tenantByEmail = new Map(tenants.map((tenant) => [tenant.email.toLowerCase(), tenant]));

    const eligibleLeases = leases.map((lease) => ({
      lease,
      tenant: (lease.tenantId && tenantById.get(lease.tenantId.toString())) ||
        (lease.tenantEmail && tenantByEmail.get(lease.tenantEmail.toLowerCase())),
    }));
    if (eligibleLeases.some(({ tenant }) => !tenant)) {
      return NextResponse.json(
        { error: "Every selected lease must be linked to an active tenant account before invoicing." },
        { status: 400 }
      );
    }

    const existing = await Invoice.find({
      leaseId: { $in: rawLeaseIds },
      billingPeriod,
    }).select("leaseId");
    const existingLeaseIds = new Set(existing.map((invoice) => invoice.leaseId.toString()));
    const created = [];
    const duplicates = [];
    for (const { lease, tenant } of eligibleLeases) {
      if (existingLeaseIds.has(lease._id.toString())) {
        duplicates.push({ tenantName: tenant.name, propertyName: lease.propertyName, unit: lease.unit || "" });
        continue;
      }

      let invoice;
      try {
        invoice = await Invoice.create({
          leaseId: lease._id,
          tenantId: tenant._id,
          tenantName: tenant.name || lease.tenantName,
          propertyId: lease.propertyId,
          propertyName: lease.propertyName,
          unit: lease.unit || "",
          ownerId: owner.ownerId,
          billingPeriod,
          rentAmount: Number(lease.rent),
          dueDate,
          paymentInstructions: paymentInstructions.trim(),
        });
      } catch (error) {
        if (error.code === 11000) {
          duplicates.push({ tenantName: tenant.name, propertyName: lease.propertyName, unit: lease.unit || "" });
          continue;
        }
        throw error;
      }

      const notificationMessage =
        `Your ${billingPeriod} rent invoice for ${lease.propertyName}${lease.unit ? `, ${lease.unit}` : ""} ` +
        `is ready. ${Number(lease.rent).toLocaleString()} is due on ${dueDate}.`;
      await Notification.create({
        tenantId: tenant._id,
        invoiceId: invoice._id,
        type: "invoice-generated",
        title: "New rent invoice",
        message: notificationMessage,
      });
      await AuditLog.create({
        action: "generate-invoice",
        invoiceId: invoice._id,
        tenantId: tenant._id,
        propertyId: lease.propertyId,
        ownerId: owner.ownerId,
        status: "created",
      });
      created.push({
        ...invoice.toObject(),
        _id: invoice._id.toString(),
        leaseId: lease._id.toString(),
        tenantId: { _id: tenant._id.toString(), name: tenant.name, email: tenant.email },
      });
    }

    if (created.length === 0 && duplicates.length > 0) {
      return NextResponse.json(
        {
          error: "An invoice for this lease and billing period already exists.",
          duplicates,
        },
        { status: 409 }
      );
    }

    const message = `${created.length} invoice${created.length === 1 ? "" : "s"} generated and tenant${created.length === 1 ? "" : "s"} notified.` +
      (duplicates.length ? ` ${duplicates.length} already existed for this month.` : "");
    return NextResponse.json({ message, invoices: created, duplicates }, { status: 201 });
  } catch (error) {
    console.error("Generate owner invoices error:", error);
    return NextResponse.json({ error: "Failed to generate invoices. Please try again." }, { status: 500 });
  }
}
