/**
 * videoKyc.service.js
 *
 * Business logic for the Video KYC AI Agent.
 * Owns the 6-stage session state machine:
 *
 *   WELCOME → PAN_CAPTURE → LIVENESS_CHECK → QUESTIONS → OTP_SENT → COMPLETE
 *
 * Delegates:
 *   - AI decisions  → videoKycAgent.service.js
 *   - OTP send/hash → bcrypt + emailTemplateService
 *   - Persistence   → VideoKycSession model + Kyc model
 *   - Audit trail   → auditService
 */

const crypto  = require("crypto");
const bcrypt  = require("bcrypt");

const VideoKycSession  = require("../model/VideoKycSession.model");
const Kyc              = require("../model/kyc.model");
const kycRepo          = require("../repository/kyc.repository");
const User             = require("../../auth/model/auth.model");
const customerProfileRepo = require("../../user/repository/customerProfile.repository");
const auditService     = require("../../../core/audit/audit.service");
const emailTemplateService = require("../../emailTemplate/service/emailTemplate.service");
const eventBus         = require("../../../core/eventBus");
const snowflake        = require("../../../core/utils/distributedId");
const AppError         = require("../../../core/utils/AppError");
const config           = require("../../../core/config/env.config");
const agent            = require("./videoKycAgent.service");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isMockMode() {
    return process.env.VIDEO_KYC_MOCK_MODE !== "false";
}

function getMockOtp() {
    return process.env.VIDEO_KYC_MOCK_OTP || config.videoKyc.mockOtp || "654321";
}

// ─── Question Bank (same definitions as pan.service.js) ──────────────────────

