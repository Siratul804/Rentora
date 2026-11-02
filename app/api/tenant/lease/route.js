import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Lease from "@/lib/models/Lease";
import Property from "@/lib/models/Property";
import User from "@/lib/models/User";
import { getServerSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.role !== "tenant") {
      return NextResponse.json({ error: "Please sign in as a tenant to view your lease." }, { status: 401 });
    }

    await dbConnect();
    const tenantQuery = { role: "tenant", isActive: { $ne: false } };
    if (mongoose.isValidObjectId(session.id)) tenantQuery._id = session.id;
    else if (session.email) tenantQuery.email = String(session.email).toLowerCase();
    else return NextResponse.json({ error: "Tenant account not found." }, { status: 401 });

    const tenant = await User.findOne(tenantQuery).select("name email phone property unit leaseStart leaseEnd rentAmount deposit billingCycle createdBy");
    if (!tenant) return NextResponse.json({ error: "Tenant account not found. Please sign in again." }, { status: 401 });

    const leaseQuery = { $or: [{ tenantId: tenant._id }, { tenantEmail: tenant.email }] };
    let lease = await Lease.findOne({ ...leaseQuery, status: "Active" })
      .sort({ updatedAt: -1 })
      .populate("ownerId", "name email phone")
      .populate("propertyId", "name address")
      .lean();
    if (!lease) {
      lease = await Lease.findOne(leaseQuery)
        .sort({ updatedAt: -1 })
        .populate("ownerId", "name email phone")
        .populate("propertyId", "name address")
        .lean();
    }

    let owner = lease?.ownerId || null;
    if (!owner && tenant.createdBy) {
      owner = await User.findOne({ _id: tenant.createdBy, role: "owner" })
        .select("name email phone")
        .lean();
    }
    let property = lease?.propertyId || null;
    if (!property && owner?._id && tenant.property) {
      property = await Property.findOne({ ownerId: owner._id, name: tenant.property })
        .select("name address")
        .lean();
    }

    return NextResponse.json({
      lease: {
        id: lease?.leaseId || "",
        status: lease?.status || "Not recorded",
        startDate: lease?.startDate || tenant.leaseStart || "",
        endDate: lease?.endDate || tenant.leaseEnd || "",
        rent: Number(lease?.rent ?? tenant.rentAmount ?? 0),
        deposit: Number(lease?.deposit ?? tenant.deposit ?? 0),
        billingCycle: lease?.billingCycle || tenant.billingCycle || "1st - 5th Monthly",
        terms: lease?.terms || [],
        tenantName: lease?.tenantName || tenant.name,
        propertyName: lease?.propertyName || tenant.property || "",
        unit: lease?.unit || tenant.unit || "",
        owner: owner ? { name: owner.name, email: owner.email, phone: owner.phone || "" } : null,
        propertyAddress: property?.address || "",
      },
    });
  } catch (error) {
    console.error("Fetch tenant lease error:", error);
    return NextResponse.json({ error: "Failed to load your lease details." }, { status: 500 });
  }
}
