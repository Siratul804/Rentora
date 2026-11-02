import mongoose from "mongoose";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import Lease from "@/lib/models/Lease";
import { getServerSession } from "@/lib/session";
import { ROLES } from "@/lib/auth";

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

export async function GET(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session || session.role !== ROLES.OWNER) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can access this endpoint." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    await dbConnect();

    const ownerId = await getAuthorizedOwnerId(session);
    if (!ownerId) {
      return NextResponse.json({ error: "Owner account not found" }, { status: 401 });
    }

    const filter = { _id: id, role: ROLES.TENANT, createdBy: ownerId };

    const tenant = await User.findOne(filter, { passwordHash: 0 }).lean();
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone || "—",
        property: tenant.property || "Not Assigned",
        unit: tenant.unit || "Not Assigned",
        rentStatus: tenant.rentStatus || "Pending",
        rentAmount: Number(tenant.rentAmount || 0),
        deposit: Number(tenant.deposit || 0),
        billingCycle: tenant.billingCycle || "1st - 5th Monthly",
        leaseStart: tenant.leaseStart || "",
        leaseEnd: tenant.leaseEnd || "—",
        isActive: tenant.isActive !== false,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get tenant error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenant details" },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
  return handleUpdateTenant(request, context);
}

export async function PATCH(request, context) {
  return handleUpdateTenant(request, context);
}

async function handleUpdateTenant(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session || session.role !== ROLES.OWNER) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can update tenants." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      property,
      unit,
      rentStatus,
      leaseEnd,
      leaseStart,
      rentAmount,
      deposit,
      billingCycle,
      isActive,
    } = body;

    await dbConnect();

    const ownerId = await getAuthorizedOwnerId(session);
    if (!ownerId) {
      return NextResponse.json({ error: "Owner account not found" }, { status: 401 });
    }

    const filter = { _id: id, role: ROLES.TENANT, createdBy: ownerId };

    const tenant = await User.findOne(filter);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Email validation & duplicate check if updating email
    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        return NextResponse.json({ error: "Email cannot be empty" }, { status: 400 });
      }

      const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
      if (adminEmail && cleanEmail === adminEmail) {
        return NextResponse.json(
          { error: "This email address is reserved for system administration" },
          { status: 400 }
        );
      }

      const existingUser = await User.findOne({
        email: cleanEmail,
        _id: { $ne: id },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: `A user with email "${cleanEmail}" already exists` },
          { status: 409 }
        );
      }

      tenant.email = cleanEmail;
    }

    if (name !== undefined) {
      const cleanName = name.trim();
      if (!cleanName) {
        return NextResponse.json({ error: "Tenant name cannot be empty" }, { status: 400 });
      }
      tenant.name = cleanName;
    }

    if (phone !== undefined) {
      tenant.phone = phone.trim();
    }

    if (property !== undefined) {
      tenant.property = property.trim();
    }

    if (unit !== undefined) {
      tenant.unit = unit.trim();
    }

    if (leaseEnd !== undefined) {
      tenant.leaseEnd = leaseEnd.trim();
    }

    if (leaseStart !== undefined) {
      tenant.leaseStart = leaseStart.trim();
    }

    if (rentAmount !== undefined) {
      const parsedRent = Number(rentAmount);
      if (!Number.isFinite(parsedRent) || parsedRent < 0) {
        return NextResponse.json({ error: "Monthly rent must be a valid non-negative amount." }, { status: 400 });
      }
      tenant.rentAmount = parsedRent;
    }

    if (deposit !== undefined) {
      const parsedDeposit = Number(deposit);
      if (!Number.isFinite(parsedDeposit) || parsedDeposit < 0) {
        return NextResponse.json({ error: "Security deposit must be a valid non-negative amount." }, { status: 400 });
      }
      tenant.deposit = parsedDeposit;
    }

    if (billingCycle !== undefined) {
      if (typeof billingCycle !== "string" || !billingCycle.trim()) {
        return NextResponse.json({ error: "Billing cycle cannot be empty." }, { status: 400 });
      }
      tenant.billingCycle = billingCycle.trim();
    }

    if (rentStatus !== undefined) {
      const validStatuses = ["Paid", "Pending", "Overdue"];
      if (validStatuses.includes(rentStatus)) {
        tenant.rentStatus = rentStatus;
      }
    }

    // Toggle active / deactivate status
    if (typeof isActive === "boolean") {
      tenant.isActive = isActive;
    }

    // Password reset if provided
    if (typeof password === "string" && password.length > 0) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }
      tenant.passwordHash = await bcrypt.hash(password, 10);
    }

    await tenant.save();

    const linkedLease = await Lease.findOne({
      ownerId,
      status: "Active",
      $or: [{ tenantId: tenant._id }, { tenantEmail: tenant.email }],
    });
    if (linkedLease) {
      if (rentAmount !== undefined) linkedLease.rent = tenant.rentAmount;
      if (deposit !== undefined) linkedLease.deposit = tenant.deposit;
      if (billingCycle !== undefined) linkedLease.billingCycle = tenant.billingCycle;
      if (leaseStart !== undefined) linkedLease.startDate = tenant.leaseStart;
      if (leaseEnd !== undefined) linkedLease.endDate = tenant.leaseEnd;
      if ([rentAmount, deposit, billingCycle, leaseStart, leaseEnd].some((value) => value !== undefined)) {
        await linkedLease.save();
      }
    }

    const statusMessage =
      typeof isActive === "boolean"
        ? isActive
          ? `Tenant "${tenant.name}" has been activated.`
          : `Tenant "${tenant.name}" has been deactivated.`
        : `Tenant "${tenant.name}" updated successfully.`;

    return NextResponse.json({
      success: true,
      message: statusMessage,
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone || "—",
        property: tenant.property || "Not Assigned",
        unit: tenant.unit || "Not Assigned",
        rentStatus: tenant.rentStatus || "Pending",
        rentAmount: Number(tenant.rentAmount || 0),
        deposit: Number(tenant.deposit || 0),
        billingCycle: tenant.billingCycle || "1st - 5th Monthly",
        leaseStart: tenant.leaseStart || "",
        leaseEnd: tenant.leaseEnd || "—",
        isActive: tenant.isActive !== false,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update tenant error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update tenant" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session || session.role !== ROLES.OWNER) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can delete tenants." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    await dbConnect();

    const ownerId = await getAuthorizedOwnerId(session);
    if (!ownerId) {
      return NextResponse.json({ error: "Owner account not found" }, { status: 401 });
    }

    const filter = { _id: id, role: ROLES.TENANT, createdBy: ownerId };

    const deleted = await User.findOneAndDelete(filter);

    if (!deleted) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Tenant "${deleted.name}" has been removed.`,
    });
  } catch (error) {
    console.error("Delete tenant error:", error);
    return NextResponse.json(
      { error: "Failed to delete tenant" },
      { status: 500 }
    );
  }
}
