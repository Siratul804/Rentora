import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Unit from "@/lib/models/Unit";
import jwt from "jsonwebtoken";

function verifyOwner(req) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "owner") throw new Error("Forbidden");
    return decoded.userId;
}

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const ownerId = verifyOwner(req);

        const units = await Unit.find({ propertyId: params.propertyId, ownerId });
        return NextResponse.json(units);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
