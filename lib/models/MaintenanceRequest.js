
import mongoose from "mongoose";

const maintenanceRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Maintenance title is required"],
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      default: "Other",
      trim: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Pending", "Dispatched", "In Progress", "Resolved", "Closed"],
      default: "Pending",
    },

    completedAt: {
      type: Date,
      default: null,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    comment: {
      type: String,
      default: "",
      trim: true,
    },

    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    unit: {
      type: String,
      default: "",
      trim: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    assignedTo: {
      type: String,
      default: "Unassigned",
      trim: true,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    attachments: {
      type: [String],
      default: [],
    },

    activityHistory: [
      {
        action: {
          type: String,
          required: true,
        },
        details: {
          type: String,
          default: "",
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
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
  mongoose.model("MaintenanceRequest", maintenanceRequestSchema);
