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

const bankTransferSchema = new mongoose.Schema(
    {
        txnId: {
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
        fromBankAccountId: {
            type: String,
            required: true
        },
        fromBankName: {
            type: String,
            default: ""
        },
        fromAccountNumberMasked: {
            type: String,
            default: ""
        },
        fromIfscCode: {
            type: String,
            default: ""
        },
        toAccountHolderName: {
            type: String,
            required: true,
            trim: true
        },
        toAccountNumberEncrypted: {
            type: String,
            required: true
        },
        toAccountNumberMasked: {
            type: String
        },
        toIfscCode: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },
        toBankName: {
            type: String,
            default: ""
        },
        amount: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            enum: ["neft", "imps", "rtgs"],
            default: "imps"
        },
        status: {
            type: String,
            enum: ["pending", "success", "failed"],
            default: "pending"
        },
        utr: {
            type: String,
            unique: true,
            sparse: true
        },
        description: {
            type: String,
            default: ""
        },
        failureReason: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

bankTransferSchema.methods.getAccountNumber = function () {
    return decrypt(this.toAccountNumberEncrypted);
};

bankTransferSchema.statics.encryptAccountNumber = function (accountNumber) {
    const masked = "XXXX" + accountNumber.slice(-4);
    return {
        encrypted: encrypt(accountNumber),
        masked
    };
};

module.exports = mongoose.model("BankTransfer", bankTransferSchema);
