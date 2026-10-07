import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Unit from "@/lib/models/Unit";
import Property from "@/lib/models/Property";
import User from "@/lib/models/User";
import { getServerSession } from "@/lib/session";
import { ROLES } from "@/lib/auth";

const ALLOWED_STATUSES = ["Vacant", "Occupied", "Maintenance"];

async function getAuthorizedOwnerId(session) {
  if (mongoose.Types.ObjectId.isValid(session.id)) {
    return session.id;
  }
  const dbUser = await User.findOne({ email: session.email });
  return dbUser ? dbUser._id : null;
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

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    const query = {};
    if (session.role === ROLES.OWNER) {
      const ownerId = await getAuthorizedOwnerId(session);
      if (ownerId) query.ownerId = ownerId;
    }

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
        propertyId: u.propertyId?._id?.toString() || u.propertyId?.toString(),
        propertyName: u.propertyId?.name || "Unknown Property",
        rentAmount: u.rentAmount,
        deposit: u.deposit,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        size: u.size,
        status: u.status,
        tenant: u.tenantId
          ? {
              id: u.tenantId._id.toString(),
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
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}


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
    const { propertyId, unitNumber, rentAmount, deposit, bedrooms, bathrooms, size, status } = body;


    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json({ error: "Valid propertyId is required." }, { status: 400 });
    }

    if (!unitNumber || typeof unitNumber !== "string" || !unitNumber.trim()) {
      return NextResponse.json({ error: "Unit number is required." }, { status: 400 });
    }

    const parsedRent = Number(rentAmount);
    if (isNaN(parsedRent) || parsedRent < 0) {
      return NextResponse.json({ error: "Valid rent amount is required." }, { status: 400 });
    }

    await dbConnect();


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


    const existingUnit = await Unit.findOne({
      propertyId,
      unitNumber: unitNumber.trim(),
    });

    if (existingUnit) {
      return NextResponse.json(
        { error: `Unit "${unitNumber}" already exists in this property.` },
        { status: 409 }
      );
    }

    const newUnit = await Unit.create({
      ownerId: property.ownerId,
      propertyId,
      unitNumber: unitNumber.trim(),
      rentAmount: parsedRent,
      deposit: Number(deposit) || 0,
      bedrooms: Number(bedrooms) || 1,
      bathrooms: Number(bathrooms) || 1,
      size: size ? Number(size) : null,
      status: status && ALLOWED_STATUSES.includes(status) ? status : "Vacant",
    });

    return NextResponse.json(
      {
        success: true,
        message: `Unit "${newUnit.unitNumber}" created successfully!`,
        unit: {
          id: newUnit._id.toString(),
          unitNumber: newUnit.unitNumber,
          propertyId: newUnit.propertyId.toString(),
          rentAmount: newUnit.rentAmount,
          deposit: newUnit.deposit,
          bedrooms: newUnit.bedrooms,
          bathrooms: newUnit.bathrooms,
          size: newUnit.size,
          status: newUnit.status,
          createdAt: newUnit.createdAt,
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