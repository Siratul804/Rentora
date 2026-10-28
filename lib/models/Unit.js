import mongoose from "mongoose";

const unitSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    unitNumber: {
      type: String,
      required: true,
      trim: true,
    },
    rentAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    deposit: {
      type: Number,
      default: 0,
      min: 0,
    },
    bedrooms: {
      type: Number,
      default: 1,
      min: 0,
    },
    bathrooms: {
      type: Number,
      default: 1,
      min: 0,
    },
    size: {
      type: Number,
      default: null,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Vacant", "Occupied", "Maintenance"],
      default: "Vacant",
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

unitSchema.index({ propertyId: 1, unitNumber: 1 }, { unique: true });

export default mongoose.models.Unit ||
  mongoose.model("Unit", unitSchema);
