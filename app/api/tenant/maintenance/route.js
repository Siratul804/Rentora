import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Lease from "@/lib/models/Lease";
import MaintenanceRequest from "@/lib/models/MaintenanceRequest";
import Property from "@/lib/models/Property";
import User from "@/lib/models/User";
import { createNotification } from "@/lib/notificationDelivery";
import { getServerSession } from "@/lib/session";

const CATEGORIES = ["Plumbing", "Electrical", "HVAC", "Carpentry", "Appliance"];

async function getTenant(session) {
  let tenant = mongoose.isValidObjectId(session.id)
    ? await User.findOne({ _id: session.id, role: "tenant", isActive: { $ne: false } })
    : null;
  if (!tenant && session.email) {
    tenant = await User.findOne({
      email: String(session.email).toLowerCase(),
      role: "tenant",
      isActive: { $ne: false },
    });
  }

  if (!tenant) return { error: "Tenant account not found. Please sign in again." };
  return { tenant };
}

async function getTenantAndLease(session) {
  const tenantResult = await getTenant(session);
  if (tenantResult.error) return tenantResult;
  const { tenant } = tenantResult;

  const leaseConditions = [{ tenantId: tenant._id }];
  if (tenant.email) leaseConditions.push({ tenantEmail: tenant.email });
  const lease = await Lease.findOne({ status: "Active", $or: leaseConditions })
    .sort({ updatedAt: -1 });

  if (!lease) return { error: "An active lease is required to submit a maintenance request." };

  let property = mongoose.isValidObjectId(lease.propertyId)
    ? await Property.findOne({ _id: lease.propertyId, ownerId: lease.ownerId }).select("_id")
    : null;
  if (!property) {
    property = await Property.findOne({ ownerId: lease.ownerId, name: lease.propertyName }).select("_id");
  }
  if (!property) {
    return {
      error: `Your lease lists "${lease.propertyName}", but that property is not in your owner's portfolio. Please ask your property owner to create the property and link it to your lease.`,
    };
  }

  return { tenant, lease, propertyId: property._id };
}

function serializeRequest(item) {
  return {
    id: item._id.toString(),
    title: item.title,
    description: item.description || "",
    category: item.category || "Other",
    priority: item.priority || "Medium",
    status: item.status || "Pending",
    assignedTo: item.assignedTo || "Unassigned",
    unit: item.unit || "N/A",
    createdAt: item.createdAt,
    activityHistory: item.activityHistory || [],
  };
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.role !== "tenant") {
      return NextResponse.json({ error: "Only tenants can view their maintenance requests." }, { status: 403 });
    }

    await dbConnect();
    const result = await getTenant(session);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 404 });

    const requests = await MaintenanceRequest.find({ tenantId: result.tenant._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, requests: requests.map(serializeRequest) });
  } catch (error) {
    console.error("Fetch tenant maintenance requests error:", error);
    return NextResponse.json({ error: "Failed to load your maintenance requests." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== "tenant") {
      return NextResponse.json({ error: "Only tenants can submit maintenance requests." }, { status: 403 });
    }

    let body;
    try {
      body = (await request.json()) || {};
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const category = typeof body.category === "string" ? body.category : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!title) return NextResponse.json({ error: "Issue summary is required." }, { status: 400 });
    if (!CATEGORIES.includes(category)) return NextResponse.json({ error: "Select a valid trade category." }, { status: 400 });

    await dbConnect();
    const result = await getTenantAndLease(session);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

    const maintenanceRequest = await MaintenanceRequest.create({
      title,
      description,
      category,
      status: "Pending",
      propertyId: result.propertyId,
      tenantId: result.tenant._id,
      unit: result.lease.unit || "",
      ownerId: result.lease.ownerId,
      assignedTo: "Unassigned",
      activityHistory: [{
        action: "Request submitted",
        details: "Tenant submitted a maintenance request.",
        performedBy: result.tenant._id,
      }],
    });

    let notificationWarning = "";
    try {
      const owner = await User.findOne({
        _id: maintenanceRequest.ownerId,
        role: "owner",
        isActive: { $ne: false },
      });
      if (owner) {
        await createNotification({
          recipient: owner,
          ownerId: owner._id,
          tenantId: result.tenant._id,
          maintenanceRequestId: maintenanceRequest._id,
          type: "maintenance-submitted",
          title: "New maintenance request",
          message: `${result.tenant.name} submitted "${maintenanceRequest.title}" for ${result.lease.propertyName}${result.lease.unit ? `, ${result.lease.unit}` : ""}.`,
          details: {
            maintenanceTitle: maintenanceRequest.title,
            maintenanceStatus: maintenanceRequest.status,
            category: maintenanceRequest.category,
            propertyName: result.lease.propertyName,
            unit: result.lease.unit || "",
            tenantName: result.tenant.name,
          },
        });
      }
    } catch (error) {
      console.error("Notify owner about tenant maintenance request error:", error);
      notificationWarning = " Your property owner may not have received a notification.";
    }

    return NextResponse.json({
      success: true,
      message: "Maintenance request submitted successfully.",
      notificationWarning,
      request: serializeRequest(maintenanceRequest),
    }, { status: 201 });
  } catch (error) {
    console.error("Submit tenant maintenance request error:", error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Failed to submit your maintenance request." },
      { status: 500 }
    );
  }
}
