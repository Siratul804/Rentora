import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * IPN (Instant Payment Notification) listener placeholder.
 *
 * NOTE FOR ACADEMIC PROJECT / PRODUCTION READINESS:
 * When SSLCOMMERZ processes transactions in production, it sends an IPN (Server-to-Server)
 * HTTP POST request here. In a production environment:
 * 1. Your domain must be publicly accessible (e.g., via ngrok or hosted URL).
 * 2. You extract `val_id` from formData and call SSLCOMMERZ Order Validation API:
 *    `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${store_id}&store_passwd=${store_passwd}&v=1&format=json`
 * 3. Verify status === "VALID" or "VALIDATED" and total_amount matches the order before updating DB.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const tran_id = formData.get("tran_id");
    const status = formData.get("status");
    const val_id = formData.get("val_id");

    console.log("[SSLCOMMERZ IPN Received]", { tran_id, status, val_id });

    return NextResponse.json({ success: true, message: "IPN received" });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
