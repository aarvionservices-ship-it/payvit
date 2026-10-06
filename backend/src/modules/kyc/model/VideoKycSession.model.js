const mongoose = require("mongoose");

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const questionSchema = new mongoose.Schema(
    {
        id:       { type: String, required: true },
        question: { type: String, required: true }
        // Answers are NEVER stored — validated in-memory per request
    },
    { _id: false }
);

const answerLogSchema = new mongoose.Schema(
    {
        questionId: { type: String, required: true },
        correct:    { type: Boolean, required: true },
        answeredAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

const agentLogEntrySchema = new mongoose.Schema(
    {
        role:      { type: String, enum: ["agent", "user", "system"], required: true },
        message:   { type: String, required: true },
        stage:     { type: String, default: null },      // stage at the time of message
        timestamp: { type: Date, default: Date.now }
    },
    { _id: false }
);

const stepSchema = new mongoose.Schema(
    {
        status:      { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
        completedAt: { type: Date, default: null }
    },
    { _id: false }
);

// ─── Video KYC Session Stages ─────────────────────────────────────────────────
//
//  WELCOME → PAN_CAPTURE → LIVENESS_CHECK → VIDEO_RECORDING → QUESTIONS → OTP_SENT → COMPLETE
//
// VIDEO_RECORDING: 20-second live video, voice + face consistency, secure storage.
// Each stage is advanced by the agent service after validating the user's input.

const STAGES = [
    "WELCOME",
    "PAN_CAPTURE",
    "LIVENESS_CHECK",
    "VIDEO_RECORDING",
    "QUESTIONS",
    "OTP_SENT",
    "COMPLETE"
];

// ─── Main Schema ──────────────────────────────────────────────────────────────

const videoKycSessionSchema = new mongoose.Schema(
    {
        sessionId: {
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

        // ── Stage machine ──────────────────────────────────────────────────
        stage: {
            type:    String,
            enum:    STAGES,
            default: "WELCOME"
        },

        // ── Liveness & Biometric Verifications ──────────────────────────────
        livenessVerified:  { type: Boolean, default: false },
        livenessCheckedAt: { type: Date, default: null },
        livenessDetails: {
            score:         { type: Number, default: null },
            confidence:    { type: Number, default: null },
            challengeType: { type: String, default: "passive" },
            reason:        { type: String, default: null }
        },

        // ── 1:1 AI Face Match (Selfie vs PAN / Document Photo) ──────────────
        faceMatch: {
            isMatched:       { type: Boolean, default: false },
            similarityScore: { type: Number, default: null },
            confidence:      { type: Number, default: null },
            threshold:       { type: Number, default: 0.75 },
            matchedAt:       { type: Date, default: null },
            details:         { type: String, default: null }
        },

        // ── Anti-Spoofing & Presentation Attack Detection ───────────────────
        antiSpoof: {
            passed:          { type: Boolean, default: false },
            riskScore:       { type: Number, default: null },
            isSpoofDetected: { type: Boolean, default: false },
            indicators:      { type: [String], default: [] },
            quality: {
                brightness:    { type: Number, default: null },
                sharpness:     { type: Number, default: null },
                faceDetected:  { type: Boolean, default: false },
                multipleFaces: { type: Boolean, default: false }
            },
            checkedAt:       { type: Date, default: null }
        },

        // ── Captured Selfie Image Metadata ──────────────────────────────────
        selfieCaptured:   { type: Boolean, default: false },
        selfieCapturedAt: { type: Date, default: null },
        selfieHash:       { type: String, default: null },

        // ── 20-Second Live Video Recording ──────────────────────────────────
        videoRecording: {
            recorded:        { type: Boolean, default: false },
            storageKey:      { type: String, default: null },   // S3 / GridFS object key
            secureUrl:       { type: String, default: null },   // pre-signed or internal URL
            durationSeconds: { type: Number, default: null },   // actual recorded duration
            recordedAt:      { type: Date,   default: null },
            sizeBytes:       { type: Number, default: null },
            sha256Hash:      { type: String, default: null },   // integrity hash
            mimeType:        { type: String, default: "video/webm" },
            encryptionKeyId: { type: String, default: null }    // KMS key reference
        },

        // ── Voice Consistency Check ─────────────────────────────────────────
        voiceConsistency: {
            passed:          { type: Boolean, default: false },
            confidenceScore: { type: Number, default: null },
            transcribedText: { type: String, default: null },
            checkedAt:       { type: Date,   default: null },
            details:         { type: String, default: null }
        },

        // ── PAN data (extracted via OCR) ───────────────────────────────────
        panEncrypted: { type: String, default: null },  // RSA-encrypted PAN
        panLast4:     { type: String, default: null },
        nameOnPAN:    { type: String, default: null },

        // ── Security questions (2 random from question bank) ───────────────
        questions:  { type: [questionSchema], default: [] },
        answersLog: { type: [answerLogSchema], default: [] },

        // ── Question answering progress ────────────────────────────────────
        questionsAnswered: { type: Number, default: 0 },  // 0, 1, or 2

        // ── OTP state (hash stored — never plain text) ─────────────────────
        otpHash:      { type: String, default: null },
        otpExpiresAt: { type: Date,   default: null },
        otpSentCount: { type: Number, default: 0    },

        // ── Step tracking ──────────────────────────────────────────────────
        steps: {
            welcome:         { type: stepSchema, default: () => ({ status: "pending" }) },
            panCapture:      { type: stepSchema, default: () => ({ status: "pending" }) },
            liveness:        { type: stepSchema, default: () => ({ status: "pending" }) },
            videoRecording:  { type: stepSchema, default: () => ({ status: "pending" }) },
            questions:       { type: stepSchema, default: () => ({ status: "pending" }) },
            otpVerify:       { type: stepSchema, default: () => ({ status: "pending" }) }
        },

        // ── Conversation log (full dialogue with AI agent) ─────────────────
        agentLog: { type: [agentLogEntrySchema], default: [] },

        // ── Session lifecycle ──────────────────────────────────────────────
        status: {
            type:    String,
            enum:    ["active", "otp_sent", "verified", "failed", "expired"],
            default: "active"
        },
        startedAt:   { type: Date, default: Date.now },
        completedAt: { type: Date, default: null },

        // Auto-expire after 30 minutes; MongoDB TTL index deletes the doc
        expiresAt: {
            type:    Date,
            default: () => new Date(Date.now() + 30 * 60 * 1000)
        }
    },
    { timestamps: true }
);

// TTL index — MongoDB auto-deletes expired sessions
videoKycSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─── Helpers ──────────────────────────────────────────────────────────────────

videoKycSessionSchema.methods.toSafeJSON = function () {
    const obj = this.toObject();
    delete obj.panEncrypted;
    delete obj.otpHash;
    delete obj._id;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model("VideoKycSession", videoKycSessionSchema);
module.exports.STAGES = STAGES;
