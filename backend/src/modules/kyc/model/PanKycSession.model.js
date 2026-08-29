const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        question: { type: String, required: true },
        // We do NOT store the answer — validation happens in-memory per request
    },
    { _id: false }
);

const stepSchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ["pending", "completed", "skipped"],
            default: "pending"
        },
        completedAt: { type: Date, default: null }
    },
    { _id: false }
);

const panKycSessionSchema = new mongoose.Schema(
    {
        sessionId: {
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
        // PAN captured during this session (encrypted)
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
        // Two random questions drawn for this session
        questions: [questionSchema],
        // OTP state — hash stored, never plain text
        otpHash: {
            type: String,
            default: null
        },
        otpExpiresAt: {
            type: Date,
            default: null
        },
        otpSentCount: {
            type: Number,
            default: 0
        },
        // Step-level tracking
        steps: {
            panCapture:  { type: stepSchema, default: () => ({ status: "pending" }) },
            questions:   { type: stepSchema, default: () => ({ status: "pending" }) },
            otpVerify:   { type: stepSchema, default: () => ({ status: "pending" }) }
        },
        // Conversation log for the video agent
        agentLog: [
            {
                role: { type: String, enum: ["agent", "user"], required: true },
                message: { type: String, required: true },
                timestamp: { type: Date, default: Date.now }
            }
        ],
        status: {
            type: String,
            enum: ["active", "otp_sent", "verified", "failed", "expired"],
            default: "active"
        },
        startedAt: {
            type: Date,
            default: Date.now
        },
        completedAt: {
            type: Date,
            default: null
        },
        // Auto-expire sessions after 30 minutes
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 60 * 1000)
        }
    },
    { timestamps: true }
);

// TTL index — MongoDB will auto-delete expired sessions
panKycSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PanKycSession", panKycSessionSchema);
