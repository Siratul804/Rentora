import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    role: {
      type: String,
      enum: ["admin", "owner", "tenant"],
      default: "tenant",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    // Tenant specific fields (assigned by Owner)
    property: {
      type: String,
      default: "",
    },
    unit: {
      type: String,
      default: "",
    },
    rentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Overdue"],
      default: "Pending",
    },
    leaseEnd: {
      type: String,
      default: "",
    },
    leaseStart: {
      type: String,
      default: "",
    },
    rentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deposit: {
      type: Number,
      default: 0,
      min: 0,
    },
    billingCycle: {
      type: String,
      default: "1st - 5th Monthly",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notificationPreferences: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
