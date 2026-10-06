import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Provider from "@/lib/models/Provider";
import AuditLog from "@/lib/models/AuditLog";
import jwt from "jsonwebtoken";

function verifyAdmin(req) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "superadmin") throw new Error("Forbidden");

    return decoded.userId;
}

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const adminId = verifyAdmin(req);

        const { reason } = await req.json();
        const provider = await Provider.findById(params.id);
        if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

        provider.status = "rejected";
        provider.rejectionReason = reason;
        await provider.save();

        await AuditLog.create({
            action: "reject",
            providerId: provider._id,
            adminId,
            reason,
            timestamp: new Date(),
        });

        return NextResponse.json({ message: "Provider rejected", reason });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
