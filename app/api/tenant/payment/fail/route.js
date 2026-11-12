import { NextResponse } from "next/server";

export function POST(request) {
  return NextResponse.redirect(new URL("/tenant/payments?payment=failed", request.url), 303);
}

export function GET(request) {
  const cancelled = new URL(request.url).searchParams.get("cancelled") === "true";
  return NextResponse.redirect(new URL(`/tenant/payments?payment=${cancelled ? "cancelled" : "failed"}`, request.url), 303);
}
