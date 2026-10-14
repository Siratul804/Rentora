import mongoose from "mongoose";

const leaseSchema = new mongoose.Schema(
  {
    leaseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    tenantName: {
      type: String,
      required: [true, "Tenant name is required"],
      trim: true,
    },

    tenantEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    tenantPhone: {
      type: String,
      trim: true,
      default: "",
    },

    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },

    propertyName: {
      type: String,
      required: [true, "Property name is required"],
      trim: true,
    },

    unit: {
      type: String,
      trim: true,
      default: "",
    },

    startDate: {
      type: String,
      required: [true, "Start date is required"],
      trim: true,
    },

    endDate: {
      type: String,
      required: [true, "End date is required"],
      trim: true,
    },

    rent: {
      type: Number,
      required: [true, "Monthly rent amount is required"],
      min: [0, "Rent cannot be negative"],
    },

    deposit: {
      type: Number,
      default: 0,
      min: [0, "Security deposit cannot be negative"],
    },

    billingCycle: {
      type: String,
      default: "1st - 5th Monthly",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Active", "Pending", "Expired", "Terminated"],
      default: "Active",
      index: true,
    },

    terms: {
      type: [String],
      default: [],
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Virtual or helper to format full property and unit
leaseSchema.virtual("fullProperty").get(function () {
  if (this.unit) {
    return `${this.propertyName} (${this.unit})`;
  }
  return this.propertyName;
});

const Lease = mongoose.models.Lease || mongoose.model("Lease", leaseSchema);

export default Lease;
