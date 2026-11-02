import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Tenant from "@/lib/models/Tenant";
import AuditLog from "@/lib/models/AuditLog";
import { verifyToken } from "@/lib/jwt";

async function verifyOwner(req) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);
    if (!decoded) throw new Error("Unauthorized");
    if (decoded.role !== "owner") throw new Error("Forbidden");
    return decoded.userId || decoded.id;
}

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const ownerId = await verifyOwner(req);
        const { propertyId, unitId } = await params;
        const body = await req.json();
        const { name, contactInfo, leaseStart, leaseEnd, documents, notes, paymentDetails } = body;

        if (!name || !contactInfo || !leaseStart || !leaseEnd) {
            return NextResponse.json({ error: "Name, contact info, and lease dates are required." }, { status: 400 });
        }

        const tenant = await Tenant.create({
            name,
            contactInfo,
            leaseStart,
            leaseEnd,
            documents,
            notes,
            paymentDetails,
            unitId,
            propertyId,
            ownerId,
        });

        await AuditLog.create({
            action: "add-tenant",
            tenantId: tenant._id,
            unitId,
            propertyId,
            ownerId,
            timestamp: new Date(),
        });

        return NextResponse.json({ message: "Tenant added successfully", tenant });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
