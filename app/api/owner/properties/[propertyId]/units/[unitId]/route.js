import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Unit from "@/lib/models/Unit";
import AuditLog from "@/lib/models/AuditLog";
import jwt from "jsonwebtoken";

function verifyOwner(req) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "owner") throw new Error("Forbidden");
    return decoded.userId;
}

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const ownerId = verifyOwner(req);

        const body = await req.json();
        const { unitNumber, size, availability, tenantId } = body;

        if (!unitNumber || !size) {
            return NextResponse.json({ error: "Unit number and size are required" }, { status: 400 });
        }

        const unit = await Unit.findById(params.unitId);
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
        const ownerId = verifyOwner(req);

        const unit = await Unit.findById(params.unitId);
        if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

        await unit.deleteOne();

        await AuditLog.create({
            action: "delete-unit",
            unitId: params.unitId,
            propertyId: unit.propertyId,
            ownerId,
            timestamp: new Date(),
        });

        return NextResponse.json({ message: "Unit deleted successfully" });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
