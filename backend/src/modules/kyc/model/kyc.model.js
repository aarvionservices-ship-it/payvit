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
    } catch (e) {
        return null;
    }
}

const kycSchema = new mongoose.Schema(
    {
        kycId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        aadhaarLast4: {
            type: String,
            required: true
        },
        aadhaarEncrypted: {
            type: String,
            required: true
        },
        nameOnAadhaar: {
            type: String,
            default: null
        },
        dobOnAadhaar: {
            type: Date,
            default: null
        },
        genderOnAadhaar: {
            type: String,
            default: null
        },
        addressOnAadhaar: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        status: {
            type: String,
            enum: ["pending_otp", "otp_sent", "verified", "failed"],
            default: "pending_otp"
        },
        txnId: {
            type: String,
            default: null
        },
        attempts: {
            type: Number,
            default: 0
        },
        otpSentCount: {
            type: Number,
            default: 0
        },
        verifiedAt: {
            type: Date,
            default: null
        },
        ipAddress: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

kycSchema.statics.encryptAadhaar = function (aadhaarNumber) {
    return encrypt(aadhaarNumber);
};

kycSchema.methods.getDecryptedAadhaar = function () {
    return decrypt(this.aadhaarEncrypted);
};

kycSchema.methods.toSafeJSON = function () {
    const obj = this.toObject();
    delete obj.aadhaarEncrypted;
    delete obj._id;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model("Kyc", kycSchema);
