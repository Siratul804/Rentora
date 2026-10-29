import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import AuditLog from "@/lib/models/AuditLog";
import MaintenanceRequest from "@/lib/models/MaintenanceRequest";
import Property from "@/lib/models/Property";
import { getServerSession } from "@/lib/session";

const COMPLETED_STATUSES = ["Resolved", "Closed"];

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

    if (!mongoose.isValidObjectId(session.id)) {
      return NextResponse.json({ error: "Invalid user session." }, { status: 403 });
    }

    const params = new URL(request.url).searchParams;
    const providerFilter = params.get("provider")?.trim() || "";
    const propertyFilter = params.get("property") || "";
    const from = params.get("from") || "";
    const to = params.get("to") || "";

    if (propertyFilter && !mongoose.isValidObjectId(propertyFilter)) {
      return NextResponse.json({ error: "Invalid property filter." }, { status: 400 });
    }
    if ((from && Number.isNaN(Date.parse(from))) || (to && Number.isNaN(Date.parse(to)))) {
      return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
    }
    if (from && to && new Date(from) > new Date(to)) {
      return NextResponse.json(
        { error: "The start date must be on or before the end date." },
        { status: 400 }
      );
    }

    await dbConnect();

    const query = {
      status: { $in: COMPLETED_STATUSES },
      assignedTo: { $nin: ["", "Unassigned"] },
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
      provider: item.assignedTo,
      propertyId: item.propertyId?._id?.toString() || "",
      property: item.propertyId?.name || "Property",
      tenant: item.tenantId?.name || "Tenant not assigned",
      unit: item.unit || "N/A",
      rating: Number.isFinite(item.rating) ? item.rating : null,
      comment: item.comment || "",
    }));

    const properties = availableProperties.map((property) => ({
      id: property._id.toString(),
      name: property.name,
    }));
    const providers = [...new Set(allJobs.map((job) => job.provider))].sort((a, b) =>
      a.localeCompare(b)
    );
    const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : null;
    const toDate = to ? new Date(`${to}T23:59:59.999Z`) : null;

    const jobs = allJobs.filter((job) => {
      const completionDate = new Date(job.completionDate);
      return (
        (!providerFilter || job.provider === providerFilter) &&
        (!propertyFilter || job.propertyId === propertyFilter) &&
        (!fromDate || completionDate >= fromDate) &&
        (!toDate || completionDate <= toDate)
      );
    });

    const summaries = Object.values(
      jobs.reduce((result, job) => {
        const summary = result[job.provider] || {
          provider: job.provider,
          completedJobs: 0,
          ratingTotal: 0,
          ratedJobs: 0,
        };
        summary.completedJobs += 1;
        if (job.rating !== null) {
          summary.ratingTotal += job.rating;
          summary.ratedJobs += 1;
        }
        result[job.provider] = summary;
        return result;
      }, {})
    ).map(({ provider, completedJobs, ratingTotal, ratedJobs }) => ({
      provider,
      completedJobs,
      averageRating: ratedJobs ? ratingTotal / ratedJobs : null,
      ratedJobs,
    }));

    await AuditLog.create({
      action: "provider-job-history-viewed",
      actorId: session.id,
      actorRole: session.role,
      ...(session.role === "owner" ? { ownerId: session.id } : {}),
      ...(propertyFilter ? { propertyId: propertyFilter } : {}),
      status: "success",
    });

    return NextResponse.json({
      success: true,
      jobs,
      providers,
      properties,
      summaries,
    });
  } catch (error) {
    console.error("Fetch provider job history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch provider job history." },
      { status: 500 }
    );
  }
}
