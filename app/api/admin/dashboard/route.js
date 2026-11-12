import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Tenant from "@/lib/models/Tenant";
import Owner from "@/lib/models/Owner";
import Provider from "@/lib/models/Provider";
import Property from "@/lib/models/Property";
import Payment from "@/lib/models/Payment";
import MaintenanceRequest from "@/lib/models/MaintenanceRequest";
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
