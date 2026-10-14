import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Unit from "@/lib/models/Unit";
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

// 🟢 GET single Unit by ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session || (session.role !== ROLES.OWNER && session.role !== ROLES.ADMIN)) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in as a property owner." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Unit ID" }, { status: 400 });
    }

    await dbConnect();

    const unit = await Unit.findById(id)
      .populate("propertyId", "name address ownerId")
      .populate("tenantId", "name email phone")
      .lean();

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // Ownership check for owner role
    if (session.role === ROLES.OWNER) {
      const ownerId = await getAuthorizedOwnerId(session);
      if (ownerId && unit.propertyId?.ownerId?.toString() !== ownerId.toString()) {
        return NextResponse.json({ error: "Unauthorized access to this unit" }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      unit: {
        id: unit._id.toString(),
        unitNumber: unit.unitNumber,
        size: unit.size,
        rentAmount: unit.rentAmount || 0,
        availabilityStatus: unit.availabilityStatus,
        description: unit.description || "",
        property: unit.propertyId
          ? {
              id: unit.propertyId._id?.toString() || unit.propertyId.toString(),
              name: unit.propertyId.name,
              address: unit.propertyId.address,
            }
          : null,
        tenant: unit.tenantId
          ? {
              id: unit.tenantId._id?.toString() || unit.tenantId.toString(),
              name: unit.tenantId.name,
              email: unit.tenantId.email,
              phone: unit.tenantId.phone,
            }
          : null,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
      },
    });
  } catch (error) {
    console.error("Fetch unit by ID error:", error);
    return NextResponse.json({ error: "Failed to fetch unit" }, { status: 500 });
  }
}

// 🟢 PATCH update Unit by ID
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session || (session.role !== ROLES.OWNER && session.role !== ROLES.ADMIN)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Unit ID" }, { status: 400 });
    }

    const body = await request.json();
    const { unitNumber, size, rentAmount, availabilityStatus, description, tenantId } = body;

    await dbConnect();

    const unit = await Unit.findById(id).populate("propertyId", "ownerId");
    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    if (session.role === ROLES.OWNER) {
      const ownerId = await getAuthorizedOwnerId(session);
      if (ownerId && unit.propertyId?.ownerId?.toString() !== ownerId.toString()) {
        return NextResponse.json({ error: "Unauthorized to update this unit" }, { status: 403 });
      }
    }

    const updates = {};
    if (unitNumber !== undefined) updates.unitNumber = unitNumber.trim();
    if (size !== undefined) updates.size = Number(size);
    if (rentAmount !== undefined) updates.rentAmount = Number(rentAmount);
    if (description !== undefined) updates.description = description.trim();
    if (availabilityStatus !== undefined) {
      if (!ALLOWED_STATUSES.includes(availabilityStatus)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      updates.availabilityStatus = availabilityStatus;
    }
    if (tenantId !== undefined) {
      updates.tenantId = tenantId ? tenantId : null;
    }

    const updated = await Unit.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({
      success: true,
      message: "Unit updated successfully",
      unit: updated,
    });
  } catch (error) {
    console.error("Update unit error:", error);
    return NextResponse.json({ error: error.message || "Failed to update unit" }, { status: 500 });
  }
}

// 🟢 DELETE Unit by ID
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session || (session.role !== ROLES.OWNER && session.role !== ROLES.ADMIN)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Unit ID" }, { status: 400 });
    }

    await dbConnect();

    const unit = await Unit.findById(id).populate("propertyId", "ownerId");
    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    if (session.role === ROLES.OWNER) {
      const ownerId = await getAuthorizedOwnerId(session);
      if (ownerId && unit.propertyId?.ownerId?.toString() !== ownerId.toString()) {
        return NextResponse.json({ error: "Unauthorized to delete this unit" }, { status: 403 });
      }
    }

    await Unit.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Unit "${unit.unitNumber}" deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete unit error:", error);
    return NextResponse.json({ error: "Failed to delete unit" }, { status: 500 });
  }
}
