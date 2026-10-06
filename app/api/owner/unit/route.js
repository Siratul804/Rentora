import mongoose from "mongoose";

const unitSchema = new mongoose.Schema(
    {
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

        size: {
            type: Number,
            required: true,
            min: 1,
        },

        availabilityStatus: {
            type: String,
            required: true,
            enum: ["Available", "Occupied", "Maintenance"],
            default: "Available",
        },

        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const Unit =
    mongoose.models.Unit ||
    mongoose.model("Unit", unitSchema);

export default Unit;