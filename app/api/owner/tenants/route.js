import mongoose from "mongoose";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
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

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session || session.role !== ROLES.OWNER) {
      return NextResponse.json(
        { error: "Unauthorized. Only property owners can access this endpoint." },
        { status: 403 }
      );
    }

    await dbConnect();

    const ownerId = await getAuthorizedOwnerId(session);
    if (!ownerId) {
      return NextResponse.json(
        { error: "Owner account not found. Please sign in again." },
        { status: 401 }
      );
    }

    // Fetch tenants created by this authenticated owner
    const query = { role: ROLES.TENANT, createdBy: ownerId };

    const tenants = await User.find(query, { passwordHash: 0 })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      tenants: tenants.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        email: t.email,
        phone: t.phone || "—",
        property: t.property || "Not Assigned",
        unit: t.unit || "Not Assigned",
        rentStatus: t.rentStatus || "Pending",
        leaseEnd: t.leaseEnd || "—",
        isActive: t.isActive !== false,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("Fetch tenants error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenants" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session || session.role !== ROLES.OWNER) {
      return NextResponse.json(
        { error: "Unauthorized. Only verified property owners can add tenants." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, phone, property, unit, rentStatus, leaseEnd } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tenant name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Temporary password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

    if (adminEmail && cleanEmail === adminEmail) {
      return NextResponse.json(
        { error: "This email address is reserved for system administration" },
        { status: 400 }
      );
    }

    await dbConnect();

    const ownerId = await getAuthorizedOwnerId(session);
    if (!ownerId) {
      return NextResponse.json(
        { error: "Owner account not found. Please sign in again." },
        { status: 401 }
      );
    }

    // Check if user already exists
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { error: `A user with email "${cleanEmail}" already exists` },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newTenant = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: ROLES.TENANT, // Strictly Tenant role
      phone: phone ? phone.trim() : "",
      property: property ? property.trim() : "Main Property",
      unit: unit ? unit.trim() : "General Unit",
      rentStatus: rentStatus || "Pending",
      leaseEnd: leaseEnd ? leaseEnd.trim() : "",
      createdBy: ownerId,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Tenant "${newTenant.name}" successfully onboarded! They can now log in using ${newTenant.email}.`,
        tenant: {
          id: newTenant._id.toString(),
          name: newTenant.name,
          email: newTenant.email,
          phone: newTenant.phone,
          property: newTenant.property,
          unit: newTenant.unit,
          rentStatus: newTenant.rentStatus,
          leaseEnd: newTenant.leaseEnd,
          isActive: newTenant.isActive !== false,
          createdAt: newTenant.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create tenant error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create tenant" },
      { status: 500 }
    );
  }
}
