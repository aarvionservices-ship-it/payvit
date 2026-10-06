/**
 * addressVerification.controller.js
 *
 * Controller for Address & GPS Verification endpoints.
 */

const asyncHandler               = require("../../../middlewares/asyncHandler");
const addressVerificationService = require("../service/addressVerification.service");

// ─── POST /api/v1/kyc/address/verify ─────────────────────────────────────────
// Body: { permanentAddress, currentAddress, sameAsPermanent, gps: { latitude, longitude, accuracy, consentGiven, consentTimestamp } }
const verifyAddress = asyncHandler(async (req, res) => {
    const userId    = req.user.userId;
    const ipAddress = req.ip;

    const result = await addressVerificationService.verifyAddress(userId, req.body, ipAddress);

    return res.status(200).json({
        success: true,
        message: result.status === "verified"
            ? "Address verified successfully against GPS coordinates."
            : "Address verification completed with risk flags for manual review.",
        data: result
    });
});

// ─── GET /api/v1/kyc/address/status ──────────────────────────────────────────
const getAddressStatus = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const result = await addressVerificationService.getAddressStatus(userId);

    return res.status(200).json({
        success: true,
        data: result
    });
});

// ─── POST /api/v1/kyc/address/risk-preview ───────────────────────────────────
// Body: { address: { street, city, state, pincode }, gps: { latitude, longitude, accuracy, consentGiven } }
const checkRiskPreview = asyncHandler(async (req, res) => {
    const result = addressVerificationService.checkRiskPreview(req.body);

    return res.status(200).json({
        success: true,
        data: result
    });
});

module.exports = {
    verifyAddress,
    getAddressStatus,
    checkRiskPreview
};
