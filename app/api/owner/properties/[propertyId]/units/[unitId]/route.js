import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Unit from "@/lib/models/Unit";
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

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const ownerId = await verifyOwner(req);
        const { unitId } = await params;

        const body = await req.json();
        const { unitNumber, size, availability, tenantId } = body;

        if (!unitNumber || !size) {
            return NextResponse.json({ error: "Unit number and size are required" }, { status: 400 });
        }

        const unit = await Unit.findById(unitId);
        if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

        unit.unitNumber = unitNumber;
        unit.size = size;
        unit.availability = availability;
        unit.tenantId = tenantId;
        await unit.save();

        await AuditLog.create({
            action: "edit-unit",
            unitId: unit._id,
            propertyId: unit.propertyId,
            ownerId,
            timestamp: new Date(),
        });

        return NextResponse.json({ message: "Unit updated successfully", unit });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        const ownerId = await verifyOwner(req);
        const { unitId } = await params;

        const unit = await Unit.findById(unitId);
        if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

        await unit.deleteOne();

        await AuditLog.create({
            action: "delete-unit",
            unitId,
            propertyId: unit.propertyId,
            ownerId,
            timestamp: new Date(),
        });

        return NextResponse.json({ message: "Unit deleted successfully" });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
