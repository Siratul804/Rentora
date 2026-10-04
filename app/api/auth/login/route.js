import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { signToken, getCookieOptions, AUTH_COOKIE_NAME } from "@/lib/jwt";
import { getRoleDashboardPath, ROLES } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "";

    // 1. Check Admin credentials from .env
    if (adminEmail && cleanEmail === adminEmail) {
      if (password !== adminPassword) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Admin authenticated via .env credentials
      const adminUser = {
        id: "admin-env",
        email: adminEmail,
        name: "Platform Administrator",
        role: ROLES.ADMIN,
        avatar: "👑",
      };

      const token = await signToken(adminUser);
      const response = NextResponse.json({
        success: true,
        message: "Signed in as Admin",
        user: adminUser,
        redirectUrl: "/admin/dashboard",
      });

      response.cookies.set(AUTH_COOKIE_NAME, token, getCookieOptions());
      return response;
    }

    // 2. Authenticate Owner or Tenant from MongoDB
    await dbConnect();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const userPayload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role, // "owner" or "tenant"
      phone: user.phone || "",
      property: user.property || "",
      unit: user.unit || "",
      avatar: user.role === "owner" ? "🏢" : "👤",
    };

    const token = await signToken(userPayload);
    const redirectUrl = getRoleDashboardPath(user.role);

    const response = NextResponse.json({
      success: true,
      message: `Signed in successfully as ${user.role}`,
      user: userPayload,
      redirectUrl,
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, getCookieOptions());
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}
