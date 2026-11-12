import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { Invoice } from "@/lib/models/Invoice";

export const dynamic = "force-dynamic";

/**
 * Initiates a Sandbox transaction with SSLCOMMERZ for ৳499 Owner Payment.
 * Endpoint: POST /api/payment/initiate
 */
export async function POST(request) {
  try {
    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const appUrl = (
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000"
    ).replace(/\/$/, "");

    if (!storeId || !storePassword) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing SSLCOMMERZ credentials in .env.local (SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD are required)",
        },
        { status: 500 }
      );
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const email = (body.email || "").trim().toLowerCase();
    const name = (body.name || "Property Owner").trim();
    const phone = (body.phone || "01711111111").trim();
    const totalAmount = "499.00"; // Enforce ৳499 for owner activation

    // Unique Transaction ID (max 30 alphanumeric chars)
    const tran_id = `RENTORA_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    // Demo checkout only applies to owner activation, not the standalone gateway test page.
    if (email) {
      await dbConnect();
      const existingUser = await User.findOne({ email, role: "owner" });
      if (!existingUser) {
        return NextResponse.json(
          { success: false, error: "No owner account was found for this payment." },
          { status: 404 }
        );
      }

      if (existingUser.status === "Paid") {
        return NextResponse.json(
          { success: false, error: "This owner account has already been activated." },
          { status: 409 }
        );
      }

      await Invoice.findOneAndUpdate(
        { ownerId: existingUser._id, type: "owner_registration" },
        {
          ownerId: existingUser._id,
          type: "owner_registration",
          rentAmount: 499,
          status: "Pending",
          tranId: tran_id,
          valId: "",
          dueDate: new Date(),
        },
        { upsert: true, new: true }
      );

    }

    // Prepare parameters via FormData as required by SSLCOMMERZ v4
    const formData = new FormData();
    formData.append("store_id", storeId);
    formData.append("store_passwd", storePassword);
    formData.append("total_amount", totalAmount);
    formData.append("currency", "BDT");
    formData.append("tran_id", tran_id);
    formData.append("success_url", `${appUrl}/api/payment/success`);
    formData.append("fail_url", `${appUrl}/api/payment/fail`);
    formData.append("cancel_url", `${appUrl}/api/payment/cancel`);
    formData.append("ipn_url", `${appUrl}/api/payment/ipn`);

    // Pass owner identification in custom parameters (persisted and returned by SSLCommerz)
    formData.append("value_a", email);
    formData.append("value_b", "owner_registration");
    formData.append("value_c", tran_id);

    // Customer Information
    formData.append("cus_name", name);
    formData.append("cus_email", email || "owner@rentora.com");
    formData.append("cus_add1", "Dhaka");
    formData.append("cus_city", "Dhaka");
    formData.append("cus_postcode", "1205");
    formData.append("cus_country", "Bangladesh");
    formData.append("cus_phone", phone);

    // Shipment & Product Info
    formData.append("shipping_method", "NO");
    formData.append("num_of_item", "1");
    formData.append("product_name", "Rentora Owner Activation (৳499)");
    formData.append("product_category", "Subscription");
    formData.append("product_profile", "general");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const sslRes = await fetch(
      "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
      {
        method: "POST",
        body: formData,
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!sslRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `SSLCOMMERZ sandbox gateway responded with HTTP status ${sslRes.status}`,
        },
        { status: 502 }
      );
    }

    const data = await sslRes.json();

    if (data?.status === "SUCCESS" && data?.GatewayPageURL) {
      return NextResponse.json({
        success: true,
        gatewayUrl: data.GatewayPageURL,
        tran_id,
        sessionkey: data.sessionkey,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          data?.failedreason ||
          "SSLCOMMERZ session initialization failed. Verify store credentials.",
        gatewayStatus: data?.status || "FAILED",
      },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:
          err.name === "AbortError"
            ? "SSLCOMMERZ gateway request timed out after 15 seconds"
            : err.message || "Failed to communicate with SSLCOMMERZ gateway",
      },
      { status: 500 }
    );
  }
}
