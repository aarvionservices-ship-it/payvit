const mongoose = require("mongoose");
const encryptionService = require("../../../core/security/encryption.service");

function encrypt(text) {
    if (!text) return null;
    if (typeof text === "string" && text.length > 100) return text;
    return encryptionService.encryptWithPublicKey(text);
}

function decrypt(encryptedText) {
    if (!encryptedText) return null;
    if (typeof encryptedText === "string" && encryptedText.length < 100) return encryptedText;
    try {
        return encryptionService.decryptPayload(encryptedText);
    } catch {
        return encryptedText;
    }
}

const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    pincode: String,
    type: {
        type: String,
        enum: ["current", "permanent", "office"],
        default: "current"
    }
}, { _id: false });

const customerProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        dob: Date,
        gender: {
            type: String,
            enum: ["male", "female", "other"]
        },
        occupation: String,
        annualIncome: Number,
        panNumber: {
            type: String,
            set: encrypt,
            get: decrypt
        },
        aadhaarNumber: {
            type: String,
            set: encrypt,
            get: decrypt
        },
        addresses: [addressSchema],
        profileImage: {
            data: Buffer,
            contentType: String
        },
    },
    { 
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true }
    }
);

module.exports = mongoose.model("CustomerProfile", customerProfileSchema);
