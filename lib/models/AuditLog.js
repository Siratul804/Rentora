import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorRole: { type: String, enum: ["owner", "tenant"] },
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
});

export const AuditLog =
    mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);

export default AuditLog;
