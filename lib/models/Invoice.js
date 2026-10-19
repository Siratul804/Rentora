import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema({
    leaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Lease" },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", default: null },
    tenantName: { type: String, required: true },
    propertyName: { type: String, default: "" },
    unit: { type: String, default: "" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    billingPeriod: { type: String, match: /^\d{4}-\d{2}$/ },
    rentAmount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    paymentInstructions: { type: String, default: "" },
    pdfData: { type: Buffer, default: undefined, select: false },
    pdfGeneratedAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },

    status: { type: String, enum: ["Pending", "Paid", "Overdue"], default: "Pending" },
}, { timestamps: true });

InvoiceSchema.index(
    { leaseId: 1, billingPeriod: 1 },
    {
        unique: true,
        partialFilterExpression: {
            leaseId: { $type: "objectId" },
            billingPeriod: { $type: "string" },
        },
    }
);

export const Invoice =
    mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);
