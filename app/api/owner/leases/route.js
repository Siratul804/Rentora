import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Lease from "@/lib/models/Lease";
import Property from "@/lib/models/Property";
import User from "@/lib/models/User";
import { getServerSession } from "@/lib/session";
import { ROLES } from "@/lib/auth";

const ALLOWED_STATUSES = ["Active", "Pending", "Expired", "Terminated"];

async function getAuthorizedOwnerId(session) {
  if (mongoose.Types.ObjectId.isValid(session?.id)) {
    return session.id;
  }
  if (session?.email) {
    const dbUser = await User.findOne({ email: session.email });
    if (dbUser) return dbUser._id;
  }
  const anyOwner = await User.findOne({ role: ROLES.OWNER });
  return anyOwner ? anyOwner._id : null;
}

function generateLeaseId() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `L-${year}-${randomSuffix}`;
}

export async function GET(request) {
  try {
    const session = await getServerSession();

    if (!session || (session.role !== ROLES.OWNER && session.role !== ROLES.ADMIN)) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can access this endpoint." },
        { status: 403 }
      );
    }

    await dbConnect();

    const query = {};
    if (session.role === ROLES.OWNER) {
      const ownerId = await getAuthorizedOwnerId(session);
      if (ownerId) {
        query.ownerId = ownerId;
      }
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    if (status && ALLOWED_STATUSES.includes(status)) {
      query.status = status;
    }

    const leases = await Lease.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      leases: leases.map((lease) => ({
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
      })),
    });
  } catch (error) {
    console.error("Fetch leases error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leases: " + (error.message || "Internal server error") },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session || (session.role !== ROLES.OWNER && session.role !== ROLES.ADMIN)) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can add leases." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      leaseId: customLeaseId,
      tenant,
      tenantName,
      tenantEmail,
      tenantPhone,
      tenantId,
      property,
      propertyName,
      unit,
      propertyId,
      startDate,
      endDate,
      rent,
      deposit,
      billingCycle,
      status,
      terms,
      notes,
    } = body;

    const finalTenantName = (tenantName || tenant || "").trim();
    if (!finalTenantName) {
      return NextResponse.json(
        { error: "Tenant name is required." },
        { status: 400 }
      );
    }

    // Property name handling (extract name and unit if property was e.g. "Green Horizon (Unit 4B)")
    let finalPropertyName = (propertyName || property || "").trim();
    let finalUnit = (unit || "").trim();

    if (!finalPropertyName) {
      return NextResponse.json(
        { error: "Property name or building reference is required." },
        { status: 400 }
      );
    }

    // If unit is not passed separately, check if property has (Unit XX)
    const unitMatch = finalPropertyName.match(/\((Unit\s*[^)]+)\)$/i);
    if (unitMatch && !finalUnit) {
      finalUnit = unitMatch[1].trim();
      finalPropertyName = finalPropertyName.replace(/\s*\([^)]+\)$/, "").trim();
    }

    if (!startDate || typeof startDate !== "string" || !startDate.trim()) {
      return NextResponse.json(
        { error: "Lease start date is required (YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    if (!endDate || typeof endDate !== "string" || !endDate.trim()) {
      return NextResponse.json(
        { error: "Lease end date is required (YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    const parsedRent = Number(rent);
    if (isNaN(parsedRent) || parsedRent < 0) {
      return NextResponse.json(
        { error: "Valid monthly rent amount is required." },
        { status: 400 }
      );
    }

    const parsedDeposit = deposit !== undefined ? Number(deposit) : 0;
    if (isNaN(parsedDeposit) || parsedDeposit < 0) {
      return NextResponse.json(
        { error: "Security deposit must be a valid non-negative number." },
        { status: 400 }
      );
    }

    const finalStatus = status && ALLOWED_STATUSES.includes(status) ? status : "Active";

    await dbConnect();

    // Resolve ownerId
    let ownerId = await getAuthorizedOwnerId(session);
    if (!ownerId) {
      return NextResponse.json(
        { error: "Valid owner account not found. Please log in with a valid owner profile." },
        { status: 400 }
      );
    }

    // Generate unique leaseId if not provided
    let leaseNumber = (customLeaseId || "").trim();
    if (!leaseNumber) {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 5) {
        leaseNumber = generateLeaseId();
        const existing = await Lease.findOne({ leaseId: leaseNumber });
        if (!existing) isUnique = true;
        attempts++;
      }
    } else {
      const existing = await Lease.findOne({ leaseId: leaseNumber });
      if (existing) {
        return NextResponse.json(
          { error: `Lease ID "${leaseNumber}" already exists. Please choose a different agreement ID.` },
          { status: 400 }
        );
      }
    }

    // Process terms
    let parsedTerms = [];
    if (Array.isArray(terms)) {
      parsedTerms = terms.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof terms === "string" && terms.trim()) {
      parsedTerms = terms.split("\n").map((t) => t.trim()).filter(Boolean);
    }

    const newLease = await Lease.create({
      leaseId: leaseNumber,
      ownerId,
      tenantId: mongoose.Types.ObjectId.isValid(tenantId) ? tenantId : null,
      tenantName: finalTenantName,
      tenantEmail: (tenantEmail || "").trim().toLowerCase(),
      tenantPhone: (tenantPhone || "").trim(),
      propertyId: mongoose.Types.ObjectId.isValid(propertyId) ? propertyId : null,
      propertyName: finalPropertyName,
      unit: finalUnit,
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      rent: parsedRent,
      deposit: parsedDeposit,
      billingCycle: (billingCycle || "1st - 5th Monthly").trim(),
      status: finalStatus,
      terms: parsedTerms,
      notes: (notes || "").trim(),
    });

    return NextResponse.json(
      {
        success: true,
        message: `Lease contract "${newLease.leaseId}" drafted successfully!`,
        lease: {
          id: newLease._id.toString(),
          leaseId: newLease.leaseId,
          ownerId: newLease.ownerId.toString(),
          tenant: newLease.tenantName,
          tenantName: newLease.tenantName,
          tenantEmail: newLease.tenantEmail,
          tenantPhone: newLease.tenantPhone,
          propertyName: newLease.propertyName,
          unit: newLease.unit,
          property: newLease.unit ? `${newLease.propertyName} (${newLease.unit})` : newLease.propertyName,
          startDate: newLease.startDate,
          endDate: newLease.endDate,
          rent: newLease.rent,
          deposit: newLease.deposit,
          billingCycle: newLease.billingCycle,
          status: newLease.status,
          terms: newLease.terms,
          notes: newLease.notes,
          createdAt: newLease.createdAt,
          updatedAt: newLease.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create lease error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create lease" },
      { status: 500 }
    );
  }
}
