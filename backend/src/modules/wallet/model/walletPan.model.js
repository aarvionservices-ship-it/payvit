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
    } catch (_e) {
        return null;
    }
}

const walletPanSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        panEncrypted: {
            type: String,
            required: true
        },
        panLast4: {
            type: String,
            required: true
        },
        panMasked: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "verified", "failed"],
            default: "pending"
        },
        verifiedAt: {
            type: Date,
            default: null
        },
        nameOnPan: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

walletPanSchema.statics.encryptPan = function (panNumber) {
    return encrypt(panNumber);
};

walletPanSchema.methods.getDecryptedPan = function () {
    return decrypt(this.panEncrypted);
};

walletPanSchema.methods.toSafeJSON = function () {
    const obj = this.toObject();
    delete obj.panEncrypted;
    delete obj._id;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model("WalletPan", walletPanSchema);
