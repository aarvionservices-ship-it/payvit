const asyncHandler = require("../../../middlewares/asyncHandler");
const AppError     = require("../../../core/utils/AppError");
const panService   = require("../service/pan.service");

// ─── POST /api/v1/kyc/pan/start-session ──────────────────────────────────────
// Body: (none required)
// Response: { data: { sessionId, questions: [{id, question}] } }
const startSession = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const result = await panService.startSession(userId);
    return res.status(200).json({ success: true, data: result });
});

// ─── GET /api/v1/kyc/pan/session/:sessionId ───────────────────────────────────
// Response: { data: { sessionId, status, steps, questions, agentLog, ... } }
const getSession = asyncHandler(async (req, res) => {
    const userId        = req.user.userId;
    const { sessionId } = req.params;
    const result = await panService.getSession(sessionId, userId);
    return res.status(200).json({ success: true, data: result });
});

// ─── POST /api/v1/kyc/pan/verify-details ─────────────────────────────────────
// Body: { sessionId, panNumber, nameOnPAN, answers: [{id, answer}] }
// Response: { message }
const verifyDetails = asyncHandler(async (req, res) => {
    const ipAddress = req.ip;
    const { sessionId, panNumber, nameOnPAN, answers } = req.body;

    if (!sessionId)                          throw new AppError("sessionId is required.", 400);
    if (!panNumber)                          throw new AppError("panNumber is required.", 400);
    if (!answers || !Array.isArray(answers)) throw new AppError("answers array is required.", 400);

    const result = await panService.verifyDetails(sessionId, panNumber, nameOnPAN, answers, ipAddress);
    return res.status(200).json({ success: true, ...result });
});

// ─── POST /api/v1/kyc/pan/verify-otp ─────────────────────────────────────────
// Body: { sessionId, otp }
// Response: { message, panLast4, nameOnPAN }
const verifyOtp = asyncHandler(async (req, res) => {
    const ipAddress          = req.ip;
    const { sessionId, otp } = req.body;

    if (!sessionId) throw new AppError("sessionId is required.", 400);
    if (!otp)       throw new AppError("otp is required.", 400);

    const result = await panService.verifyOtp(sessionId, otp, ipAddress);
    return res.status(200).json({ success: true, ...result });
});

// ─── POST /api/v1/kyc/pan/resend-otp ─────────────────────────────────────────
// Body: { sessionId }
// Response: { message }
const resendOtp = asyncHandler(async (req, res) => {
    const ipAddress     = req.ip;
    const { sessionId } = req.body;

    if (!sessionId) throw new AppError("sessionId is required.", 400);

    const result = await panService.resendOtp(sessionId, ipAddress);
    return res.status(200).json({ success: true, ...result });
});

module.exports = {
    startSession,
    getSession,
    verifyDetails,
    verifyOtp,
    resendOtp
};