const QUESTION_BANK = [
    {
        id: "q_dob",
        question: "What is your date of birth? (DD/MM/YYYY)",
        validate(answer, user, profile) {
            const dob = profile?.dob ? new Date(profile.dob) : null;
            if (!dob) return false;
            const day   = String(dob.getDate()).padStart(2, "0");
            const month = String(dob.getMonth() + 1).padStart(2, "0");
            const year  = dob.getFullYear();
            return answer.trim() === `${day}/${month}/${year}`;
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
    return String(crypto.randomInt(100000, 999999));
}

async function hashOtp(otp)         { return bcrypt.hash(otp, 10); }
async function compareOtp(otp, hash){ return bcrypt.compare(otp, hash); }

// ─── Service ──────────────────────────────────────────────────────────────────

class VideoKycService {

    // ─── 1. Start Session ─────────────────────────────────────────────────────
    /**
     * Creates a new Video KYC session.
     * Expires any previous active sessions for the user.
     *
     * @param {string} userId
     * @returns {{ sessionId, stage, agentMessage }}
     */
    async startSession(userId) {
        // Block if user already has PAN verified via any route
        const existingKyc = await kycRepo.findByUserId(userId);
        if (existingKyc?.panVerified) {
            throw new AppError("PAN KYC is already verified for this account.", 400);
        }

        // Expire any active video KYC sessions
        await VideoKycSession.updateMany(
            { userId, status: "active" },
            { $set: { status: "expired" } }
        );

        // Pick 2 distinct random questions
        const shuffled  = [...QUESTION_BANK].sort(() => Math.random() - 0.5);
        const questions = shuffled.slice(0, 2).map(q => ({ id: q.id, question: q.question }));

        const sessionId     = snowflake.nextId();
        const agentGreeting = agent.getStageGreeting("WELCOME");

        await VideoKycSession.create({
            sessionId,
            userId,
            stage:    "WELCOME",
            questions,
            agentLog: [
                { role: "agent", message: agentGreeting, stage: "WELCOME", timestamp: new Date() }
            ]
        });

        return {
            sessionId,
            stage:        "WELCOME",
            agentMessage: agentGreeting
        };
    }

    // ─── 2. Chat (main turn loop) ─────────────────────────────────────────────
    /**
     * Processes a user's text message and returns the agent's reply.
     * Advances the stage when the agent confirms readiness.
     *
     * Stage progression rules:
     *  WELCOME      → user says "ready" / "yes" / similar → advance to PAN_CAPTURE
     *  PAN_CAPTURE  → handled by uploadImage (not chat)
     *  LIVENESS     → handled by uploadImage (not chat)
     *  QUESTIONS    → validate answer, advance when both answered
     *  OTP_SENT     → handled by verifyOtp endpoint (not chat)
     *  COMPLETE     → no-op
     *
     * @param {string} sessionId
     * @param {string} userId
     * @param {string} userMessage
     * @param {string} ipAddress
     * @returns {{ agentMessage, stage, done, nextAction }}
     */
    async chat(sessionId, userId, userMessage, ipAddress) {
        const session = await this._getActiveSession(sessionId, userId);

        // Append user message to log
        session.agentLog.push({ role: "user", message: userMessage, stage: session.stage, timestamp: new Date() });

        let agentReply;
        let newStage  = session.stage;
        let done      = false;
        let nextAction = null;   // hint to client: "upload_pan" | "upload_selfie" | "enter_otp"

        switch (session.stage) {
            case "WELCOME": {
                // Any positive intent moves to PAN_CAPTURE
                const { agentReply: reply } = await agent.chat(
                    session.agentLog.slice(-10),
                    userMessage,
                    "PAN_CAPTURE",
                    session.questions
                );
                agentReply = reply;
                newStage   = "PAN_CAPTURE";
                nextAction = "upload_pan";

                session.steps.welcome.status      = "completed";
                session.steps.welcome.completedAt = new Date();
                break;
            }

            case "PAN_CAPTURE": {
                // User may have typed a question — remind them to upload image
                const { agentReply: reply } = await agent.chat(
                    session.agentLog.slice(-6),
                    userMessage,
                    "PAN_CAPTURE",
                    []
                );
                agentReply = reply;
                nextAction = "upload_pan";
                break;
            }

            case "LIVENESS_CHECK": {
                // Remind user to upload selfie
                const { agentReply: reply } = await agent.chat(
                    session.agentLog.slice(-6),
                    userMessage,
                    "LIVENESS_CHECK",
                    []
                );
                agentReply = reply;
                nextAction = "upload_selfie";
                break;
            }

            case "QUESTIONS": {
                // Determine which question we're on
                const answeredCount   = session.questionsAnswered;
                const currentQuestion = session.questions[answeredCount];

                if (!currentQuestion) {
                    // Both answered — this shouldn't happen but handle gracefully
                    agentReply = "All questions have been answered. Please wait for your OTP.";
                    nextAction = "enter_otp";
                    break;
                }

                // Server-side answer validation
                const user    = await User.findOne({ userId: session.userId });
                const profile = await customerProfileRepo.findByUserId(session.userId);
                if (!user) throw new AppError("User not found.", 404);

                const questionDef = QUESTION_BANK.find(q => q.id === currentQuestion.id);
                const isCorrect   = questionDef?.validate(userMessage, user, profile) ?? false;

                // Log the answer (correct or not, for audit)
                session.answersLog.push({
                    questionId:  currentQuestion.id,
                    correct:     isCorrect,
                    answeredAt:  new Date()
                });

                if (!isCorrect) {
                    // Wrong answer — fail the session
                    session.status = "failed";
                    session.steps.questions.status      = "failed";
                    session.steps.questions.completedAt = new Date();
                    agentReply = "I'm sorry, that answer is incorrect. Your KYC session has been terminated for security reasons. Please start a new session.";

                    await session.save();

                    await auditService.log(
                        "VIDEO_KYC_QUESTION_FAILED",
                        userId,
                        "VideoKycSession",
                        sessionId,
                        { questionId: currentQuestion.id },
                        ipAddress
                    );

                    return { agentMessage: agentReply, stage: "failed", done: true, nextAction: null };
                }

                // Correct — increment counter
                session.questionsAnswered = answeredCount + 1;

                if (session.questionsAnswered < session.questions.length) {
                    // Ask next question
                    const nextQ = session.questions[session.questionsAnswered];
                    agentReply  = `Correct! Now, ${nextQ.question}`;
                    nextAction  = null;
                } else {
                    // All questions passed — send OTP
                    session.steps.questions.status      = "completed";
                    session.steps.questions.completedAt = new Date();

                    const otpResult = await this._sendOtp(session, user, ipAddress);
                    agentReply      = otpResult.agentMessage;
                    newStage        = "OTP_SENT";
                    nextAction      = "enter_otp";
                }
                break;
            }

            case "OTP_SENT": {
                agentReply = "Please enter the 6-digit OTP that was sent to your registered mobile/email to complete verification.";
                nextAction = "enter_otp";
                break;
            }

            case "COMPLETE": {
                agentReply = "Your Video KYC is already complete. No further action is needed.";
                done       = true;
                break;
            }

            default:
                agentReply = "I'm unable to process your request at this stage. Please start a new KYC session.";
        }

        // Persist agent reply
        session.agentLog.push({ role: "agent", message: agentReply, stage: newStage, timestamp: new Date() });
        session.stage = newStage;
        await session.save();

        return { agentMessage: agentReply, stage: newStage, done, nextAction };
    }

    // ─── 3. Upload Image (PAN OCR, Liveness, Anti-Spoof, Face Match) ──────────
    /**
     * Accepts a base64 image and runs Gemini Vision to extract PAN or check liveness.
     *
     * @param {string} sessionId
     * @param {string} userId
     * @param {string} base64Image   - Raw base64 (no data URI prefix)
     * @param {string} mimeType      - "image/jpeg" | "image/png" | "image/webp"
     * @param {"pan_ocr"|"liveness"|"face_match"|"anti_spoof"} task
     * @param {string} ipAddress
     * @returns {{ agentMessage, stage, extractedData }}
     */
    async uploadImage(sessionId, userId, base64Image, mimeType, task, ipAddress) {
        const session = await this._getActiveSession(sessionId, userId);

        const validTasks = ["pan_ocr", "liveness", "face_match", "anti_spoof"];
        if (!validTasks.includes(task)) {
            throw new AppError(`Invalid task. Use one of: ${validTasks.join(", ")}.`, 400);
        }

        // Stage guard: pan_ocr only valid at PAN_CAPTURE; liveness/face_match/anti_spoof valid at LIVENESS_CHECK
        const expectedStage = task === "pan_ocr" ? "PAN_CAPTURE" : "LIVENESS_CHECK";
        if (session.stage !== expectedStage) {
            throw new AppError(
                `Image task '${task}' is not valid at stage '${session.stage}'. Expected stage: ${expectedStage}.`,
                400
            );
        }

        if (!base64Image) {
            throw new AppError("Image data is required.", 400);
        }

        // Run Gemini vision
        const visionResult = await agent.analyseImage(base64Image, mimeType, task);

        if (!visionResult.success) {
            const agentMessage = task === "pan_ocr"
                ? `I couldn't read your PAN card clearly. ${visionResult.reason || "Please try again with better lighting."}`
                : `Biometric verification failed. ${visionResult.reason || "Please ensure your face is clearly visible."}`;

            session.agentLog.push({ role: "agent", message: agentMessage, stage: session.stage, timestamp: new Date() });
            await session.save();

            return { agentMessage, stage: session.stage, extractedData: null };
        }

        let agentMessage;
        let newStage;
        let extractedData;

        if (task === "pan_ocr") {
            // Encrypt and store the PAN
            session.panEncrypted = Kyc.encryptPAN(visionResult.panNumber);
            session.panLast4     = visionResult.panNumber?.slice(-4);
            session.nameOnPAN    = visionResult.nameOnPAN;

            session.steps.panCapture.status      = "completed";
            session.steps.panCapture.completedAt = new Date();
            newStage     = "LIVENESS_CHECK";
            agentMessage = `PAN card captured! I detected: ${this._maskPan(visionResult.panNumber)} in the name of ${visionResult.nameOnPAN}. Now please take a clear selfie for liveness verification. Look directly at the camera in good lighting.`;
            extractedData = {
                panLast4:  session.panLast4,
                nameOnPAN: session.nameOnPAN
            };

            await auditService.log(
                "VIDEO_KYC_PAN_CAPTURED",
                userId,
                "VideoKycSession",
                sessionId,
                { panLast4: session.panLast4, nameOnPAN: session.nameOnPAN, confidence: visionResult.confidence },
                ipAddress
            );

        } else if (task === "anti_spoof") {
            if (visionResult.isSpoofDetected || visionResult.passed === false) {
                const msg = `Anti-spoof check flagged: ${visionResult.reason || "Spoof attempt detected"}. Please ensure you are directly facing the camera without screens or masks.`;
                session.agentLog.push({ role: "agent", message: msg, stage: session.stage, timestamp: new Date() });
                await session.save();
                return { agentMessage: msg, stage: session.stage, extractedData: null };
            }

            session.antiSpoof = {
                passed:          true,
                riskScore:       visionResult.spoofRiskScore || 0.05,
                isSpoofDetected: false,
                indicators:      visionResult.indicators || [],
                quality:         visionResult.quality || {},
                checkedAt:       new Date()
            };
            agentMessage = "Anti-spoof check passed! Physical face verified.";
            newStage     = session.stage;
            extractedData = { antiSpoofPassed: true };

        } else if (task === "face_match") {
            if (!visionResult.isMatch) {
                const msg = `Face match failed: ${visionResult.details || "Face does not match the identity document"}.`;
                session.agentLog.push({ role: "agent", message: msg, stage: session.stage, timestamp: new Date() });
                await session.save();
                return { agentMessage: msg, stage: session.stage, extractedData: null };
            }

            session.faceMatch = {
                isMatched:       true,
                similarityScore: visionResult.similarityScore || 0.90,
                confidence:      visionResult.confidence || 0.92,
                threshold:       visionResult.threshold || 0.75,
                matchedAt:       new Date(),
                details:         visionResult.details
            };
            agentMessage = "Face match confirmed with PAN identity!";
            newStage     = session.stage;
            extractedData = { faceMatched: true, similarityScore: session.faceMatch.similarityScore };

        } else {
            // Liveness
            if (!visionResult.livenessPassed) {
                const msg = `Liveness check failed: ${visionResult.reason}. Please try again with your face clearly visible.`;
                session.agentLog.push({ role: "agent", message: msg, stage: session.stage, timestamp: new Date() });
                await session.save();
                return { agentMessage: msg, stage: session.stage, extractedData: null };
            }

            session.livenessVerified  = true;
            session.livenessCheckedAt = new Date();
            session.livenessDetails   = {
                score:         visionResult.confidence || 0.95,
                confidence:    visionResult.confidence || 0.95,
                challengeType: "passive",
                reason:        visionResult.reason || "Live face detected"
            };
            session.selfieCaptured    = true;
            session.selfieCapturedAt  = new Date();

            session.steps.liveness.status      = "completed";
            session.steps.liveness.completedAt = new Date();

            newStage     = "QUESTIONS";
            const firstQ = session.questions[0];
            agentMessage = `Liveness confirmed! ✅ Now I need to verify your identity with a couple of security questions. ${firstQ.question}`;
            extractedData = { livenessVerified: true };

            await auditService.log(
                "VIDEO_KYC_LIVENESS_PASSED",
                userId,
                "VideoKycSession",
                sessionId,
                { confidence: visionResult.confidence },
                ipAddress
            );
        }

        session.agentLog.push({ role: "agent", message: agentMessage, stage: newStage, timestamp: new Date() });
        session.stage = newStage;
        await session.save();

        return { agentMessage, stage: newStage, extractedData };
    }

    // ─── 4. Verify OTP ────────────────────────────────────────────────────────
    /**
     * Validates the OTP and finalizes the KYC record.
     *
     * @param {string} sessionId
     * @param {string} userId
     * @param {string} otp
     * @param {string} ipAddress
     * @returns {{ agentMessage, stage, done }}
     */
    async verifyOtp(sessionId, userId, otp, ipAddress) {
        const session = await this._getActiveSession(sessionId, userId, ["active", "otp_sent"]);

        if (session.stage !== "OTP_SENT" || session.status !== "otp_sent") {
            throw new AppError("No OTP has been sent yet. Complete the verification steps first.", 400);
        }

        if (!otp || typeof otp !== "string" || otp.trim() === "") {
            throw new AppError("OTP is required.", 400);
        }

        // Check expiry
        if (!session.otpExpiresAt || new Date() > session.otpExpiresAt) {
            session.status = "failed";
            await session.save();
            throw new AppError("OTP has expired. Please start a new session.", 400);
        }

        // Validate OTP
        const isValid = await compareOtp(otp.trim(), session.otpHash);
        if (!isValid) {
            await auditService.log(
                "VIDEO_KYC_OTP_FAILED",
                userId,
                "VideoKycSession",
                sessionId,
                {},
                ipAddress
            );
            throw new AppError("Invalid OTP. Please try again.", 400);
        }

        // ── OTP valid — finalize KYC record ─────────────────────────────────
        const existingKyc = await kycRepo.findByUserId(userId);
        const kycId       = existingKyc?.kycId || snowflake.nextId();

        await Kyc.findOneAndUpdate(
            { userId },
            {
                $set: {
                    kycId,
                    panEncrypted:    session.panEncrypted,
                    panLast4:        session.panLast4,
                    nameOnPAN:       session.nameOnPAN,
                    panVerified:     true,
                    panVerifiedAt:   new Date(),
                    panKycSessionId: sessionId,
                    ...(existingKyc?.status !== "verified" && { status: "pan_verified" })
                }
            },
            { upsert: true, new: true }
        );

        // Mark session complete
        const agentMessage = "🎉 Congratulations! Your Video KYC verification is complete. Your PAN has been successfully verified.";

        session.stage       = "COMPLETE";
        session.status      = "verified";
        session.completedAt = new Date();
        session.steps.otpVerify.status      = "completed";
        session.steps.otpVerify.completedAt = new Date();
        session.agentLog.push({ role: "agent", message: agentMessage, stage: "COMPLETE", timestamp: new Date() });
        await session.save();

        await auditService.log(
            "VIDEO_KYC_VERIFIED",
            userId,
            "VideoKycSession",
            sessionId,
            { panLast4: session.panLast4, nameOnPAN: session.nameOnPAN },
            ipAddress
        );

        eventBus.emit("kyc.pan_verified", { userId });

        // Send completion email (non-blocking)
        try {
            const user = await User.findOne({ userId });
            if (user) {
                await emailTemplateService.sendEmailWithTemplate("kyc-approved", user.email, {
                    username: user.name
                });
            }
        } catch (emailError) {
            if (process.env.NODE_ENV !== "test") {
                console.error(`[VIDEO KYC] Failed to send completion email: ${emailError.message}`);
            }
        }

        return { agentMessage, stage: "COMPLETE", done: true };
    }

    // ─── 5. Resend OTP ────────────────────────────────────────────────────────
    /**
     * Resends a fresh OTP for a session already in OTP_SENT stage.
     *
     * @param {string} sessionId
     * @param {string} userId
     * @param {string} ipAddress
     */
    async resendOtp(sessionId, userId, ipAddress) {
        const session = await this._getActiveSession(sessionId, userId, ["active", "otp_sent"]);

        if (session.stage !== "OTP_SENT") {
            throw new AppError("Cannot resend OTP: verification steps not yet complete.", 400);
        }

        const otpSentCount = (session.otpSentCount || 0) + 1;
        if (otpSentCount > 3) {
            throw new AppError("Maximum OTP resend limit reached. Please start a new session.", 400);
        }

        const user = await User.findOne({ userId });
        if (!user) throw new AppError("User not found.", 404);

        const { agentMessage } = await this._sendOtp(session, user, ipAddress);

        await auditService.log(
            "VIDEO_KYC_OTP_RESENT",
            userId,
            "VideoKycSession",
            sessionId,
            { attempt: otpSentCount, mockMode: isMockMode() },
            ipAddress
        );

        return { agentMessage };
    }

    // ─── 6. Get Session ───────────────────────────────────────────────────────
    /**
     * Returns safe session state for client polling / re-hydration.
     *
     * @param {string} sessionId
     * @param {string} userId
     */
    async getSession(sessionId, userId) {
        const session = await VideoKycSession.findOne({ sessionId }).lean();
        if (!session) throw new AppError("Session not found.", 404);
        if (session.userId !== userId) throw new AppError("Unauthorized session access.", 403);

        return {
            sessionId:        session.sessionId,
            stage:            session.stage,
            status:           session.status,
            steps:            session.steps,
            questions:        session.questions,
            panLast4:         session.panLast4,
            nameOnPAN:        session.nameOnPAN,
            livenessVerified: session.livenessVerified,
            questionsAnswered: session.questionsAnswered,
            agentLog:         session.agentLog,
            startedAt:        session.startedAt,
            expiresAt:        session.expiresAt,
            completedAt:      session.completedAt
        };
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Loads and validates a session — checks ownership, status, and wall-clock expiry.
     */
    async _getActiveSession(sessionId, userId, allowedStatuses = ["active", "otp_sent"]) {
        const session = await VideoKycSession.findOne({ sessionId });
        if (!session) throw new AppError("Video KYC session not found.", 404);
        if (session.userId !== userId) throw new AppError("Unauthorized session access.", 403);

        if (session.status === "expired") throw new AppError("Session has expired. Please start a new KYC session.", 400);
        if (session.status === "verified") throw new AppError("This session is already complete.", 400);
        if (session.status === "failed")   throw new AppError("This session has failed. Please start a new KYC session.", 400);

        if (!allowedStatuses.includes(session.status)) {
            throw new AppError("Session is in an invalid state.", 400);
        }

        // Wall-clock expiry check
        if (new Date() > session.expiresAt) {
            session.status = "expired";
            await session.save();
            throw new AppError("Session has expired. Please start a new KYC session.", 400);
        }

        return session;
    }

    /**
     * Generates + persists an OTP for the session.
     * Returns the agent message to send to the client.
     */
    async _sendOtp(session, user, ipAddress) {
        let otp;
        const mock = isMockMode();

        if (mock) {
            otp = getMockOtp();
            if (process.env.NODE_ENV !== "test") {
                console.log(`[MOCK VIDEO KYC OTP] Session: ${session.sessionId} | OTP: ${otp}`);
            }
        } else {
            otp = generateOtp();
            try {
                await emailTemplateService.sendEmailWithTemplate("pan-otp", user.email, {
                    username: user.name,
                    otp,
                    panLast4: session.panLast4
                });
            } catch (emailError) {
                console.error(`[VIDEO KYC] Failed to send OTP email: ${emailError.message}`);
                throw new AppError("Failed to send OTP. Please try again.", 500);
            }
        }

        const otpHash    = await hashOtp(otp);
        const otpExpiry  = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        session.otpHash      = otpHash;
        session.otpExpiresAt = otpExpiry;
        session.otpSentCount = (session.otpSentCount || 0) + 1;
        session.status       = "otp_sent";

        await session.save();

        const agentMessage = mock
            ? `All checks passed! OTP sent (Mock Mode — use: ${getMockOtp()}). Please enter the 6-digit OTP to complete verification.`
            : "All checks passed! I've sent a 6-digit OTP to your registered email and mobile. Please enter it to complete your Video KYC.";

        return { agentMessage };
    }

    /**
     * Masks a PAN number for safe display: e.g. "ADHPB7061Q" → "AD***7061Q"
     */
    _maskPan(pan) {
        if (!pan || pan.length < 6) return "***";
        return `${pan.slice(0, 2)}***${pan.slice(-4)}`;
    }
}

module.exports = new VideoKycService();
