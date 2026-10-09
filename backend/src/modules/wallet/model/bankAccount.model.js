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

const bankAccountSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },
        accountHolderName: {
            type: String,
            required: true,
            trim: true
        },
        accountNumberEncrypted: {
            type: String,
            required: true
        },
        accountNumberMasked: {
            type: String
        },
        ifscCode: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },
        bankName: {
            type: String,
            required: true
        },
        bankBranch: {
            type: String,
            default: ""
        },
        accountType: {
            type: String,
            enum: ["savings", "current", "salary"],
            default: "savings"
        },
        isPrimary: {
            type: Boolean,
            default: false
        },
        isVerified: {
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

bankAccountSchema.methods.getAccountNumber = function () {
    return decrypt(this.accountNumberEncrypted);
};

bankAccountSchema.statics.encryptAccountNumber = function (accountNumber) {
    const masked = "XXXX" + accountNumber.slice(-4);
    return {
        encrypted: encrypt(accountNumber),
        masked
    };
};

bankAccountSchema.methods.toSafeJSON = function () {
    const obj = this.toObject();
    delete obj.accountNumberEncrypted;
    return obj;
};

module.exports = mongoose.model("BankAccount", bankAccountSchema);
