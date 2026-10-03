import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        address: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            required: true,
            enum: [
                "Apartment",
                "House",
                "Commercial",
                "Office",
                "Other",
            ],
        },

        totalUnits: {
            type: Number,
            required: true,
            min: 1,
        },

        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

const Property =
    mongoose.models.Property ||
    mongoose.model("Property", propertySchema);

export default Property;