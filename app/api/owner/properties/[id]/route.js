import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Property from "@/lib/models/Property";
import User from "@/lib/models/User";
import { getServerSession } from "@/lib/session";
import { ROLES } from "@/lib/auth";

const ALLOWED_TYPES = ["Apartment", "House", "Commercial", "Office", "Other"];
const ALLOWED_STATUSES = ["Active", "Inactive"];

async function getAuthorizedOwnerId(session) {
  if (mongoose.Types.ObjectId.isValid(session.id)) {
    return session.id;
  }
  const dbUser = await User.findOne({ email: session.email });
  return dbUser ? dbUser._id : null;
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

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    await dbConnect();

    const query = { _id: id };
    if (session.role === ROLES.OWNER) {
      const ownerId = await getAuthorizedOwnerId(session);
      if (ownerId) query.ownerId = ownerId;
    }

    const property = await Property.findOne(query).lean();
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      property: {
        id: property._id.toString(),
        name: property.name,
        address: property.address,
        type: property.type,
        totalUnits: property.totalUnits,
        status: property.status,
        ownerId: property.ownerId.toString(),
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      },
    });
  } catch (error) {
    console.error("Fetch single property error:", error);
    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session || (session.role !== ROLES.OWNER && session.role !== ROLES.ADMIN)) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can update properties." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, address, type, totalUnits, status } = body;

    const updates = {};
    if (name !== undefined) {
      if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Property name cannot be empty." }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (address !== undefined) {
      if (!address || typeof address !== "string" || !address.trim()) {
        return NextResponse.json({ error: "Property address cannot be empty." }, { status: 400 });
      }
      updates.address = address.trim();
    }

    if (type !== undefined) {
      if (!ALLOWED_TYPES.includes(type)) {
        return NextResponse.json(
          { error: `Invalid property type. Must be one of: ${ALLOWED_TYPES.join(", ")}` },
          { status: 400 }
        );
      }
      updates.type = type;
    }

    if (totalUnits !== undefined) {
      const parsedUnits = Number(totalUnits);
      if (!parsedUnits || isNaN(parsedUnits) || parsedUnits < 1 || !Number.isInteger(parsedUnits)) {
        return NextResponse.json(
          { error: "Total units must be a positive integer (minimum 1)." },
          { status: 400 }
        );
      }
      updates.totalUnits = parsedUnits;
    }

    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    await dbConnect();

    const query = { _id: id };
    if (session.role === ROLES.OWNER) {
      const ownerId = await getAuthorizedOwnerId(session);
      if (ownerId) query.ownerId = ownerId;
    }

    const updated = await Property.findOneAndUpdate(query, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: "Property not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Property updated successfully",
      property: {
        id: updated._id.toString(),
        name: updated.name,
        address: updated.address,
        type: updated.type,
        totalUnits: updated.totalUnits,
        status: updated.status,
        ownerId: updated.ownerId.toString(),
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update property error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update property" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session || (session.role !== ROLES.OWNER && session.role !== ROLES.ADMIN)) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can delete properties." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    await dbConnect();

    const query = { _id: id };
    if (session.role === ROLES.OWNER) {
      const ownerId = await getAuthorizedOwnerId(session);
      if (ownerId) query.ownerId = ownerId;
    }

    const deleted = await Property.findOneAndDelete(query);

    if (!deleted) {
      return NextResponse.json({ error: "Property not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Property "${deleted.name}" has been deleted.`,
    });
  } catch (error) {
    console.error("Delete property error:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
