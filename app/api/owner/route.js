import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        name: "rentora owner",
        message: "rentora owner api",
        status: "success",
    });
}
