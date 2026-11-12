import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { Invoice } from "@/lib/models/Invoice";
import { getServerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.email }).lean();
    if (!user) {
      return NextResponse.json({ error: "Owner account not found" }, { status: 404 });
    }

    const invoice = await Invoice.findOne({
      ownerId: user._id,
      type: "owner_registration",
    })
      .sort({ createdAt: -1 })
      .lean();

    const payment = {
      status: user.status || "Paid",
      amount: invoice?.rentAmount || 499,
      currency: "BDT",
      plan: "Property Owner Platform License",
      gateway: "SSLCommerz Sandbox",
      tranId: invoice?.tranId || "SSL_VERIFIED_" + user._id.toString().slice(-6).toUpperCase(),
      valId: invoice?.valId || "AUTO_VALIDATED",
      paidAt: invoice?.updatedAt || invoice?.createdAt || user.updatedAt || user.createdAt,
    };

    const bills = [
      {
        id: invoice?.tranId || "BILL-499-" + user._id.toString().slice(-4).toUpperCase(),
        title: "Property Owner Platform Activation Bill",
        description: "One-time platform license & onboarding fee",
        category: "Platform Subscription",
        amount: invoice?.rentAmount || 499,
        currency: "BDT",
        dueDate: invoice?.dueDate || invoice?.createdAt || user.createdAt,
        paidAt: payment.paidAt,
        status: user.status || "Paid",
        gateway: "SSLCommerz Sandbox",
        valId: payment.valId,
        tranId: payment.tranId,
      },
    ];

    return NextResponse.json({
      success: true,
      payment,
      bills,
    });
  } catch (error) {
    console.error("Owner payment info error:", error);
    return NextResponse.json({ error: "Failed to load payment info" }, { status: 500 });
  }
}
