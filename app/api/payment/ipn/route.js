import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { Invoice } from "@/lib/models/Invoice";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const val_id = formData.get("val_id") || "";
    const tran_id = formData.get("tran_id") || "";
    const email = (formData.get("value_a") || "").trim().toLowerCase();

    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;

    if (!val_id || !storeId || !storePassword) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    // Server-to-server validation
    const validationUrl = `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(
      val_id
    )}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(
      storePassword
    )}&format=json`;

    const valRes = await fetch(validationUrl);
    if (!valRes.ok) {
      return NextResponse.json({ success: false, error: "Validation server error" }, { status: 502 });
    }

    const valData = await valRes.json();
    const isStatusValid = valData?.status === "VALID" || valData?.status === "VALIDATED";
    const returnedAmount = Number(
      valData?.amount ??
      valData?.currency_amount ??
      valData?.total_amount ??
      formData.get("amount") ??
      0
    );
    const isAmountValid = Math.abs(returnedAmount - 499) < 0.01;
    const targetEmail = (valData?.value_a || email).trim().toLowerCase();

    if (!isStatusValid || !isAmountValid) {
      return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOneAndUpdate(
      { email: targetEmail },
      { status: "Paid" },
      { new: true }
    );

    if (user?._id) {
      await Invoice.findOneAndUpdate(
        { ownerId: user._id, type: "owner_registration" },
        {
          ownerId: user._id,
          type: "owner_registration",
          rentAmount: 499,
          status: "Paid",
          valId: val_id,
          tranId: tran_id || valData?.tran_id || "",
          dueDate: new Date(),
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true, message: "IPN verified and status updated to Paid" });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
