const mongoose = require("mongoose");

const singleAddressSchema = new mongoose.Schema(
    {
        street:  { type: String, required: true, trim: true },
        city:    { type: String, required: true, trim: true },
        state:   { type: String, required: true, trim: true },
        pincode: { type: String, required: true, trim: true },
        country: { type: String, default: "India", trim: true }
    },
    { _id: false }
);

const gpsSchema = new mongoose.Schema(
    {
        consentGiven:     { type: Boolean, required: true, default: false },
        consentTimestamp: { type: Date,    required: true },
        latitude:         { type: Number,  required: true },
        longitude:        { type: Number,  required: true },
        accuracy:         { type: Number,  default: null },
        altitude:         { type: Number,  default: null },
        capturedAt:       { type: Date,    default: Date.now },
        ipAddress:        { type: String,  default: null }
    },
    { _id: false }
);

const riskAssessmentSchema = new mongoose.Schema(
    {
        riskScore:        { type: Number, default: 0 },
        riskLevel:        { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "LOW" },
        status:           { type: String, enum: ["VERIFIED", "FLAGGED", "REJECTED"], default: "VERIFIED" },
        distanceKm:       { type: Number, default: 0 },
        addressCompared:  { type: String, default: "current" },
        checks:           { type: mongoose.Schema.Types.Mixed, default: {} },
        flags:            { type: [String], default: [] },
        details:          { type: String, default: null }
    },
    { _id: false }
);

const addressVerificationSchema = new mongoose.Schema(
    {
        verificationId: {
            type:     String,
            required: true,
            unique:   true,
            index:    true
        },
        userId: {
            type:     String,
            required: true,
            index:    true
        },
        permanentAddress: {
            type:     singleAddressSchema,
            required: true
        },
        currentAddress: {
            type:     singleAddressSchema,
            required: true
        },
        sameAsPermanent: {
            type:    Boolean,
            default: false
        },
        gps: {
            type:     gpsSchema,
            required: true
        },
        riskAssessment: {
            type:     riskAssessmentSchema,
            required: true
        },
        status: {
            type:    String,
            enum:    ["pending", "verified", "flagged", "rejected"],
            default: "pending",
            index:   true
        },
        verifiedAt: {
            type:    Date,
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("AddressVerification", addressVerificationSchema);
