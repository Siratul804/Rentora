import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "@/lib/session";
import User from "@/lib/models/User";
import { Invoice } from "@/lib/models/Invoice";
import { AuditLog } from "@/lib/models/AuditLog";
import { createInvoicePdf } from "@/lib/invoicePdf";

export async function GET(_request, context) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Please sign in to download invoices." }, { status: 401 });
    }
    if (!["owner", "tenant"].includes(session.role)) {
      return NextResponse.json({ error: "Only owners and tenants can download invoices." }, { status: 403 });
    }

    const { invoiceId } = await context.params;
    if (!mongoose.isValidObjectId(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID." }, { status: 400 });
    }

    await dbConnect();
    let user = mongoose.isValidObjectId(session.id)
      ? await User.findOne({ _id: session.id, role: session.role, isActive: { $ne: false } }).select("_id")
      : null;
    if (!user && session.email) {
      user = await User.findOne({
        email: String(session.email).toLowerCase(),
        role: session.role,
        isActive: { $ne: false },
      }).select("_id");
    }
    if (!user) {
      return NextResponse.json({ error: "Account not found. Please sign in again." }, { status: 401 });
    }

    const ownerId = session.role === "owner" ? user._id : undefined;
    const tenantId = session.role === "tenant" ? user._id : undefined;
    const accessFilter = ownerId ? { ownerId } : { tenantId };
    const invoice = await Invoice.findOne({ _id: invoiceId, ...accessFilter }).select("+pdfData").lean();
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    let pdfData = invoice.pdfData;
    let generated = false;
    if (!pdfData?.length) {
      const generatedPdf = createInvoicePdf(invoice);
      const stored = await Invoice.updateOne(
        {
          _id: invoice._id,
          $or: [{ pdfData: { $exists: false } }, { pdfData: null }],
        },
        { $set: { pdfData: generatedPdf, pdfGeneratedAt: new Date() } }
      );
      if (stored.modifiedCount) {
        pdfData = generatedPdf;
        generated = true;
      } else {
        const savedInvoice = await Invoice.findById(invoice._id).select("+pdfData").lean();
        pdfData = savedInvoice?.pdfData;
      }
    }
    if (!pdfData?.length) {
      console.error("Invoice PDF was not available after generation:", invoice._id.toString());
      return NextResponse.json({ error: "Invoice PDF was not available after generation." }, { status: 500 });
    }

    if (generated) {
      await AuditLog.create({
        action: "generate-invoice-pdf",
        invoiceId: invoice._id,
        tenantId: invoice.tenantId,
        propertyId: invoice.propertyId,
        ownerId: invoice.ownerId,
        actorId: user._id,
        actorRole: session.role,
        status: "generated",
      });
    }
    await AuditLog.create({
      action: "download-invoice-pdf",
      invoiceId: invoice._id,
      tenantId: invoice.tenantId,
      propertyId: invoice.propertyId,
      ownerId: invoice.ownerId,
      actorId: user._id,
      actorRole: session.role,
      status: "downloaded",
    });

    const pdf = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData);
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rent-invoice-${invoice._id}.pdf"`,
        "Content-Length": String(pdf.length),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Download invoice PDF error:", error);
    return NextResponse.json({ error: "Failed to generate or download the invoice PDF." }, { status: 500 });
  }
}
