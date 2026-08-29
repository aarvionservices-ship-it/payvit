const crypto = require("crypto");
const bcrypt = require("bcrypt");
const PanKycSession      = require("../model/PanKycSession.model");
const Kyc                = require("../model/kyc.model");
const kycRepo            = require("../repository/kyc.repository");
const User               = require("../../auth/model/auth.model");
const customerProfileRepo = require("../../user/repository/customerProfile.repository");
const auditService       = require("../../../core/audit/audit.service");
const emailTemplateService = require("../../emailTemplate/service/emailTemplate.service");
const eventBus           = require("../../../core/eventBus");
const snowflake          = require("../../../core/utils/distributedId");
const AppError           = require("../../../core/utils/AppError");
const encryptionService  = require("../../../core/security/encryption.service");
const config             = require("../../../core/config/env.config");

// ─── PAN format: 5 uppercase letters, 4 digits, 1 uppercase letter ───────────
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// ─── Question Bank ────────────────────────────────────────────────────────────
// Each question defines how the answer is resolved from the user's data.
// Validation happens server-side — answers never leave the server in plain text.
const QUESTION_BANK = [
    {
        id: "q_dob",
        question: "What is your date of birth? (DD/MM/YYYY)",
        /**
         * @param {string} answer - User's answer
         * @param {object} user - Auth user doc
         * @param {object} profile - CustomerProfile doc
         */
        validate(answer, user, profile) {
            const dob = profile?.dob ? new Date(profile.dob) : null;
            if (!dob) return false;
            const day   = String(dob.getDate()).padStart(2, "0");
            const month = String(dob.getMonth() + 1).padStart(2, "0");
            const year  = dob.getFullYear();
            const formatted = `${day}/${month}/${year}`;
            return answer.trim() === formatted;
        }
    },
    {
        id: "q_phone_last4",
        question: "What are the last 4 digits of your registered mobile number?",
        validate(answer, user) {
            return user.phone && user.phone.slice(-4) === answer.trim();
        }
    },
    {
        id: "q_name",
        question: "What is your full registered name?",
        validate(answer, user) {
            return answer.trim().toLowerCase() === (user.name || "").toLowerCase();
        }
    },
    {
        id: "q_email",
        question: "What is your registered email address?",
        validate(answer, user) {
            return answer.trim().toLowerCase() === (user.email || "").toLowerCase();
        }
    }
];

// ─── OTP helpers ──────────────────────────────────────────────────────────────
function generateOtp() {
    // 6-digit cryptographically random OTP
    return String(crypto.randomInt(100000, 999999));
}

async function hashOtp(otp) {
    return bcrypt.hash(otp, 10);
}

async function compareOtp(otp, hash) {
    return bcrypt.compare(otp, hash);
}

// ─── Mock config ──────────────────────────────────────────────────────────────
const MOCK_MODE = process.env.PAN_MOCK_MODE !== "false"; // default true
const MOCK_OTP  = process.env.PAN_MOCK_OTP  || "654321";

class PanService {

    // ─── 1. Start Session ─────────────────────────────────────────────────────
    /**
     * Creates a new PAN KYC session and returns 2 random questions.
     * Called when the user opens the video KYC screen.
     *
     * @param {string} userId
     * @returns {{ sessionId, questions: Array<{id, question}> }}
     */
    async startSession(userId) {
        // Check if user already has PAN verified
        const existingKyc = await kycRepo.findByUserId(userId);
        if (existingKyc?.panVerified) {
            throw new AppError("PAN is already verified for this account.", 400);
        }

        // Expire any previous active sessions for this user
        await PanKycSession.updateMany(
            { userId, status: "active" },
            { $set: { status: "expired" } }
        );

        // Pick 2 distinct random questions
        const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 2).map(q => ({
            id: q.id,
            question: q.question
        }));

        const sessionId = snowflake.nextId();
        const session = await PanKycSession.create({
            sessionId,
            userId,
            questions: selected,
            agentLog: [
                {
                    role: "agent",
                    message: "Hello! Please show your PAN card clearly to the camera. I will scan it automatically.",
                    timestamp: new Date()
                }
            ]
        });

