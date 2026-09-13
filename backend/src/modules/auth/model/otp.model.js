const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },
        otpHash: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ["REGISTRATION", "LOGIN", "PASSWORD_RESET"],
            default: "REGISTRATION",
            index: true
        },
        attempts: {
            type: Number,
            default: 0
        },
        resendAfter: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expireAfterSeconds: 0 }
        }
    },
    { timestamps: true }
);

// Compound index to quickly find active OTP for specific email and type
otpSchema.index({ email: 1, type: 1 });

module.exports = mongoose.model("Otp", otpSchema);
