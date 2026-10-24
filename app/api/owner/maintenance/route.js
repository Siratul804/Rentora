
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import MaintenanceRequest from "@/lib/models/MaintenanceRequest";
import { getServerSession } from "@/lib/session";
import { ROLES } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session || session.role !== ROLES.OWNER) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can access maintenance requests." },
        { status: 403 }
      );
    }

    await dbConnect();

    const query = {};

    // Only return requests belonging to the logged-in owner.
    if (session.id && session.id !== "owner-1") {
      if (!mongoose.isValidObjectId(session.id)) {
        return NextResponse.json(
          { error: "Invalid owner session." },
          { status: 403 }
        );
      }

      query.ownerId = session.id;
    }

    const requests = await MaintenanceRequest.find(query)
      .populate("tenantId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      requests: requests.map((item) => ({
        id: item._id.toString(),
        title: item.title,
        description: item.description || "",
        category: item.category || "Other",
        priority: item.priority || "Medium",
        status: item.status || "Pending",
        assignedTo: item.assignedTo || "Unassigned",
        unit: item.unit || "N/A",
        tenant: item.tenantId
          ? { name: item.tenantId.name || "Tenant" }
          : { name: "Tenant not assigned" },
        createdAt: item.createdAt,
        activityHistory: item.activityHistory || [],
      })),
    });
  } catch (error) {
    console.error("Fetch maintenance requests error:", error);

    return NextResponse.json(
      { error: "Failed to fetch maintenance requests." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession();

    if (!session || session.role !== ROLES.OWNER) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can update maintenance requests." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, assignedTo, status } = body;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid maintenance request ID." },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      "Pending",
      "Dispatched",
      "In Progress",
      "Resolved",
      "Closed",
    ];

    if (
      status !== undefined &&
      !allowedStatuses.includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid maintenance status." },
        { status: 400 }
      );
    }

    if (
      assignedTo !== undefined &&
      (typeof assignedTo !== "string" || !assignedTo.trim())
    ) {
      return NextResponse.json(
        { error: "Invalid technician assignment." },
        { status: 400 }
      );
    }

    await dbConnect();

    const query = { _id: id };

    if (session.id && session.id !== "owner-1") {
      if (!mongoose.isValidObjectId(session.id)) {
        return NextResponse.json(
          { error: "Invalid owner session." },
          { status: 403 }
        );
      }

      query.ownerId = session.id;
    }

    const maintenanceRequest = await MaintenanceRequest.findOne(query);

    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: "Maintenance request not found." },
        { status: 404 }
      );
    }

    const changes = [];

    if (
      assignedTo !== undefined &&
      maintenanceRequest.assignedTo !== assignedTo.trim()
    ) {
      maintenanceRequest.assignedTo = assignedTo.trim();

      changes.push({
        action: "Technician assignment updated",
        details:
          assignedTo.trim() === "Unassigned"
            ? "Technician assignment removed."
            : `Technician assigned: ${assignedTo.trim()}`,
        performedBy: mongoose.isValidObjectId(session.id)
          ? session.id
          : null,
        createdAt: new Date(),
      });
    }

    if (
      status !== undefined &&
      maintenanceRequest.status !== status
    ) {
      maintenanceRequest.status = status;

      changes.push({
        action: "Status updated",
        details: `Status updated to ${status}.`,
        performedBy: mongoose.isValidObjectId(session.id)
          ? session.id
          : null,
        createdAt: new Date(),
      });
    }

    if (changes.length > 0) {
      maintenanceRequest.activityHistory.push(...changes);
      await maintenanceRequest.save();
    }

    return NextResponse.json({
      success: true,
      message: "Maintenance request updated successfully.",
      request: {
        id: maintenanceRequest._id.toString(),
        assignedTo: maintenanceRequest.assignedTo,
        status: maintenanceRequest.status,
      },
    });
  } catch (error) {
    console.error("Update maintenance request error:", error);

    return NextResponse.json(
      { error: "Failed to update maintenance request." },
      { status: 500 }
    );
  }
}
