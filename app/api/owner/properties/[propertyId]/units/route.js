import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Unit from "@/lib/models/Unit";
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

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const ownerId = await verifyOwner(req);
        const { propertyId } = await params;

        const units = await Unit.find({ propertyId, ownerId });
        return NextResponse.json(units);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
