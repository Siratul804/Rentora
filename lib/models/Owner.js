import mongoose from "mongoose";

const OwnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "active",
    },
    approvalStatus: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true }
);

export const Owner =
  mongoose.models.Owner || mongoose.model("Owner", OwnerSchema);
export default Owner;

