import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      requests: [
        {
          ticketNumber: "MNT-2026-0042",
          category: "Plumbing",
          priority: "HIGH",
          status: "OPEN",
          description: "Kitchen sink pipe leakage",
        },
      ],
    },
    { status: 200 }
  );
}

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: "Empty request body" }, { status: 400 });
    }

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ success: false, message: "Empty body is not allowed" }, { status: 400 });
    }

    const { description, priority } = body;

    if (!description || typeof description !== "string" || description.trim() === "") {
      return NextResponse.json({ success: false, message: "Description is required" }, { status: 400 });
    }

    if (!priority || typeof priority !== "string" || priority.trim() === "") {
      return NextResponse.json({ success: false, message: "Priority is required" }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Maintenance request created successfully",
        data: {
          ticketNumber: `MNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          ...body,
          status: "OPEN",
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}