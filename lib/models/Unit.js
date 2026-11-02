import mongoose from "mongoose";

const UnitSchema = new mongoose.Schema(
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
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    unitNumber: {
      type: String,
      required: true,
      trim: true,
    },
    rentAmount: {
      type: Number,
      default: 0,
    },
    deposit: {
      type: Number,
      default: 0,
    },
    bedrooms: {
      type: Number,
      default: 1,
    },
    bathrooms: {
      type: Number,
      default: 1,
    },
    size: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["Vacant", "Occupied", "Maintenance"],
      default: "Vacant",
    },
    availability: {
      type: String,
      default: "Available",
    },
  },
  { timestamps: true }
);

export const Unit = mongoose.models.Unit || mongoose.model("Unit", UnitSchema);
export default Unit;

