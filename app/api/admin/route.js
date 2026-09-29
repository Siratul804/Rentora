import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "rentora admin",
    message: "rentora admin api",
    status: "success",
  });
}
