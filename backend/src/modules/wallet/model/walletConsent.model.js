const mongoose = require("mongoose");

const walletConsentSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        termsAccepted: {
            type: Boolean,
            required: true
        },

        privacyAccepted: {
            type: Boolean,
            required: true
        },

        kycConsent: {
            type: Boolean,
            required: true
        },

        acceptedAt: {
            type: Date,
            default: () => new Date()
        },

        // IP address at time of consent for compliance
        ipAddress: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("WalletConsent", walletConsentSchema);
