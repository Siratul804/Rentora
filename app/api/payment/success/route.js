import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * SSLCOMMERZ sends an HTTP POST request with form-data to the success_url
 * when the transaction is completed on the hosted checkout page.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const tran_id = formData.get("tran_id") || "";
    const val_id = formData.get("val_id") || "";
    const amount = formData.get("amount") || "180.00";
    const card_type = formData.get("card_type") || "";

    const redirectUrl = new URL("/payment-test", request.url);
    redirectUrl.searchParams.set("status", "success");
    if (tran_id) redirectUrl.searchParams.set("tran_id", tran_id);
    if (val_id) redirectUrl.searchParams.set("val_id", val_id);
    if (amount) redirectUrl.searchParams.set("amount", amount);
    if (card_type) redirectUrl.searchParams.set("card_type", card_type);

    // Use 303 (See Other) so browser converts gateway POST to GET on test page
    return NextResponse.redirect(redirectUrl, 303);
  } catch {
    return NextResponse.redirect(new URL("/payment-test?status=error", request.url), 303);
  }
}

export async function GET(request) {
  const redirectUrl = new URL("/payment-test", request.url);
  redirectUrl.searchParams.set("status", "success");
  return NextResponse.redirect(redirectUrl);
}
