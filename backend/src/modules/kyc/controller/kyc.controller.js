const asyncHandler = require("../../../middlewares/asyncHandler");
const kycService = require("../service/kyc.service");

// POST /api/v1/kyc/initiate - Body: { aadhaarNumber }
const initiateKyc = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const ipAddress = req.ip;
    const { aadhaarNumber } = req.body;

    const result = await kycService.initiateKyc(userId, aadhaarNumber, ipAddress);
    return res.status(200).json({ success: true, ...result });
});

// POST /api/v1/kyc/verify-otp - Body: { otp }
const verifyOtp = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const ipAddress = req.ip;
    const { otp } = req.body;

    const result = await kycService.verifyKycOtp(userId, otp, ipAddress);
    return res.status(200).json({ success: true, ...result });
});

// GET /api/v1/kyc/status
const getStatus = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const status = await kycService.getKycStatus(userId);
    return res.status(200).json({ success: true, data: status });
});

module.exports = {
    initiateKyc,
    verifyOtp,
    getStatus
};
