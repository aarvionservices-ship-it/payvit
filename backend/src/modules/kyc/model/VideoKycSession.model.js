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
//  WELCOME → PAN_CAPTURE → LIVENESS_CHECK → QUESTIONS → OTP_SENT → COMPLETE
//
// Each stage is advanced by the agent service after validating the user's input.

const STAGES = [
    "WELCOME",
    "PAN_CAPTURE",
    "LIVENESS_CHECK",
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

        // ── Liveness check ─────────────────────────────────────────────────
        livenessVerified:  { type: Boolean, default: false },
        livenessCheckedAt: { type: Date, default: null },

        // ── PAN data (extracted via Gemini Vision OCR) ──────────────────────
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
            welcome:       { type: stepSchema, default: () => ({ status: "pending" }) },
            panCapture:    { type: stepSchema, default: () => ({ status: "pending" }) },
            liveness:      { type: stepSchema, default: () => ({ status: "pending" }) },
            questions:     { type: stepSchema, default: () => ({ status: "pending" }) },
            otpVerify:     { type: stepSchema, default: () => ({ status: "pending" }) }
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
