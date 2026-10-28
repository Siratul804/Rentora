import mongoose from "mongoose";

const MaintenanceRequestSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
      default: () => `MNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    },
    category: {
      type: String,
      default: "Plumbing",
      enum: ["Plumbing", "Electrical", "HVAC", "Appliance", "Carpentry", "Other"],
    },
    priority: {
      type: String,
      required: [true, "Priority is required"],
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT", "Low", "Medium", "High", "Urgent"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "Open", "In Progress", "Resolved", "Closed"],
      default: "OPEN",
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    notes: {
      type: String,
      default: "",
    },
    permissionToEnter: {
      type: Boolean,
      default: true,
    },
    attachments: [
      {
        name: String,
        size: String,
        type: String,
        url: String,
      },
    ],
    // Database Relationships (Tenant, Property, Unit)
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    tenantName: {
      type: String,
      default: "Akib Arham",
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
    },
    propertyName: {
      type: String,
      default: "Green Horizon Residency",
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
    },
    unitNumber: {
      type: String,
      default: "Unit 4B",
    },
    assignedTech: {
      type: String,
      default: "Pending Assignment",
    },
    auditLogs: [
      {
        action: String,
        performedBy: String,
        details: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.MaintenanceRequest ||
  mongoose.model("MaintenanceRequest", MaintenanceRequestSchema);