/**
 * videoKyc.controller.js
 *
 * REST controller for the Video KYC AI Agent.
 *
 * Routes (all under /api/v1/kyc/video):
 *   POST /start-session     — start a new session
 *   POST /chat              — send a message to the agent
 *   POST /upload-image      — upload PAN card or selfie image
 *   POST /verify-otp        — submit OTP to complete verification
 *   POST /resend-otp        — resend OTP
 *   GET  /session/:sessionId — get session state
 */

const asyncHandler   = require("../../../middlewares/asyncHandler");
const AppError       = require("../../../core/utils/AppError");
const videoKycService = require("../service/videoKyc.service");

// ─── POST /api/v1/kyc/video/start-session ────────────────────────────────────
// Auth:     Bearer JWT
// Body:     (none)
// Response: { success, data: { sessionId, stage, agentMessage } }
const startSession = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const result = await videoKycService.startSession(userId);
    return res.status(200).json({ success: true, data: result });
});

// ─── POST /api/v1/kyc/video/chat ─────────────────────────────────────────────
// Auth:     Bearer JWT
// Body:     { sessionId: string, message: string }
// Response: { success, data: { agentMessage, stage, done, nextAction } }
const chat = asyncHandler(async (req, res) => {
    const userId          = req.user.userId;
    const ipAddress       = req.ip;
    const { sessionId, message } = req.body;

    if (!sessionId) throw new AppError("sessionId is required.", 400);
    if (!message || typeof message !== "string" || message.trim() === "") {
        throw new AppError("message is required.", 400);
    }

    const result = await videoKycService.chat(sessionId, userId, message.trim(), ipAddress);
    return res.status(200).json({ success: true, data: result });
});

// ─── POST /api/v1/kyc/video/upload-image ─────────────────────────────────────
// Auth:     Bearer JWT
// Body:     {
//             sessionId: string,
//             image: string,        ← raw base64 (no "data:image/jpeg;base64," prefix)
//             mimeType: string,     ← "image/jpeg" | "image/png" | "image/webp"
//             task: "pan_ocr" | "liveness"
//           }
// Response: { success, data: { agentMessage, stage, extractedData } }
const uploadImage = asyncHandler(async (req, res) => {
    const userId                             = req.user.userId;
    const ipAddress                          = req.ip;
    const { sessionId, image, mimeType, task } = req.body;

    if (!sessionId)                    throw new AppError("sessionId is required.", 400);
    if (!image)                        throw new AppError("image (base64) is required.", 400);
    if (!task)                         throw new AppError("task is required: 'pan_ocr' or 'liveness'.", 400);
    if (!["pan_ocr", "liveness"].includes(task)) {
        throw new AppError("Invalid task. Must be 'pan_ocr' or 'liveness'.", 400);
    }

    // Strip data URI prefix if client accidentally included it
    const cleanedImage = image.replace(/^data:image\/[a-z]+;base64,/, "");
    const cleanedMime  = mimeType || "image/jpeg";

    const result = await videoKycService.uploadImage(
        sessionId, userId, cleanedImage, cleanedMime, task, ipAddress
    );
    return res.status(200).json({ success: true, data: result });
});

// ─── POST /api/v1/kyc/video/verify-otp ───────────────────────────────────────
// Auth:     Bearer JWT
// Body:     { sessionId: string, otp: string }
// Response: { success, data: { agentMessage, stage, done } }
const verifyOtp = asyncHandler(async (req, res) => {
    const userId          = req.user.userId;
    const ipAddress       = req.ip;
    const { sessionId, otp } = req.body;

    if (!sessionId) throw new AppError("sessionId is required.", 400);
    if (!otp)       throw new AppError("otp is required.", 400);

    const result = await videoKycService.verifyOtp(sessionId, userId, otp, ipAddress);
    return res.status(200).json({ success: true, data: result });
});

// ─── POST /api/v1/kyc/video/resend-otp ───────────────────────────────────────
// Auth:     Bearer JWT
// Body:     { sessionId: string }
// Response: { success, data: { agentMessage } }
const resendOtp = asyncHandler(async (req, res) => {
    const userId        = req.user.userId;
    const ipAddress     = req.ip;
    const { sessionId } = req.body;

    if (!sessionId) throw new AppError("sessionId is required.", 400);

    const result = await videoKycService.resendOtp(sessionId, userId, ipAddress);
    return res.status(200).json({ success: true, data: result });
});

// ─── GET /api/v1/kyc/video/session/:sessionId ─────────────────────────────────
// Auth:     Bearer JWT
// Response: { success, data: { sessionId, stage, status, steps, agentLog, ... } }
const getSession = asyncHandler(async (req, res) => {
    const userId        = req.user.userId;
    const { sessionId } = req.params;

    const result = await videoKycService.getSession(sessionId, userId);
    return res.status(200).json({ success: true, data: result });
});

module.exports = {
    startSession,
    chat,
    uploadImage,
    verifyOtp,
    resendOtp,
    getSession
};
