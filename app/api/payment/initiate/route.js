import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Initiates a Sandbox transaction with SSLCOMMERZ.
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

    // 1. Guard against missing credentials
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

    // 2. Generate unique Transaction ID (max 30 alphanumeric chars for SSLCOMMERZ)
    const tran_id = `RENTORA_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    // 3. Prepare parameters via FormData as required by SSLCOMMERZ v4
    const formData = new FormData();
    formData.append("store_id", storeId);
    formData.append("store_passwd", storePassword);
    formData.append("total_amount", "180.00");
    formData.append("currency", "BDT");
    formData.append("tran_id", tran_id);
    formData.append("success_url", `${appUrl}/api/payment/success`);
    formData.append("fail_url", `${appUrl}/api/payment/fail`);
    formData.append("cancel_url", `${appUrl}/api/payment/cancel`);
    formData.append("ipn_url", `${appUrl}/api/payment/ipn`);

    // Customer Information
    formData.append("cus_name", "Academic Test Student");
    formData.append("cus_email", "student.test@rentora.com");
    formData.append("cus_add1", "Green Road, Farmgate");
    formData.append("cus_add2", "Dhaka 1205");
    formData.append("cus_city", "Dhaka");
    formData.append("cus_state", "Dhaka");
    formData.append("cus_postcode", "1205");
    formData.append("cus_country", "Bangladesh");
    formData.append("cus_phone", "01711111111");
    formData.append("cus_fax", "01711111111");

    // Shipping & Product Information
    formData.append("shipping_method", "NO");
    formData.append("num_of_item", "1");
    formData.append("product_name", "Rentora Demo Service");
    formData.append("product_category", "Service");
    formData.append("product_profile", "general");

    // 4. Send POST request to official Sandbox endpoint with timeout
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

    // 5. Handle Gateway Response
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
    if (err.name === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          error: "SSLCOMMERZ sandbox gateway request timed out after 15 seconds.",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "An unexpected error occurred while communicating with SSLCOMMERZ.",
      },
      { status: 500 }
    );
  }
}
