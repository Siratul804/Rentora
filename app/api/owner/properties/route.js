import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Property from "@/lib/models/Property";
import User from "@/lib/models/User";
import { getServerSession } from "@/lib/session";
import { ROLES } from "@/lib/auth";

const ALLOWED_TYPES = ["Apartment", "House", "Commercial", "Office", "Other"];
const ALLOWED_STATUSES = ["Active", "Inactive"];

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session || (session.role !== ROLES.OWNER && session.role !== ROLES.ADMIN)) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can access this endpoint." },
        { status: 403 }
      );
    }

    await dbConnect();

    // Determine query based on owner or admin role
    const query = {};
    if (session.role === ROLES.OWNER) {
      if (mongoose.Types.ObjectId.isValid(session.id)) {
        query.ownerId = session.id;
      } else {
        const ownerUser = await User.findOne({ email: session.email });
        if (ownerUser) {
          query.ownerId = ownerUser._id;
        }
      }
    }

    const properties = await Property.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      properties: properties.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        address: p.address,
        type: p.type,
        totalUnits: p.totalUnits,
        status: p.status,
        ownerId: p.ownerId ? p.ownerId.toString() : null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Fetch properties error:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session || (session.role !== ROLES.OWNER && session.role !== ROLES.ADMIN)) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can add properties." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, address, type, totalUnits, status } = body;

    // Field Validations
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Property name is required." },
        { status: 400 }
      );
    }

    if (!address || typeof address !== "string" || !address.trim()) {
      return NextResponse.json(
        { error: "Property address is required." },
        { status: 400 }
      );
    }

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        {
          error: `Invalid property type. Must be one of: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const parsedUnits = Number(totalUnits);
    if (!parsedUnits || isNaN(parsedUnits) || parsedUnits < 1 || !Number.isInteger(parsedUnits)) {
      return NextResponse.json(
        { error: "Total units must be a positive integer (minimum 1)." },
        { status: 400 }
      );
    }

    const propertyStatus = status && ALLOWED_STATUSES.includes(status) ? status : "Active";

    await dbConnect();

    // Resolve ownerId
    let ownerId = session.id;
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      const dbUser = await User.findOne({ email: session.email });
      if (dbUser) {
        ownerId = dbUser._id;
      } else {
        const anyOwner = await User.findOne({ role: ROLES.OWNER });
        if (anyOwner) {
          ownerId = anyOwner._id;
        } else {
          return NextResponse.json(
            { error: "Valid owner profile not found. Please log in with a valid owner account." },
            { status: 400 }
          );
        }
      }
    }

    const newProperty = await Property.create({
      ownerId,
      name: name.trim(),
      address: address.trim(),
      type,
      totalUnits: parsedUnits,
      status: propertyStatus,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Property "${newProperty.name}" successfully created!`,
        property: {
          id: newProperty._id.toString(),
          name: newProperty.name,
          address: newProperty.address,
          type: newProperty.type,
          totalUnits: newProperty.totalUnits,
          status: newProperty.status,
          ownerId: newProperty.ownerId.toString(),
          createdAt: newProperty.createdAt,
          updatedAt: newProperty.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create property error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create property" },
      { status: 500 }
    );
  }
}
