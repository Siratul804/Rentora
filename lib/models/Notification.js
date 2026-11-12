import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    leaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Lease" },
    maintenanceRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "MaintenanceRequest" },
    type: {
      type: String,
      enum: [
        "invoice-generated",
        "invoice-sent",
        "lease-expiry",
        "rent-due",
        "maintenance-submitted",
        "maintenance-updated",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    details: {
      tenantName: { type: String, default: "" },
      propertyName: { type: String, default: "" },
      unit: { type: String, default: "" },
      expiryDate: { type: String, default: "" },
      renewalOptions: { type: String, default: "" },
      daysBefore: { type: Number },
      dueDate: { type: Date },
      rentAmount: { type: Number },
      maintenanceTitle: { type: String, default: "" },
      maintenanceStatus: { type: String, default: "" },
      category: { type: String, default: "" },
    },
    deliveredChannels: { type: [String], default: ["inApp"] },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

NotificationSchema.index(
  { leaseId: 1, recipientId: 1, "details.daysBefore": 1 },
  {
    unique: true,
    partialFilterExpression: { type: "lease-expiry" },
  }
);

NotificationSchema.index(
  { invoiceId: 1, recipientId: 1, "details.daysBefore": 1 },
  {
    unique: true,
    partialFilterExpression: { type: "rent-due" },
  }
);

const Notification =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

export default Notification;
