import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import AuditLog from "@/lib/models/AuditLog";
import MaintenanceRequest from "@/lib/models/MaintenanceRequest";
import Property from "@/lib/models/Property";
import { getServerSession } from "@/lib/session";

const COMPLETED_STATUSES = ["Resolved", "Closed"];

function parseDateBoundary(value, endOfDate) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (endOfDate) date.setUTCDate(date.getUTCDate() + 1);
    return date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getCompletionDate(request) {
  if (request.completedAt) return request.completedAt;

  const completionEvent = [...(request.activityHistory || [])]
    .reverse()
    .find(
      (event) =>
        event.action === "Status updated" &&
        COMPLETED_STATUSES.some((status) =>
          event.details?.includes(`Status updated to ${status}`)
        )
    );

  return completionEvent?.createdAt || request.updatedAt;
}

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session || !["owner", "admin"].includes(session.role)) {
      return NextResponse.json(
        { error: "Only property owners and admins can view provider job history." },
        { status: 403 }
      );
    }

    if (session.role === "owner" && !mongoose.isValidObjectId(session.id)) {
      return NextResponse.json({ error: "Invalid user session." }, { status: 403 });
    }

    const params = new URL(request.url).searchParams;
    const includeAll = session.role === "admin" && params.get("includeAll") === "true";
    const propertyFilter = params.get("property") || "";
    const from = params.get("from") || "";
    const to = params.get("to") || "";

    if (propertyFilter && !mongoose.isValidObjectId(propertyFilter)) {
      return NextResponse.json({ error: "Invalid property filter." }, { status: 400 });
    }
    const fromDate = parseDateBoundary(from, false);
    const toDate = parseDateBoundary(to, true);
    if ((from && !fromDate) || (to && !toDate)) {
      return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
    }
    if (fromDate && toDate && fromDate >= toDate) {
      return NextResponse.json(
        { error: "The start date must be on or before the end date." },
        { status: 400 }
      );
    }

    await dbConnect();

    const query = session.role === "admin" && includeAll
      ? {}
      : {
          status: { $in: COMPLETED_STATUSES },
          $or: [
            { assignedTo: { $nin: ["", "Unassigned"] } },
            { status: "Closed" },
          ],
        };
    if (session.role === "owner") query.ownerId = session.id;
    const [requests, availableProperties] = await Promise.all([
      MaintenanceRequest.find(query)
        .populate("tenantId", "name")
        .populate("propertyId", "name")
        .sort({ completedAt: -1, updatedAt: -1 })
        .lean(),
      Property.find(session.role === "owner" ? { ownerId: session.id } : {})
        .select("_id name")
        .sort({ name: 1 })
        .lean(),
    ]);

    const allJobs = requests.map((item) => ({
      id: item._id.toString(),
      issue: item.title,
      category: item.category || "Other",
      completionDate: getCompletionDate(item),
      propertyId: item.propertyId?._id?.toString() || "",
      property: item.propertyId?.name || "Property",
      tenant: item.tenantId?.name || "Tenant not assigned",
      unit: item.unit || "N/A",
      status: item.status,
      requestedAt: item.createdAt,
    }));

    const properties = availableProperties.map((property) => ({
      id: property._id.toString(),
      name: property.name,
    }));
    const jobs = allJobs.filter((job) => {
      const completionDate = new Date(job.completionDate);
      return (
        (!propertyFilter || job.propertyId === propertyFilter) &&
        (!fromDate || completionDate >= fromDate) &&
        (!toDate || completionDate < toDate)
      );
    });

    await AuditLog.create({
      action: "provider-job-history-viewed",
      ...(mongoose.isValidObjectId(session.id) ? { actorId: session.id } : {}),
      actorRole: session.role,
      ...(session.role === "owner" ? { ownerId: session.id } : {}),
      ...(propertyFilter ? { propertyId: propertyFilter } : {}),
      status: "success",
    });

    return NextResponse.json({
      success: true,
      jobs,
      properties,
    });
  } catch (error) {
    console.error("Fetch provider job history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch provider job history." },
      { status: 500 }
    );
  }
}
