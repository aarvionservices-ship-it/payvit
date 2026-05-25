const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            unique: true,
            index: true
        },

        name: String,
        phone: String,

        email: {
            type: String,
            unique: true,
            index: true
        },

        password: String,

        role: {
            type: String,
            enum: ["admin", "employee", "customer"],
            default: "customer"
        },

        refreshToken: String,

        loginAttempts: {
            type: Number,
            default: 0
        },

        lockUntil: {
            type: Date,
            default: null
        },

        isActive: {
            type: Boolean,
            default: true
        },

        profileImage: {
            data: Buffer,
            contentType: String
        },

        favoriteOffers: [{
            type: String
        }],

        isProfileComplete: {
            type: Boolean,
            default: false
        },
        resetPasswordToken: String,
        resetPasswordExpires: Date
    },
    { timestamps: true });

module.exports = mongoose.model("User", userSchema);
