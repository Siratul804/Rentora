import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { Invoice } from "@/lib/models/Invoice";
import { ROLES } from "@/lib/auth";
import { isDemoPaymentMode } from "@/lib/paymentMode";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, phone } = body;

    // Basic validations
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

    // Prevent registering with admin email
    if (adminEmail && cleanEmail === adminEmail) {
      return NextResponse.json(
        { error: "This email is reserved for system administration" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    let owner = await User.findOne({ email: cleanEmail });
    if (owner && owner.status === "Paid") {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // If account exists but unpaid, update credentials; otherwise create new pending owner
    if (owner) {
      owner.name = name.trim();
      owner.passwordHash = passwordHash;
      owner.phone = phone ? phone.trim() : owner.phone;
      owner.status = "Pending";
      await owner.save();
    } else {
      owner = await User.create({
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: ROLES.OWNER,
        phone: phone ? phone.trim() : "",
        status: "Pending",
      });
    }

    // Create or update Pending registration Invoice
    const tran_id = `RENTORA_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
    await Invoice.findOneAndUpdate(
      { ownerId: owner._id, type: "owner_registration" },
      {
        ownerId: owner._id,
        type: "owner_registration",
        rentAmount: 499,
        status: "Pending",
        tranId: tran_id,
        dueDate: new Date(),
      },
      { upsert: true, new: true }
    );

    if (isDemoPaymentMode()) {
      return NextResponse.json({
        success: true,
        requiresPayment: true,
        gatewayUrl: `/payment/demo?tran_id=${encodeURIComponent(tran_id)}`,
        message: "Registration initiated. Continue to the demo checkout.",
      });
    }

    // Initiate SSLCOMMERZ ৳499 Payment Session
    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const appUrl = (
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000"
    ).replace(/\/$/, "");

    if (!storeId || !storePassword) {
      return NextResponse.json(
        { error: "SSLCOMMERZ credentials are not configured on the server." },
        { status: 500 }
      );
    }

    const formData = new FormData();
    formData.append("store_id", storeId);
    formData.append("store_passwd", storePassword);
    formData.append("total_amount", "499.00");
    formData.append("currency", "BDT");
    formData.append("tran_id", tran_id);
    formData.append("success_url", `${appUrl}/api/payment/success`);
    formData.append("fail_url", `${appUrl}/api/payment/fail`);
    formData.append("cancel_url", `${appUrl}/api/payment/cancel`);
    formData.append("ipn_url", `${appUrl}/api/payment/ipn`);

    formData.append("value_a", cleanEmail);
    formData.append("value_b", "owner_registration");
    formData.append("value_c", tran_id);

    formData.append("cus_name", owner.name);
    formData.append("cus_email", cleanEmail);
    formData.append("cus_add1", "Dhaka");
    formData.append("cus_city", "Dhaka");
    formData.append("cus_postcode", "1205");
    formData.append("cus_country", "Bangladesh");
    formData.append("cus_phone", owner.phone || "01711111111");

    formData.append("shipping_method", "NO");
    formData.append("num_of_item", "1");
    formData.append("product_name", "Rentora Property Owner Activation");
    formData.append("product_category", "Subscription");
    formData.append("product_profile", "general");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const sslRes = await fetch("https://sandbox.sslcommerz.com/gwprocess/v4/api.php", {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!sslRes.ok) {
      return NextResponse.json(
        { error: `SSLCOMMERZ gateway error (${sslRes.status})` },
        { status: 502 }
      );
    }

    const data = await sslRes.json();

    if (data?.status === "SUCCESS" && data?.GatewayPageURL) {
      // Access is NOT granted yet. User must complete payment first.
      return NextResponse.json(
        {
          success: true,
          requiresPayment: true,
          gatewayUrl: data.GatewayPageURL,
          message: "Registration initiated. Redirecting to SSLCOMMERZ checkout for ৳499 activation.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: data?.failedreason || "Failed to initiate payment session with SSLCOMMERZ" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
