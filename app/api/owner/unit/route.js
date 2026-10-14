import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Unit from "@/lib/models/Unit";
import Property from "@/lib/models/Property";
import User from "@/lib/models/User";
import { getServerSession } from "@/lib/session";
import { ROLES } from "@/lib/auth";

const ALLOWED_STATUSES = ["Available", "Occupied", "Maintenance"];

async function getAuthorizedOwnerId(session) {
  if (mongoose.Types.ObjectId.isValid(session.id)) {
    return session.id;
  }
  const dbUser = await User.findOne({ email: session.email });
  return dbUser ? dbUser._id : null;
}

// 🟢 GET: Fetch all units for current owner
export async function GET(request) {
  try {
    const session = await getServerSession();

    if (!session || (session.role !== ROLES.OWNER && session.role !== ROLES.ADMIN)) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in as a property owner." },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    const query = {};

    // Filter by owner's properties if role is owner
    if (session.role === ROLES.OWNER) {
      const ownerId = await getAuthorizedOwnerId(session);
      if (ownerId) {
        const ownerProperties = await Property.find({ ownerId }).select("_id").lean();
        const propertyIds = ownerProperties.map((p) => p._id);
        query.propertyId = { $in: propertyIds };
      }
    }

    // Specific property filter if passed in query params
    if (propertyId) {
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        return NextResponse.json({ error: "Invalid property ID parameter" }, { status: 400 });
      }
      query.propertyId = propertyId;
    }

    const units = await Unit.find(query)
      .populate("propertyId", "name address")
      .populate("tenantId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      units: units.map((u) => ({
        id: u._id.toString(),
        unitNumber: u.unitNumber,
        size: u.size,
        rentAmount: u.rentAmount || 0,
        availabilityStatus: u.availabilityStatus,
        description: u.description || "",
        property: u.propertyId
          ? {
              id: u.propertyId._id?.toString() || u.propertyId.toString(),
              name: u.propertyId.name,
              address: u.propertyId.address,
            }
          : null,
        tenant: u.tenantId
          ? {
              id: u.tenantId._id?.toString() || u.tenantId.toString(),
              name: u.tenantId.name,
              email: u.tenantId.email,
              phone: u.tenantId.phone,
            }
          : null,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Fetch units error:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
      { status: 500 }
    );
  }
}

// 🟢 POST: Create a new unit
export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session || (session.role !== ROLES.OWNER && session.role !== ROLES.ADMIN)) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can add units." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { propertyId, unitNumber, size, rentAmount, availabilityStatus, description } = body;

    // Field Validations
    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { error: "Valid property ID is required." },
        { status: 400 }
      );
    }

    if (!unitNumber || typeof unitNumber !== "string" || !unitNumber.trim()) {
      return NextResponse.json(
        { error: "Unit number is required." },
        { status: 400 }
      );
    }

    const parsedSize = Number(size);
    if (!parsedSize || isNaN(parsedSize) || parsedSize < 1) {
      return NextResponse.json(
        { error: "Size must be a positive number (minimum 1 sq ft)." },
        { status: 400 }
      );
    }

    const status = availabilityStatus && ALLOWED_STATUSES.includes(availabilityStatus)
      ? availabilityStatus
      : "Available";

    await dbConnect();

    // Verify ownership of the property
    const ownerId = await getAuthorizedOwnerId(session);
    const propertyQuery = { _id: propertyId };
    if (session.role === ROLES.OWNER && ownerId) {
      propertyQuery.ownerId = ownerId;
    }

    const property = await Property.findOne(propertyQuery);
    if (!property) {
      return NextResponse.json(
        { error: "Property not found or you do not have permission to add units to it." },
        { status: 404 }
      );
    }

    // Check for duplicate unit number in the same property
    const existingUnit = await Unit.findOne({
      propertyId,
      unitNumber: unitNumber.trim(),
    });

    if (existingUnit) {
      return NextResponse.json(
        { error: `Unit "${unitNumber.trim()}" already exists in this property.` },
        { status: 409 }
      );
    }

    const newUnit = await Unit.create({
      propertyId,
      unitNumber: unitNumber.trim(),
      size: parsedSize,
      rentAmount: rentAmount !== undefined ? Number(rentAmount) : 0,
      availabilityStatus: status,
      description: description ? description.trim() : "",
    });

    return NextResponse.json(
      {
        success: true,
        message: `Unit "${newUnit.unitNumber}" successfully created!`,
        unit: {
          id: newUnit._id.toString(),
          unitNumber: newUnit.unitNumber,
          size: newUnit.size,
          rentAmount: newUnit.rentAmount,
          availabilityStatus: newUnit.availabilityStatus,
          description: newUnit.description,
          propertyId: newUnit.propertyId.toString(),
          createdAt: newUnit.createdAt,
          updatedAt: newUnit.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create unit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create unit" },
      { status: 500 }
    );
  }
}