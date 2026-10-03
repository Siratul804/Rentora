import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "rentora_super_secret_jwt_key_2026_fallback";
const key = new TextEncoder().encode(JWT_SECRET);
const AUTH_COOKIE_NAME = "rentora_token";

function getRoleDashboardPath(role) {
  const norm = (role || "").toLowerCase();
  switch (norm) {
    case "admin":
      return "/admin/dashboard";
    case "owner":
      return "/owner/dashboard";
    case "tenant":
      return "/tenant/dashboard";
    default:
      return "/login";
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  let session = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, key);
      session = payload;
    } catch {
      session = null;
    }
  }

  const isAuthenticated = !!session;
  const role = session?.role?.toLowerCase();

  // 1. If accessing auth pages (/login, /register)
  if (pathname === "/login" || pathname === "/register") {
    if (isAuthenticated && role) {
      // Redirect already logged-in user to their respective dashboard
      const destination = getRoleDashboardPath(role);
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  // 2. Protect Admin routes (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "admin") {
      // Non-admin tried to access admin route -> redirect to their own portal
      const target = getRoleDashboardPath(role);
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // 3. Protect Owner routes (/owner/*)
  if (pathname.startsWith("/owner")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "owner") {
      // If admin, or tenant tries to access owner route
      const target = getRoleDashboardPath(role);
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // 4. Protect Tenant routes (/tenant/*)
  if (pathname.startsWith("/tenant")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "tenant") {
      const target = getRoleDashboardPath(role);
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/owner/:path*",
    "/tenant/:path*",
    "/login",
    "/register",
  ],
};
