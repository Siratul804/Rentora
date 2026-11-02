import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { AuditLog } from "@/lib/models/AuditLog";
import { Invoice } from "@/lib/models/Invoice";
import User from "@/lib/models/User";
import { getServerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const form = await request.formData();
    const validationId = String(form.get("val_id") || "");
    const transactionId = String(form.get("tran_id") || "");
    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
    if (!validationId || !transactionId || !storeId || !storePassword) {
      return NextResponse.redirect(new URL("/tenant/payments?payment=failed", request.url), 303);
    }

    const validationUrl = `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(validationId)}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(storePassword)}&format=json`;
    const validationResponse = await fetch(validationUrl);
    if (!validationResponse.ok) throw new Error("Payment gateway validation failed.");
    const validation = await validationResponse.json();
    const validatedAmount = Number(validation.amount ?? validation.currency_amount ?? validation.total_amount);
    const tenantId = String(validation.value_a || "");
    const invoiceId = String(validation.value_c || "");
    const isValid =
      ["VALID", "VALIDATED"].includes(validation.status) &&
      validation.tran_id === transactionId &&
      validation.value_b === "tenant_rent" &&
      mongoose.isValidObjectId(tenantId) &&
      mongoose.isValidObjectId(invoiceId) &&
      Number.isFinite(validatedAmount);
    if (!isValid) {
      return NextResponse.redirect(new URL("/tenant/payments?payment=failed", request.url), 303);
    }

    await dbConnect();
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      tenantId,
      type: "rent",
      tranId: transactionId,
    });
    if (!invoice || Math.abs(Number(invoice.rentAmount) - validatedAmount) >= 0.01) {
      return NextResponse.redirect(new URL("/tenant/payments?payment=failed", request.url), 303);
    }

    if (invoice.status !== "Paid") {
      invoice.status = "Paid";
      invoice.valId = validationId;
      await invoice.save();
      await User.updateOne(
        { _id: invoice.tenantId, role: "tenant" },
        { $set: { rentStatus: "Paid" } }
      );
      const session = await getServerSession();
      await AuditLog.create({
        action: "tenant-rent-payment-confirmed",
        invoiceId: invoice._id,
        tenantId: invoice.tenantId,
        ownerId: invoice.ownerId,
        ...(session?.role === "tenant" && mongoose.isValidObjectId(session.id) ? { actorId: session.id } : {}),
        actorRole: "tenant",
        status: "Paid",
      });
    }

    return NextResponse.redirect(new URL("/tenant/payments?payment=success", request.url), 303);
  } catch (error) {
    console.error("Tenant payment callback error:", error);
    return NextResponse.redirect(new URL("/tenant/payments?payment=failed", request.url), 303);
  }
}

export async function GET(request) {
  return NextResponse.redirect(new URL("/tenant/payments", request.url), 303);
}
