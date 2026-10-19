import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const tran_id = formData.get("tran_id") || "";

    const redirectUrl = new URL("/payment-test", request.url);
    redirectUrl.searchParams.set("status", "cancelled");
    if (tran_id) redirectUrl.searchParams.set("tran_id", tran_id);

    return NextResponse.redirect(redirectUrl, 303);
  } catch {
    return NextResponse.redirect(new URL("/payment-test?status=cancelled", request.url), 303);
  }
}

export async function GET(request) {
  return NextResponse.redirect(new URL("/payment-test?status=cancelled", request.url));
}
