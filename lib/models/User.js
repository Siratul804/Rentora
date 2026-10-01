const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        role: {
            type: String,
            enum: ["tenant", "owner", "admin"],
            default: "tenant"
        },
    },
    { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
