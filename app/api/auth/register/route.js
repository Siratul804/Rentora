import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { signToken, getCookieOptions, AUTH_COOKIE_NAME } from "@/lib/jwt";
import { ROLES, getRoleDashboardPath } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, phone } = body;

    // Basic validations
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

    // Prevent registering with admin email
    if (adminEmail && cleanEmail === adminEmail) {
      return NextResponse.json(
        { error: "This email is reserved for system administration" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Only Owner accounts can be registered publicly
    const newOwner = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: ROLES.OWNER,
      phone: phone ? phone.trim() : "",
    });

    const userPayload = {
      id: newOwner._id.toString(),
      email: newOwner.email,
      name: newOwner.name,
      role: ROLES.OWNER,
      phone: newOwner.phone || "",
      avatar: "🏢",
    };

    const token = await signToken(userPayload);
    const redirectUrl = getRoleDashboardPath(ROLES.OWNER);

    const response = NextResponse.json(
      {
        success: true,
        message: "Owner account created successfully",
        user: userPayload,
        redirectUrl,
      },
      { status: 201 }
    );

    response.cookies.set(AUTH_COOKIE_NAME, token, getCookieOptions());
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
