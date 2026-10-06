import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Tenant from "@/lib/models/Tenant";
import Owner from "@/lib/models/Owner";
import Provider from "@/lib/models/Provider";
import Property from "@/lib/models/Property";
import Payment from "@/lib/models/Payment";
import MaintenanceRequest from "@/lib/models/MaintenanceRequest";
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

        const tenants = await Tenant.countDocuments({ status: "active" });
        const owners = await Owner.countDocuments({ status: "active" });
        const providers = await Provider.countDocuments({ status: "approved" });
        const properties = await Property.countDocuments({});
        const pendingRegistrations = await Provider.countDocuments({ status: "pending" });
        const payments = await Payment.countDocuments({ status: "completed" });
        const maintenanceRequests = await MaintenanceRequest.countDocuments({});

        return NextResponse.json({
            tenants,
            owners,
            providers,
            properties,
            pendingRegistrations,
            payments,
            maintenanceRequests,
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
