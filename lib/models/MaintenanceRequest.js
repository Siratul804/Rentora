
import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    url: { type: String, default: "" },
    type: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    performedBy: { type: String, default: "System" },
    role: { type: String, default: "SYSTEM" },
    details: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const maintenanceRequestSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    category: { type: String, default: "General" },
    description: { type: String, required: true, trim: true },
    priority: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High", "Urgent"],
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN",
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tenantName: { type: String, default: "" },
    tenantEmail: { type: String, default: "" },
    tenantPhone: { type: String, default: "" },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    propertyName: { type: String, default: "" },
    unitId: { type: String, default: "" },
    unitNumber: { type: String, default: "" },
    permissionToEnter: { type: Boolean, default: false },
    notes: { type: String, default: "" },
    attachments: { type: [attachmentSchema], default: [] },
    assignedProvider: { type: String, default: "" },
    auditLogs: { type: [auditLogSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.MaintenanceRequest ||
  mongoose.model("MaintenanceRequest", maintenanceRequestSchema);
