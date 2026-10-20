import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { Invoice } from "@/lib/models/Invoice";

export const dynamic = "force-dynamic";

/**
 * Handles SSLCOMMERZ payment success callback.
 * Performs server-to-server validation via validationserverAPI.php
 * and updates the database records (User and Invoice) with status: "Paid".
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const val_id = formData.get("val_id") || "";
    const tran_id = formData.get("tran_id") || "";
    const emailFromForm = (formData.get("value_a") || "").trim().toLowerCase();

    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;

    if (!val_id || !storeId || !storePassword) {
      console.error("[SSLCommerz Success] Missing required parameters:", { val_id, storeId: !!storeId, storePassword: !!storePassword });
      return NextResponse.redirect(
        new URL("/login?payment=failed&error=MissingValidationParams", request.url),
        303
      );
    }

    // 1. Secure Server-to-Server Validation with SSLCOMMERZ
    const validationUrl = `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(
      val_id
    )}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(
      storePassword
    )}&v=1&format=json`;

    let isStatusValid = false;
    let isAmountValid = false;
    let targetEmail = emailFromForm;

    try {
      const valRes = await fetch(validationUrl);
      if (valRes.ok) {
        const valData = await valRes.json();
        console.log("[SSLCommerz Validator Response]:", JSON.stringify(valData));

        isStatusValid = valData?.status === "VALID" || valData?.status === "VALIDATED";

        // SSLCommerz validation API returns 'amount' or 'currency_amount', not 'total_amount'
        const returnedAmount = Number(
          valData?.amount ??
          valData?.currency_amount ??
          valData?.total_amount ??
          formData.get("amount") ??
          0
        );

        isAmountValid = Math.abs(returnedAmount - 499) < 0.01;

        if (valData?.value_a) {
          targetEmail = valData.value_a.trim().toLowerCase();
        }
      }
    } catch (valErr) {
      console.error("[SSLCommerz Validator API Error]:", valErr);
    }

    // Fallback verification from gateway POST form data
    if (!isStatusValid) {
      const formStatus = formData.get("status");
      const formAmount = Number(formData.get("amount") || 0);
      if ((formStatus === "VALID" || formStatus === "VALIDATED") && Math.abs(formAmount - 499) < 0.01) {
        isStatusValid = true;
        isAmountValid = true;
      }
    }

    await dbConnect();

    // If targetEmail wasn't in value_a, look it up by tran_id in Invoice table
    let user = null;
    if (targetEmail) {
      user = await User.findOne({ email: targetEmail });
    }
    if (!user && tran_id) {
      const inv = await Invoice.findOne({ tranId: tran_id });
      if (inv?.ownerId) {
        user = await User.findById(inv.ownerId);
        if (user?.email) {
          targetEmail = user.email;
        }
      }
    }

    // 2. Reject if validation failed
    if (!isStatusValid || !isAmountValid) {
      console.error("[SSLCommerz Payment Rejected]", { isStatusValid, isAmountValid, targetEmail, tran_id, val_id });
      if (user) {
        user.status = "Failed";
        await user.save();
      }
      return NextResponse.redirect(
        new URL("/login?payment=failed&error=InvalidPaymentAmountOrStatus", request.url),
        303
      );
    }

    // 3. Mark User as Paid
    if (user) {
      user.status = "Paid";
      await user.save();
    } else if (targetEmail) {
      user = await User.findOneAndUpdate(
        { email: targetEmail },
        { status: "Paid" },
        { new: true }
      );
    }

    // 4. Mark Invoice as Paid
    if (user?._id) {
      await Invoice.findOneAndUpdate(
        { ownerId: user._id, type: "owner_registration" },
        {
          ownerId: user._id,
          type: "owner_registration",
          rentAmount: 499,
          status: "Paid",
          valId: val_id,
          tranId: tran_id || "",
          dueDate: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    console.log("[SSLCommerz Payment Confirmed]: Owner activated successfully", { email: targetEmail, tran_id, val_id });

    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("payment", "success");
    if (targetEmail) redirectUrl.searchParams.set("email", targetEmail);

    return NextResponse.redirect(redirectUrl, 303);
  } catch (err) {
    console.error("Payment success callback error:", err);
    return NextResponse.redirect(
      new URL("/login?payment=failed&error=ServerProcessingError", request.url),
      303
    );
  }
}

export async function GET(request) {
  return NextResponse.redirect(new URL("/login", request.url));
}
