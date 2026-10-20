import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const email = (formData.get("value_a") || "").trim().toLowerCase();

    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("payment", "cancelled");
    if (email) redirectUrl.searchParams.set("email", email);

    return NextResponse.redirect(redirectUrl, 303);
  } catch {
    return NextResponse.redirect(new URL("/login?payment=cancelled", request.url), 303);
  }
}

export async function GET(request) {
  return NextResponse.redirect(new URL("/login?payment=cancelled", request.url));
}
