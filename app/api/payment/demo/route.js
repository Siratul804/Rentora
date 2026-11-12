import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { Invoice } from "@/lib/models/Invoice";
import { isDemoPaymentMode } from "@/lib/paymentMode";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!isDemoPaymentMode()) {
    return NextResponse.json({ error: "Demo checkout is disabled." }, { status: 404 });
  }

  try {
    const { tran_id: tranId } = await request.json();
    if (typeof tranId !== "string" || !tranId) {
      return NextResponse.json({ error: "A transaction ID is required." }, { status: 400 });
    }

    await dbConnect();
    const invoice = await Invoice.findOne({
      tranId,
      type: "owner_registration",
      rentAmount: 499,
    });
    if (!invoice || !invoice.ownerId) {
      return NextResponse.json({ error: "Demo payment transaction was not found." }, { status: 404 });
    }

    const owner = await User.findOne({ _id: invoice.ownerId, role: "owner" });
    if (!owner) {
      return NextResponse.json({ error: "The owner account for this transaction was not found." }, { status: 404 });
    }

    if (invoice.status !== "Paid") {
      if (invoice.status !== "Pending") {
        return NextResponse.json({ error: "This transaction is no longer payable." }, { status: 409 });
      }

      owner.status = "Paid";
      await owner.save();

      invoice.status = "Paid";
      invoice.valId = `DEMO_${tranId}`;
      await invoice.save();
    }

    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("payment", "success");
    redirectUrl.searchParams.set("email", owner.email);
    return NextResponse.json({ success: true, redirectUrl: redirectUrl.pathname + redirectUrl.search });
  } catch (error) {
    console.error("Demo payment completion error:", error);
    return NextResponse.json({ error: "Could not complete the demo payment." }, { status: 500 });
  }
}
