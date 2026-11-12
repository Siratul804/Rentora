import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema({
    type: { type: String, enum: ["rent", "owner_registration"], default: "rent" },
    leaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Lease", default: null },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", default: null },
    tenantName: { type: String, default: "" },
    propertyName: { type: String, default: "" },
    unit: { type: String, default: "" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    billingPeriod: { type: String, match: /^\d{4}-\d{2}$/, default: undefined },
    rentAmount: { type: Number, required: true },
    dueDate: { type: Date, default: Date.now },
    paymentInstructions: { type: String, default: "" },
    pdfData: { type: Buffer, default: undefined, select: false },
    pdfGeneratedAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },

    status: { type: String, enum: ["Pending", "Paid", "Overdue"], default: "Pending" },
    tranId: { type: String, default: "" },
    valId: { type: String, default: "" },
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
