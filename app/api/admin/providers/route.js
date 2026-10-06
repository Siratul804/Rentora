import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Provider from "@/lib/models/Provider";
import jwt from "jsonwebtoken";

function verifyAdmin(req) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "superadmin") throw new Error("Forbidden");

    return decoded.userId;
}

export async function GET(req) {
    try {
        await dbConnect();
        verifyAdmin(req);

        const pendingProviders = await Provider.find({ status: "pending" });
        return NextResponse.json(pendingProviders);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
