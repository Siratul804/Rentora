import { cookies } from "next/headers";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Get JWT token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return Response.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Verify JWT
    let user = null;

    try {
      user = await verifyToken(token);
    } catch {
      user = null;
    }

    if (!user) {
      return Response.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 3. Check admin role
    if (user.role !== "admin") {
      return Response.json(
        { message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // 4. Temporary owner data
    const owners = [
      {
        id: "1",
        name: "Rahim Ahmed",
        email: "rahim@example.com",
        status: "Pending",
      },
      {
        id: "2",
        name: "Karim Hasan",
        email: "karim@example.com",
        status: "Approved",
      },
    ];

    // 5. Return owners
    return Response.json({
      success: true,
      owners,
    });
  } catch (error) {
    console.error("Admin Owners API Error:", error);

    return Response.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}