import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        name: "rentora tenant",
        message: "rentora tenant api",
        status: "success",
    });
}
