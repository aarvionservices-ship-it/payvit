const mongoose = require("mongoose");
const encryptionService = require("../../../core/security/encryption.service");

function encrypt(text) {
    if (!text) return null;
    return encryptionService.encryptWithPublicKey(text);
}

function decrypt(encryptedText) {
    if (!encryptedText) return null;
    try {
        return encryptionService.decryptPayload(encryptedText);
    } catch {
        return null;
    }
}

const cardSchema = new mongoose.Schema(
    {
        cardId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        userId: {
            type: String,
            required: true,
            index: true
        },
        walletId: {
            type: String,
            default: null,
            index: true
        },
        provider: {
            type: String,
            required: true,
            trim: true
        },
        holderName: {
            type: String,
            required: true,
            trim: true
        },
        cardNumberEncrypted: {
            type: String,
            required: true
        },
        maskedCardNumber: {
            type: String,
            required: true
        },
        expiry: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ["VERIFIED", "PENDING", "FAILED"],
            default: "VERIFIED"
        },
        isPrimary: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

cardSchema.methods.getCardNumber = function () {
    return decrypt(this.cardNumberEncrypted);
};

cardSchema.statics.encryptCardNumber = function (cardNumber) {
    const cleanNumber = cardNumber.replace(/\s+/g, "");
    const masked = "XXXX-XXXX-XXXX-" + cleanNumber.slice(-4);
    return {
        encrypted: encrypt(cleanNumber),
        masked
    };
};

cardSchema.methods.toSafeJSON = function () {
    const obj = this.toObject();
    delete obj.cardNumberEncrypted;
    obj.id = obj._id;
    return obj;
};

module.exports = mongoose.models.WalletCard || mongoose.model("WalletCard", cardSchema);
