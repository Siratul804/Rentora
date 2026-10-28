import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    maintenanceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaintenanceRequest",
    },
    type: {
      type: String,
      enum: [
        "invoice-generated",
        "invoice-sent",
        "rent-due-reminder",
        "maintenance-submitted",
        "maintenance-updated",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    readAt: { type: Date, default: null },
    deliveries: {
      type: [
        new mongoose.Schema(
          {
            channel: {
              type: String,
              enum: ["in-app", "email", "sms"],
              required: true,
            },
            status: {
              type: String,
              enum: ["pending", "delivered", "failed", "unconfigured"],
              required: true,
            },
            attemptedAt: { type: Date, default: null },
            deliveredAt: { type: Date, default: null },
            error: { type: String, default: "" },
          },
          { _id: false }
        ),
      ],
      default: () => [
        { channel: "in-app", status: "delivered", deliveredAt: new Date() },
      ],
    },
  },
  { timestamps: true }
);

NotificationSchema.pre("validate", function () {
  const hasTenantRecipient = Boolean(this.tenantId);
  const hasOwnerRecipient = Boolean(this.ownerId);

  if (hasTenantRecipient === hasOwnerRecipient) {
    this.invalidate("tenantId", "A notification must have exactly one recipient.");
  }

  if (
    ["invoice-generated", "invoice-sent"].includes(this.type) &&
    !this.invoiceId
  ) {
    this.invalidate("invoiceId", "Invoice notifications require an invoice.");
  }

  if (this.type === "rent-due-reminder" && !hasTenantRecipient) {
    this.invalidate("tenantId", "Rent reminders must have a tenant recipient.");
  }

  if (
    ["maintenance-submitted", "maintenance-updated"].includes(this.type) &&
    !this.maintenanceRequestId
  ) {
    this.invalidate(
      "maintenanceRequestId",
      "Maintenance notifications require a maintenance request."
    );
  }
});

const Notification =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

export default Notification;
