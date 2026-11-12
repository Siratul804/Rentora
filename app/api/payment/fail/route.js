import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const email = (formData.get("value_a") || "").trim().toLowerCase();

    if (email) {
      await dbConnect();
      await User.findOneAndUpdate(
        { email, status: { $ne: "Paid" } },
        { status: "Failed" }
      );
    }

    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("payment", "failed");
    if (email) redirectUrl.searchParams.set("email", email);

    return NextResponse.redirect(redirectUrl, 303);
  } catch {
    return NextResponse.redirect(new URL("/login?payment=failed", request.url), 303);
  }
}

export async function GET(request) {
  return NextResponse.redirect(new URL("/login?payment=failed", request.url));
}
