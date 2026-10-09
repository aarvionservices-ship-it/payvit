/**
 * identityCollection.controller.js
 *
 * REST Controller for Module 2: Identity Collection
 */

const asyncHandler              = require("../../../middlewares/asyncHandler");
const identityCollectionService = require("../service/identityCollection.service");

// ─── POST /api/v1/kyc/identity/aadhaar ─────────────────────────────────────────
// Body: { aadhaarNumber }
const captureAadhaar = asyncHandler(async (req, res) => {
    const { aadhaarNumber } = req.body;
    const userId            = req.user.userId;
    const ipAddress         = req.ip;

    const result = await identityCollectionService.captureAadhaar(userId, aadhaarNumber, ipAddress);

    return res.status(200).json({
        success: true,
        message: result.message,
        data:    result
    });
});

// ─── POST /api/v1/kyc/identity/ekyc-response ──────────────────────────────────
// Body: { source, name, dob, gender, address, aadhaarLast4, txnId, rawResponse }
const captureEkycResponse = asyncHandler(async (req, res) => {
    const ekycPayload = req.body;
    const userId      = req.user.userId;
    const ipAddress   = req.ip;

    const result = await identityCollectionService.captureEkycResponse(userId, ekycPayload, ipAddress);

    return res.status(200).json({
        success: true,
        message: result.message,
        data:    result
    });
});

// ─── POST /api/v1/kyc/identity/pan ────────────────────────────────────────────
// Body: { panNumber, nameOnPAN }
const capturePan = asyncHandler(async (req, res) => {
    const { panNumber, nameOnPAN } = req.body;
    const userId                   = req.user.userId;
    const ipAddress                = req.ip;

    const result = await identityCollectionService.capturePan(userId, panNumber, nameOnPAN, ipAddress);

    return res.status(200).json({
        success: true,
        message: result.message,
        data:    result
    });
});

// ─── POST /api/v1/kyc/identity/upload-pan-card ────────────────────────────────
// Body: { image, mimeType }
const uploadPanCard = asyncHandler(async (req, res) => {
    const { image, mimeType } = req.body;
    const userId              = req.user.userId;
    const ipAddress           = req.ip;

    const result = await identityCollectionService.uploadPanCardImage(userId, image, mimeType, ipAddress);

    return res.status(200).json({
        success: true,
        message: result.message,
        data:    result
    });
});

// ─── POST /api/v1/kyc/identity/upload-aadhaar-card ────────────────────────────
// Body: { frontImage, frontMimeType, backImage, backMimeType }
const uploadAadhaarCard = asyncHandler(async (req, res) => {
    const { frontImage, frontMimeType, backImage, backMimeType } = req.body;
    const userId    = req.user.userId;
    const ipAddress = req.ip;

    const result = await identityCollectionService.uploadAadhaarImage(
        userId,
        { frontImage, frontMimeType, backImage, backMimeType },
        ipAddress
    );

    return res.status(200).json({
        success: true,
        message: result.message,
        data:    result
    });
});

// ─── GET /api/v1/kyc/identity/status ──────────────────────────────────────────
const getIdentityStatus = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const result = await identityCollectionService.getIdentityStatus(userId);

    return res.status(200).json({
        success: true,
        data:    result
    });
});

module.exports = {
    captureAadhaar,
    captureEkycResponse,
    capturePan,
    uploadPanCard,
    uploadAadhaarCard,
    getIdentityStatus
};
