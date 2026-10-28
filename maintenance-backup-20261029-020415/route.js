import { NextResponse } from "next/server";


export async function GET(req) {
  try {

    const tenantId = req.headers.get("x-tenant-id") || "tenant-demo-123";


    return NextResponse.json({ success: true, requests: [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      title,
      category,
      description,
      priority,
      propertyId,
      propertyName,
      unitId,
      unitNumber,
      permissionToEnter,
      notes,
      attachments = [],
      tenantName,
      tenantEmail,
      tenantPhone,
    } = body;

    if (!description?.trim() || !priority) {
      return NextResponse.json(
        { success: false, message: "Description and priority level are required." },
        { status: 400 }
      );
    }

    const ticketNumber = `MNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;


    const newRequest = {
      id: "req-" + Date.now(),
      ticketNumber,
      title: title || `${category} issue in ${unitNumber || "Unit"}`,
      category: category || "General",
      description: description.trim(),
      priority,
      status: "OPEN",
      propertyId: propertyId || "prop-1",
      propertyName: propertyName || "Green Horizon Residency",
      unitId: unitId || "unit-1",
      unitNumber: unitNumber || "Unit 4B",
      permissionToEnter: Boolean(permissionToEnter),
      notes: notes?.trim() || "",
      attachments: attachments,
      tenantName: tenantName || "Current Tenant",
      tenantEmail: tenantEmail || "tenant@rentora.com",
      tenantPhone: tenantPhone || "+880 1711-000000",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditLogs: [
        {
          id: "log-" + Date.now(),
          action: "SUBMITTED",
          performedBy: tenantName || "Tenant",
          role: "TENANT",
          details: `Maintenance request created with priority ${priority}`,
          createdAt: new Date().toISOString(),
        },
      ],
    };



    return NextResponse.json(
      {
        success: true,
        message: `Maintenance request #${ticketNumber} submitted successfully! Property team has been notified.`,
        request: newRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit request" },
      { status: 500 }
    );
  }
}