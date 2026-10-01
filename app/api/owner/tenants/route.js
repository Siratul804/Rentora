import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { getServerSession } from "@/lib/session";
import { ROLES } from "@/lib/auth";

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

    // Fetch tenants created by this owner or all tenants if master owner
    const query = { role: ROLES.TENANT };
    if (session.id && session.id !== "owner-1") {
      query.$or = [{ createdBy: session.id }, { createdBy: null }];
    }

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
      createdBy: session.id !== "owner-1" ? session.id : null,
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
