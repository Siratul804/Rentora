import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Invoice } from "@/lib/models/Invoice";
import AuditLog from "@/lib/models/AuditLog";
import MaintenanceRequest from "@/lib/models/MaintenanceRequest";
import Property from "@/lib/models/Property";
import User from "@/lib/models/User";
import { getServerSession } from "@/lib/session";
import { createReportPdf } from "@/lib/reportPdf";

export const dynamic = "force-dynamic";

async function getReportData() {
  await dbConnect();
  const [owners, tenants, properties, units, paidOwnerInvoices, maintenance, recentAudits] = await Promise.all([
    User.countDocuments({ role: "owner" }),
    User.countDocuments({ role: "tenant" }),
    Property.countDocuments({}),
    Property.aggregate([{ $group: { _id: null, total: { $sum: "$totalUnits" } } }]),
    Invoice.find({ type: "owner_registration", status: "Paid" }).select("rentAmount").lean(),
    MaintenanceRequest.find({}).select("status rating assignedTo").lean(),
    AuditLog.countDocuments({ timestamp: { $gte: new Date(Date.now() - 30 * 86400000) } }),
  ]);
  const completedRequests = maintenance.filter((request) => ["Done", "Resolved", "Closed"].includes(request.status));
  const ratedRequests = completedRequests.filter((request) => Number.isFinite(request.rating));
  return {
    generatedAt: new Date().toISOString(),
    owners,
    tenants,
    properties,
    units: units[0]?.total || 0,
    paidOwnerAccounts: paidOwnerInvoices.length,
    ownerRegistrationRevenue: paidOwnerInvoices.reduce((total, invoice) => total + (Number(invoice.rentAmount) || 0), 0),
    maintenanceRequests: maintenance.length,
    completedRequests: completedRequests.length,
    pendingRequests: maintenance.filter((request) => !["Done", "Resolved", "Closed"].includes(request.status)).length,
    assignedRequests: maintenance.filter((request) =>
      ["Assigned", "Dispatched", "In Progress", "Done", "Resolved", "Closed"].includes(request.status) ||
      (request.assignedTo && request.assignedTo !== "Unassigned")
    ).length,
    averageRating: ratedRequests.length
      ? ratedRequests.reduce((total, request) => total + request.rating, 0) / ratedRequests.length
      : null,
    auditEventsLast30Days: recentAudits,
  };
}

async function authorize() {
  const session = await getServerSession();
  return session?.role === "admin";
}

export async function GET() {
  try {
    if (!(await authorize())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    return NextResponse.json({ report: await getReportData() });
  } catch (error) {
    console.error("Fetch admin reports error:", error);
    return NextResponse.json({ error: "Failed to load platform reports." }, { status: 500 });
  }
}

export async function POST() {
  try {
    if (!(await authorize())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const report = await getReportData();
    return new Response(createReportPdf(report), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="rentora-platform-report.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Download admin report error:", error);
    return NextResponse.json({ error: "Failed to generate the platform report PDF." }, { status: 500 });
  }
}
