import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Lease from "@/lib/models/Lease";
import User from "@/lib/models/User";
import { getServerSession } from "@/lib/session";
import { ROLES } from "@/lib/auth";

const ALLOWED_STATUSES = ["Active", "Pending", "Expired", "Terminated"];

async function getAuthorizedOwnerId(session) {
  if (mongoose.Types.ObjectId.isValid(session?.id)) {
    return session.id;
  }
  if (session?.email) {
    const dbUser = await User.findOne({ email: session.email, role: ROLES.OWNER });
    if (dbUser) return dbUser._id;
  }
  return null;
}

function buildLeaseLookupQuery(rawId, ownerId = null) {
  const query = {};
  if (mongoose.Types.ObjectId.isValid(rawId)) {
    query.$or = [{ _id: rawId }, { leaseId: rawId }];
  } else {
    query.leaseId = rawId;
  }

  if (ownerId) {
    query.ownerId = ownerId;
  }
  return query;
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session || (session.role !== ROLES.OWNER && session.role !== ROLES.ADMIN)) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can access this endpoint." },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const targetId = resolvedParams?.id || resolvedParams?.leaseId;

    if (!targetId) {
      return NextResponse.json({ error: "Lease ID is required" }, { status: 400 });
    }

    await dbConnect();

    let ownerId = null;
    if (session.role === ROLES.OWNER) {
      ownerId = await getAuthorizedOwnerId(session);
      if (!ownerId) {
        return NextResponse.json({ error: "Owner account not found" }, { status: 401 });
      }
    }

    const query = buildLeaseLookupQuery(targetId, ownerId);
    const lease = await Lease.findOne(query).lean();

    if (!lease) {
      return NextResponse.json({ error: "Lease not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      lease: {
        id: lease._id.toString(),
        leaseId: lease.leaseId,
        ownerId: lease.ownerId ? lease.ownerId.toString() : null,
        tenantId: lease.tenantId ? lease.tenantId.toString() : null,
        tenant: lease.tenantName,
        tenantName: lease.tenantName,
        tenantEmail: lease.tenantEmail || "",
        tenantPhone: lease.tenantPhone || "",
        propertyId: lease.propertyId ? lease.propertyId.toString() : null,
        propertyName: lease.propertyName,
        unit: lease.unit || "",
        property: lease.unit ? `${lease.propertyName} (${lease.unit})` : lease.propertyName,
        startDate: lease.startDate,
        endDate: lease.endDate,
        rent: Number(lease.rent),
        deposit: Number(lease.deposit || 0),
        billingCycle: lease.billingCycle || "1st - 5th Monthly",
        status: lease.status || "Active",
        terms: Array.isArray(lease.terms) ? lease.terms : [],
        notes: lease.notes || "",
        createdAt: lease.createdAt,
        updatedAt: lease.updatedAt,
      },
    });
  } catch (error) {
    console.error("Fetch single lease error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lease: " + (error.message || "Internal server error") },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session || (session.role !== ROLES.OWNER && session.role !== ROLES.ADMIN)) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can edit leases." },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const targetId = resolvedParams?.id || resolvedParams?.leaseId;

    if (!targetId) {
      return NextResponse.json({ error: "Lease ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const {
      tenant,
      tenantName,
      tenantEmail,
      tenantPhone,
      tenantId,
      property,
      propertyName,
      unit,
      startDate,
      endDate,
      rent,
      deposit,
      billingCycle,
      status,
      terms,
      notes,
    } = body;

    await dbConnect();

    let ownerId = null;
    if (session.role === ROLES.OWNER) {
      ownerId = await getAuthorizedOwnerId(session);
      if (!ownerId) {
        return NextResponse.json({ error: "Owner account not found" }, { status: 401 });
      }
    }

    const query = buildLeaseLookupQuery(targetId, ownerId);
    const existing = await Lease.findOne(query);

    if (!existing) {
      return NextResponse.json({ error: "Lease agreement not found or unauthorized." }, { status: 404 });
    }

    // Apply updates
    if (tenantId !== undefined) {
      if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
        const existingTenant = await User.findOne({
          _id: tenantId,
          role: ROLES.TENANT,
          createdBy: ownerId,
        });
        if (!existingTenant) {
          return NextResponse.json(
            { error: "Selected tenant was not found or does not belong to your account." },
            { status: 400 }
          );
        }
        existing.tenantId = existingTenant._id;
      } else {
        existing.tenantId = null;
      }
    }
    if (tenantName !== undefined || tenant !== undefined) {
      const finalName = (tenantName || tenant || "").trim();
      if (!finalName) {
        return NextResponse.json({ error: "Tenant name cannot be empty." }, { status: 400 });
      }
      existing.tenantName = finalName;
    }

    if (tenantEmail !== undefined) {
      existing.tenantEmail = String(tenantEmail).trim().toLowerCase();
    }

    if (tenantPhone !== undefined) {
      existing.tenantPhone = String(tenantPhone).trim();
    }

    if (propertyName !== undefined || property !== undefined) {
      let finalProp = (propertyName || property || "").trim();
      if (!finalProp) {
        return NextResponse.json({ error: "Property name cannot be empty." }, { status: 400 });
      }
      const unitMatch = finalProp.match(/\((Unit\s*[^)]+)\)$/i);
      if (unitMatch && unit === undefined) {
        existing.unit = unitMatch[1].trim();
        finalProp = finalProp.replace(/\s*\([^)]+\)$/, "").trim();
      }
      existing.propertyName = finalProp;
    }

    if (unit !== undefined) {
      existing.unit = String(unit).trim();
    }

    if (startDate !== undefined) {
      if (!startDate || typeof startDate !== "string" || !startDate.trim()) {
        return NextResponse.json({ error: "Start date cannot be empty." }, { status: 400 });
      }
      existing.startDate = startDate.trim();
    }

    if (endDate !== undefined) {
      if (!endDate || typeof endDate !== "string" || !endDate.trim()) {
        return NextResponse.json({ error: "End date cannot be empty." }, { status: 400 });
      }
      existing.endDate = endDate.trim();
    }

    if (rent !== undefined) {
      const parsedRent = Number(rent);
      if (isNaN(parsedRent) || parsedRent < 0) {
        return NextResponse.json({ error: "Monthly rent must be a positive number." }, { status: 400 });
      }
      existing.rent = parsedRent;
    }

    if (deposit !== undefined) {
      const parsedDeposit = Number(deposit);
      if (isNaN(parsedDeposit) || parsedDeposit < 0) {
        return NextResponse.json({ error: "Security deposit cannot be negative." }, { status: 400 });
      }
      existing.deposit = parsedDeposit;
    }

    if (billingCycle !== undefined) {
      existing.billingCycle = String(billingCycle).trim();
    }

    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      existing.status = status;
    }

    if (terms !== undefined) {
      if (Array.isArray(terms)) {
        existing.terms = terms.map((t) => String(t).trim()).filter(Boolean);
      } else if (typeof terms === "string") {
        existing.terms = terms.split("\n").map((t) => t.trim()).filter(Boolean);
      }
    }

    if (notes !== undefined) {
      existing.notes = String(notes).trim();
    }

    await existing.save();

    return NextResponse.json({
      success: true,
      message: `Lease "${existing.leaseId}" updated successfully!`,
      lease: {
        id: existing._id.toString(),
        leaseId: existing.leaseId,
        ownerId: existing.ownerId.toString(),
        tenant: existing.tenantName,
        tenantName: existing.tenantName,
        tenantEmail: existing.tenantEmail,
        tenantPhone: existing.tenantPhone,
        propertyName: existing.propertyName,
        unit: existing.unit,
        property: existing.unit ? `${existing.propertyName} (${existing.unit})` : existing.propertyName,
        startDate: existing.startDate,
        endDate: existing.endDate,
        rent: existing.rent,
        deposit: existing.deposit,
        billingCycle: existing.billingCycle,
        status: existing.status,
        terms: existing.terms,
        notes: existing.notes,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update lease error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update lease" },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
  return PATCH(request, context);
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session || (session.role !== ROLES.OWNER && session.role !== ROLES.ADMIN)) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can delete leases." },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const targetId = resolvedParams?.id || resolvedParams?.leaseId;

    if (!targetId) {
      return NextResponse.json({ error: "Lease ID is required" }, { status: 400 });
    }

    await dbConnect();

    let ownerId = null;
    if (session.role === ROLES.OWNER) {
      ownerId = await getAuthorizedOwnerId(session);
      if (!ownerId) {
        return NextResponse.json({ error: "Owner account not found" }, { status: 401 });
      }
    }

    const query = buildLeaseLookupQuery(targetId, ownerId);
    const deleted = await Lease.findOneAndDelete(query);

    if (!deleted) {
      return NextResponse.json({ error: "Lease contract not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Lease contract "${deleted.leaseId}" has been deleted.`,
    });
  } catch (error) {
    console.error("Delete lease error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete lease" },
      { status: 500 }
    );
  }
}
