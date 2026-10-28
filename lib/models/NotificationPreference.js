import mongoose from "mongoose";

const NotificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    events: {
      invoiceGenerated: { type: Boolean, default: true },
      invoiceSent: { type: Boolean, default: true },
      rentDueReminders: { type: Boolean, default: true },
      maintenanceSubmitted: { type: Boolean, default: true },
      maintenanceUpdated: { type: Boolean, default: true },
    },
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },
    eventChannels: {
      invoiceGenerated: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
      },
      invoiceSent: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
      },
      rentDueReminders: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
      },
      maintenanceSubmitted: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
      },
      maintenanceUpdated: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

const NotificationPreference =
  mongoose.models.NotificationPreference ||
  mongoose.model("NotificationPreference", NotificationPreferenceSchema);

export default NotificationPreference;
