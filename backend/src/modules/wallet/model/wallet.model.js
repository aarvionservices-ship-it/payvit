const mongoose = require("mongoose");
const snowflake = require("../../../core/utils/distributedId");

const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        balance: {
            type: Number,
            default: 0,
            min: 0
        },

        walletPin: {
            type: String,
            default: null
        },

        isBiometricEnabled: {
            type: Boolean,
            default: false
        },

        pinAttempts: {
            type: Number,
            default: 0
        },

        pinLockUntil: {
            type: Date,
            default: null
        },

        biometricPublicKey: {
            type: String,
            default: null
        },

        biometricDeviceId: {
            type: String,
            default: null
        },

        biometricChallenge: {
            type: String,
            default: null
        },

        biometricChallengeExpires: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["active", "frozen", "suspended"],
            default: "active"
        },

        // Daily transaction limit in INR
        dailyLimit: {
            type: Number,
            default: 10000
        },

        // Amount debited today (resets at midnight)
        usedToday: {
            type: Number,
            default: 0
        },

        lastResetDate: {
            type: String,
            default: () => new Date().toISOString().split("T")[0]
        },

        // Onboarding / KYC flags

        walletId: {
            type: String,
            unique: true,
            sparse: true,
            index: true
        },

        kycVerified: {
            type: Boolean,
            default: false
        },

        // Granular onboarding flags
        panVerified: {
            type: Boolean,
            default: false
        },

        bankLinked: {
            type: Boolean,
            default: false
        },

        consentAccepted: {
            type: Boolean,
            default: false
        },

        // Overall KYC onboarding progress
        kycStatus: {
            type: String,
            enum: ["none", "aadhaar_pending", "aadhaar_verified", "pan_pending", "pan_verified", "complete"],
            default: "none"
        },

        isPinSet: {
            type: Boolean,
            default: false
        },

        totalTransactions: {
            type: Number,
            default: 0
        },

        totalMoneyAdded: {
            type: Number,
            default: 0
        },

        totalMoneyWithdrawn: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

// Auto-reset usedToday at start of new day
walletSchema.methods.resetDailyUsageIfNeeded = function () {
    const today = new Date().toISOString().split("T")[0];
    if (this.lastResetDate !== today) {
        this.usedToday = 0;
        this.lastResetDate = today;
    }
};

module.exports = mongoose.model("Wallet", walletSchema);
