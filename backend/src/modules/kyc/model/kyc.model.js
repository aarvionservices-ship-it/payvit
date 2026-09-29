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
            default: null
        },
        aadhaarEncrypted: {
            type: String,
            default: null
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
            enum: ["pending_otp", "otp_sent", "verified", "failed", "pan_pending", "pan_verified", "documents_uploaded"],
            default: "pending_otp"
        },
        // ── PAN Verification Fields ─────────────────────────────────────────
        panEncrypted: {
            type: String,
            default: null
        },
        panLast4: {
            type: String,
            default: null
        },
        nameOnPAN: {
            type: String,
            default: null
        },
        panVerified: {
            type: Boolean,
            default: false
        },
        panVerifiedAt: {
            type: Date,
            default: null
        },
        panKycSessionId: {
            type: String,
            default: null
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
        },

        // ── Module 2: Identity Collection & Documents ───────────────────────
        identityStatus: {
            type: String,
            enum: ["pending", "aadhaar_captured", "pan_captured", "documents_uploaded", "completed"],
            default: "pending"
        },
        panDocument: {
            imageHash: { type: String, default: null },
            mimeType: { type: String, default: null },
            data: { type: Buffer, default: null },
            isOriginal: { type: Boolean, default: false },
            confidence: { type: Number, default: null },
            extractedPan: { type: String, default: null },
            extractedName: { type: String, default: null },
            uploadedAt: { type: Date, default: null }
        },
        aadhaarDocument: {
            frontImageHash: { type: String, default: null },
            frontMimeType: { type: String, default: null },
            frontData: { type: Buffer, default: null },
            backImageHash: { type: String, default: null },
            backMimeType: { type: String, default: null },
            backData: { type: Buffer, default: null },
            isMasked: { type: Boolean, default: true },
            uploadedAt: { type: Date, default: null }
        },
        ekycData: {
            source: { type: String, default: null },
            rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
            capturedAt: { type: Date, default: null }
        }
    },
    { timestamps: true }
);

kycSchema.statics.encryptAadhaar = function (aadhaarNumber) {
    return encrypt(aadhaarNumber);
};

kycSchema.statics.encryptPAN = function (panNumber) {
    return encrypt(panNumber);
};

kycSchema.methods.getDecryptedAadhaar = function () {
    return decrypt(this.aadhaarEncrypted);
};

kycSchema.methods.getDecryptedPAN = function () {
    return decrypt(this.panEncrypted);
};

kycSchema.methods.toSafeJSON = function () {
    const obj = this.toObject();
    delete obj.aadhaarEncrypted;
    delete obj.panEncrypted;
    if (obj.panDocument) {
        delete obj.panDocument.data;
    }
    if (obj.aadhaarDocument) {
        delete obj.aadhaarDocument.frontData;
        delete obj.aadhaarDocument.backData;
    }
    delete obj._id;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model("Kyc", kycSchema);
