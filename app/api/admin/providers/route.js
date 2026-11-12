import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Provider from "@/lib/models/Provider";
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

export async function GET(req) {
    try {
        await dbConnect();
        await verifyAdmin(req);

        const pendingProviders = await Provider.find({ status: "pending" });
        return NextResponse.json(pendingProviders);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
