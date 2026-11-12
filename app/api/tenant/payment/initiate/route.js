import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { Invoice } from "@/lib/models/Invoice";
import User from "@/lib/models/User";
import { getServerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== "tenant") {
      return NextResponse.json({ error: "Please sign in as a tenant to pay an invoice." }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    const invoiceId = body?.invoiceId;
    if (!mongoose.isValidObjectId(invoiceId)) {
      return NextResponse.json({ error: "A valid invoice is required." }, { status: 400 });
    }

    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
    if (!storeId || !storePassword) {
      return NextResponse.json({ error: "Online payments are not configured. Please contact your property owner." }, { status: 503 });
    }

    await dbConnect();
    const tenantQuery = { role: "tenant", isActive: { $ne: false } };
    if (mongoose.isValidObjectId(session.id)) tenantQuery._id = session.id;
    else if (session.email) tenantQuery.email = String(session.email).toLowerCase();
    else return NextResponse.json({ error: "Tenant account not found. Please sign in again." }, { status: 401 });
    const tenant = await User.findOne(tenantQuery).select("_id name email phone");
    if (!tenant) return NextResponse.json({ error: "Tenant account not found. Please sign in again." }, { status: 401 });

    const invoice = await Invoice.findOne({ _id: invoiceId, tenantId: tenant._id, type: "rent" });
    if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    if (invoice.status === "Paid") return NextResponse.json({ error: "This invoice has already been paid." }, { status: 409 });
    if (!Number.isFinite(invoice.rentAmount) || invoice.rentAmount <= 0) {
      return NextResponse.json({ error: "This invoice does not have a payable amount." }, { status: 400 });
    }

    const transactionId = `TENANT_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
    invoice.tranId = transactionId;
    await invoice.save();

    const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
    const formData = new FormData();
    formData.append("store_id", storeId);
    formData.append("store_passwd", storePassword);
    formData.append("total_amount", Number(invoice.rentAmount).toFixed(2));
    formData.append("currency", "BDT");
    formData.append("tran_id", transactionId);
    formData.append("success_url", `${appUrl}/api/tenant/payment/success`);
    formData.append("fail_url", `${appUrl}/api/tenant/payment/fail`);
    formData.append("cancel_url", `${appUrl}/api/tenant/payment/fail?cancelled=true`);
    formData.append("value_a", tenant._id.toString());
    formData.append("value_b", "tenant_rent");
    formData.append("value_c", invoice._id.toString());
    formData.append("cus_name", tenant.name);
    formData.append("cus_email", tenant.email);
    formData.append("cus_add1", invoice.propertyName || "Rentora property");
    formData.append("cus_city", "Dhaka");
    formData.append("cus_postcode", "1205");
    formData.append("cus_country", "Bangladesh");
    formData.append("cus_phone", tenant.phone || "01711111111");
    formData.append("shipping_method", "NO");
    formData.append("num_of_item", "1");
    formData.append("product_name", `Rent ${invoice.billingPeriod || ""}`.trim());
    formData.append("product_category", "Rent");
    formData.append("product_profile", "general");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      response = await fetch("https://sandbox.sslcommerz.com/gwprocess/v4/api.php", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      return NextResponse.json({ error: `Payment gateway responded with HTTP ${response.status}.` }, { status: 502 });
    }
    const gateway = await response.json();
    if (gateway?.status !== "SUCCESS" || !gateway?.GatewayPageURL) {
      return NextResponse.json({ error: gateway?.failedreason || "Could not start the payment gateway session." }, { status: 502 });
    }

    return NextResponse.json({ success: true, gatewayUrl: gateway.GatewayPageURL });
  } catch (error) {
    console.error("Initiate tenant payment error:", error);
    return NextResponse.json({
      error: error.name === "AbortError" ? "The payment gateway request timed out." : "Could not start your payment.",
    }, { status: 500 });
  }
}