        return {
            sessionId: session.sessionId,
            questions: selected
        };
    }

    // ─── 2. Verify PAN Details + Security Questions → Send OTP ───────────────
    /**
     * Validates the OCR-extracted PAN number, verifies the user's answers to
     * the 2 security questions, then dispatches a 6-digit OTP.
     *
     * @param {string} sessionId
     * @param {string} panNumber         - OCR-extracted PAN, e.g. "ADHPB7061Q"
     * @param {string} nameOnPAN         - Name as it appears on the card
     * @param {Array<{id, answer}>} answers
     * @param {string} ipAddress
     * @returns {{ message: string }}
     */
    async verifyDetails(sessionId, panNumber, nameOnPAN, answers, ipAddress) {
        const session = await this._getActiveSession(sessionId);

        // Guard: must not already have sent OTP or be verified
        if (session.status === "otp_sent") {
            throw new AppError("OTP already sent. Please verify the OTP.", 400);
        }
        if (session.status === "verified") {
            throw new AppError("This session is already completed.", 400);
        }

        // ── Validate PAN format ─────────────────────────────────────────────
        const normalised = (panNumber || "").trim().toUpperCase();
        if (!PAN_REGEX.test(normalised)) {
            throw new AppError("Invalid PAN number format. Expected format: ABCDE1234F", 400);
        }

        // ── Duplicate PAN check ─────────────────────────────────────────────
        // Ensure the same PAN isn't already verified by another account
        const allKycs = await Kyc.find({ panVerified: true });
        for (const k of allKycs) {
            if (k.getDecryptedPAN() === normalised && k.userId !== session.userId) {
                throw new AppError("This PAN is already linked to another account.", 400);
            }
        }

        // ── Fetch user + profile for question validation ────────────────────
        const user    = await User.findOne({ userId: session.userId });
        const profile = await customerProfileRepo.findByUserId(session.userId);
        if (!user) throw new AppError("User not found.", 404);

        // ── Validate security question answers ──────────────────────────────
        if (!answers || answers.length < 2) {
            throw new AppError("Both security question answers are required.", 400);
        }

        for (const { id, answer } of answers) {
            const questionDef = QUESTION_BANK.find(q => q.id === id);
            if (!questionDef) {
                throw new AppError(`Unknown question id: ${id}`, 400);
            }
            // Verify this question was actually part of this session
            const sessionQ = session.questions.find(q => q.id === id);
            if (!sessionQ) {
                throw new AppError(`Question ${id} does not belong to this session.`, 400);
            }

            const isCorrect = questionDef.validate(answer, user, profile);
            if (!isCorrect) {
                // Log failed attempt before throwing
                await auditService.log(
                    "PAN_KYC_QUESTION_FAILED",
                    session.userId,
                    "PanKycSession",
                    sessionId,
                    { questionId: id },
                    ipAddress
                );
                throw new AppError("One or more security question answers are incorrect.", 400);
            }
        }

        // ── Questions passed — update step ──────────────────────────────────
        await PanKycSession.findOneAndUpdate(
            { sessionId },
            {
                $set: {
                    panEncrypted: Kyc.encryptPAN(normalised),
                    panLast4: normalised.slice(-4),
                    nameOnPAN: nameOnPAN?.trim() || null,
                    "steps.panCapture.status": "completed",
                    "steps.panCapture.completedAt": new Date(),
                    "steps.questions.status": "completed",
                    "steps.questions.completedAt": new Date()
                },
                $push: {
                    agentLog: {
                        role: "agent",
                        message: `PAN ${normalised.slice(0, 2)}***${normalised.slice(-1)} confirmed. Security questions verified. Sending OTP to your registered mobile.`,
                        timestamp: new Date()
                    }
                }
            }
        );

        // ── Generate and send OTP ───────────────────────────────────────────
        const otpSentCount = (session.otpSentCount || 0) + 1;
        if (otpSentCount > 3) {
            throw new AppError("OTP send limit exceeded for this session.", 400);
        }

        let otp;
        if (MOCK_MODE) {
            otp = MOCK_OTP;
            if (process.env.NODE_ENV !== "test") {
                console.log(`[MOCK PAN OTP] Session: ${sessionId} | PAN: ${normalised} | OTP: ${otp}`);
            }
        } else {
            otp = generateOtp();
            // Send OTP via email (production: swap with SMS provider)
            try {
                await emailTemplateService.sendEmailWithTemplate("pan-otp", user.email, {
                    username: user.name,
                    otp,
                    panLast4: normalised.slice(-4)
                });
            } catch (emailError) {
                console.error(`[PAN KYC] Failed to send OTP email: ${emailError.message}`);
                throw new AppError("Failed to send OTP. Please try again.", 500);
            }
        }

        const otpHash    = await hashOtp(otp);
        const otpExpiry  = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await PanKycSession.findOneAndUpdate(
            { sessionId },
            {
                $set: {
                    otpHash,
                    otpExpiresAt: otpExpiry,
                    otpSentCount,
                    status: "otp_sent"
                }
            }
        );

        await auditService.log(
            "PAN_KYC_OTP_SENT",
            session.userId,
            "PanKycSession",
            sessionId,
            { panLast4: normalised.slice(-4), mockMode: MOCK_MODE },
            ipAddress
        );

        return {
            message: MOCK_MODE
                ? `OTP sent (Mock Mode). Use: ${MOCK_OTP}`
                : "OTP sent to your registered email/mobile."
        };
    }

    // ─── 3. Verify OTP ────────────────────────────────────────────────────────
    /**
     * Compares the submitted OTP against the hashed one in the session.
     * On success: marks PAN verified on the Kyc document.
     *
     * @param {string} sessionId
     * @param {string} otp
     * @param {string} ipAddress
     * @returns {{ message, panLast4, nameOnPAN }}
     */
    async verifyOtp(sessionId, otp, ipAddress) {
        const session = await this._getActiveSession(sessionId, ["active", "otp_sent"]);

        if (session.status !== "otp_sent") {
            throw new AppError("No OTP has been sent yet. Please submit your PAN details first.", 400);
        }

        if (!otp || typeof otp !== "string" || otp.trim() === "") {
            throw new AppError("OTP is required.", 400);
        }

        // ── Check expiry ────────────────────────────────────────────────────
        if (!session.otpExpiresAt || new Date() > session.otpExpiresAt) {
            await PanKycSession.findOneAndUpdate(
                { sessionId },
                { $set: { status: "failed" } }
            );
            throw new AppError("OTP has expired. Please start a new session.", 400);
        }

        // ── Compare OTP ─────────────────────────────────────────────────────
        const isValid = await compareOtp(otp.trim(), session.otpHash);
        if (!isValid) {
            await auditService.log(
                "PAN_KYC_OTP_FAILED",
                session.userId,
                "PanKycSession",
                sessionId,
                {},
                ipAddress
            );
            throw new AppError("Invalid OTP. Please try again.", 400);
        }

        // ── OTP valid — persist PAN to KYC record ───────────────────────────
        // Upsert the KYC record with PAN fields

        const existingKyc = await kycRepo.findByUserId(session.userId);
        const kycId = existingKyc?.kycId || snowflake.nextId();

        await Kyc.findOneAndUpdate(
            { userId: session.userId },
            {
                $set: {
                    kycId,
                    // Preserve existing Aadhaar fields — only update PAN fields
                    panEncrypted:     session.panEncrypted,
                    panLast4:         session.panLast4,
                    nameOnPAN:        session.nameOnPAN,
                    panVerified:      true,
                    panVerifiedAt:    new Date(),
                    panKycSessionId:  sessionId,
                    // Only update status if not already fully Aadhaar-verified
                    ...(existingKyc?.status !== "verified" && { status: "pan_verified" })
                }
            },
            { upsert: true, new: true }
        );

        // Mark the session complete
        await PanKycSession.findOneAndUpdate(
            { sessionId },
            {
                $set: {
                    status: "verified",
                    completedAt: new Date(),
                    "steps.otpVerify.status": "completed",
                    "steps.otpVerify.completedAt": new Date()
                },
                $push: {
                    agentLog: {
                        role: "agent",
                        message: "Congratulations! Your PAN has been verified successfully.",
                        timestamp: new Date()
                    }
                }
            }
        );

        await auditService.log(
            "PAN_KYC_VERIFIED",
            session.userId,
            "PanKycSession",
            sessionId,
            { panLast4: session.panLast4, nameOnPAN: session.nameOnPAN },
            ipAddress
        );

        eventBus.emit("kyc.pan_verified", { userId: session.userId });

        return {
            message: "PAN verified successfully.",
            panLast4: session.panLast4,
            nameOnPAN: session.nameOnPAN
        };
    }

    // ─── 4. Resend OTP ────────────────────────────────────────────────────────
    /**
     * Resends a fresh OTP for an existing session that already passed
     * PAN + questions validation.
     *
     * @param {string} sessionId
     * @param {string} ipAddress
     */
    async resendOtp(sessionId, ipAddress) {
        const session = await this._getActiveSession(sessionId, ["active", "otp_sent"]);

        if (session.status === "active" && !session.panEncrypted) {
            throw new AppError("Please complete PAN and security question verification first.", 400);
        }

        const otpSentCount = (session.otpSentCount || 0) + 1;
        if (otpSentCount > 3) {
            throw new AppError("Maximum OTP resend limit reached.", 400);
        }

        let otp;
        if (MOCK_MODE) {
            otp = MOCK_OTP;
            if (process.env.NODE_ENV !== "test") {
                console.log(`[MOCK PAN OTP RESEND] Session: ${sessionId} | OTP: ${otp}`);
            }
        } else {
            otp = generateOtp();
            const user = await User.findOne({ userId: session.userId });
            try {
                await emailTemplateService.sendEmailWithTemplate("pan-otp", user.email, {
                    username: user.name,
                    otp,
                    panLast4: session.panLast4
                });
            } catch (emailError) {
                console.error(`[PAN KYC] Failed to resend OTP email: ${emailError.message}`);
                throw new AppError("Failed to resend OTP. Please try again.", 500);
            }
        }

        const otpHash   = await hashOtp(otp);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        await PanKycSession.findOneAndUpdate(
            { sessionId },
            {
                $set: {
                    otpHash,
                    otpExpiresAt: otpExpiry,
                    otpSentCount,
                    status: "otp_sent"
                }
            }
        );

        await auditService.log(
            "PAN_KYC_OTP_RESENT",
            session.userId,
            "PanKycSession",
            sessionId,
            { attempt: otpSentCount, mockMode: MOCK_MODE },
            ipAddress
        );

        return {
            message: MOCK_MODE
                ? `OTP resent (Mock Mode). Use: ${MOCK_OTP}`
                : "OTP resent successfully."
        };
    }

    // ─── 5. Get Session Status ────────────────────────────────────────────────
    /**
     * Returns safe session details — questions and current status.
     * Used by the frontend to poll or re-hydrate session state.
     *
     * @param {string} sessionId
     * @param {string} userId   - from JWT, to prevent session hijacking
     */
    async getSession(sessionId, userId) {
        const session = await PanKycSession.findOne({ sessionId }).lean();
        if (!session) {
            throw new AppError("Session not found.", 404);
        }
        if (session.userId !== userId) {
            throw new AppError("Unauthorized session access.", 403);
        }

        return {
            sessionId:   session.sessionId,
            status:      session.status,
            steps:       session.steps,
            questions:   session.questions,
            panLast4:    session.panLast4,
            nameOnPAN:   session.nameOnPAN,
            agentLog:    session.agentLog,
            startedAt:   session.startedAt,
            expiresAt:   session.expiresAt
        };
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────
    /**
     * Loads an active session and validates it hasn't expired or failed.
     *
     * @param {string} sessionId
     * @param {string[]} allowedStatuses
     */
    async _getActiveSession(sessionId, allowedStatuses = ["active", "otp_sent"]) {
        const session = await PanKycSession.findOne({ sessionId });
        if (!session) {
            throw new AppError("PAN KYC session not found.", 404);
        }
        if (session.status === "expired") {
            throw new AppError("Session has expired. Please start a new KYC session.", 400);
        }
        if (session.status === "verified") {
            throw new AppError("This session is already complete.", 400);
        }
        if (session.status === "failed") {
            throw new AppError("This session has failed. Please start a new KYC session.", 400);
        }
        if (!allowedStatuses.includes(session.status)) {
            throw new AppError("Session is in an invalid state.", 400);
        }
        // Check wall-clock expiry
        if (new Date() > session.expiresAt) {
            await PanKycSession.findOneAndUpdate(
                { sessionId },
                { $set: { status: "expired" } }
            );
            throw new AppError("Session has expired. Please start a new KYC session.", 400);
        }
        return session;
    }
}

module.exports = new PanService();
