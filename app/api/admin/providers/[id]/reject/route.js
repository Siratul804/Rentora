import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Provider from "@/lib/models/Provider";
import AuditLog from "@/lib/models/AuditLog";
import { verifyToken } from "@/lib/jwt";

async function verifyAdmin(req) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);
    if (!decoded) throw new Error("Unauthorized");
    if (decoded.role !== "superadmin" && decoded.role !== "admin") throw new Error("Forbidden");

    return decoded.userId || decoded.id;
}

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const adminId = await verifyAdmin(req);
        const { id } = await params;

        const { reason } = await req.json();

        const provider = await Provider.findById(id);
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

        return NextResponse.json({ message: "Provider rejected" });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
