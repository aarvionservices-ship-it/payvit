/**
 * faceVerification.controller.js
 *
 * REST Controller for Module 3: Face and Liveness Verification
 */

const asyncHandler            = require("../../../middlewares/asyncHandler");
const faceVerificationService = require("../service/faceVerification.service");

// ─── POST /api/v1/kyc/face/capture-selfie ─────────────────────────────────────
// Body: { image, mimeType }
const captureSelfie = asyncHandler(async (req, res) => {
    const { image, mimeType } = req.body;
    const userId              = req.user.userId;
    const ipAddress           = req.ip;

    const result = await faceVerificationService.captureSelfie(userId, image, mimeType, ipAddress);

    return res.status(201).json({
        success: true,
        message: result.message,
        data:    result
    });
});

// ─── POST /api/v1/kyc/face/liveness-check ─────────────────────────────────────
// Body: { image, mimeType, type: "passive"|"active", challengeType }
const detectLiveness = asyncHandler(async (req, res) => {
    const { image, mimeType, type, challengeType } = req.body;
    const userId    = req.user.userId;
    const ipAddress = req.ip;

    const result = await faceVerificationService.detectLiveness(
        image,
        mimeType,
        { type, challengeType, userId },
        ipAddress
    );

    return res.status(200).json({
        success: true,
        message: result.passed ? "Liveness check passed." : "Liveness check failed.",
        data:    result
    });
});

// ─── GET /api/v1/kyc/face/active-challenge ────────────────────────────────────
const getActiveChallenge = asyncHandler(async (req, res) => {
    const result = faceVerificationService.generateActiveChallenge();

    return res.status(200).json({
        success: true,
        message: "Active challenge generated.",
        data:    result
    });
});

// ─── POST /api/v1/kyc/face/verify-active-challenge ────────────────────────────
// Body: { challengeId, image, mimeType }
const verifyActiveChallenge = asyncHandler(async (req, res) => {
    const { challengeId, image, mimeType } = req.body;
    const userId    = req.user.userId;
    const ipAddress = req.ip;

    const result = await faceVerificationService.verifyActiveChallenge(
        challengeId,
        image,
        mimeType,
        userId,
        ipAddress
    );

    return res.status(200).json({
        success: true,
        message: result.passed ? "Active challenge completed." : "Active challenge failed.",
        data:    result
    });
});

// ─── POST /api/v1/kyc/face/anti-spoof ─────────────────────────────────────────
// Body: { image, mimeType }
const checkAntiSpoof = asyncHandler(async (req, res) => {
    const { image, mimeType } = req.body;
    const userId    = req.user.userId;
    const ipAddress = req.ip;

    const result = await faceVerificationService.checkAntiSpoof(image, mimeType, userId, ipAddress);

    return res.status(200).json({
        success: true,
        message: result.passed ? "Anti-spoof check passed." : "Spoof attempt detected.",
        data:    result
    });
});

// ─── POST /api/v1/kyc/face/match ──────────────────────────────────────────────
// Body: { selfieImage, selfieMime, documentImage, documentMime, threshold }
const matchFaces = asyncHandler(async (req, res) => {
    const { selfieImage, selfieMime, documentImage, documentMime, threshold } = req.body;
    const userId    = req.user.userId;
    const ipAddress = req.ip;

    const result = await faceVerificationService.matchFaces(
        selfieImage,
        selfieMime,
        documentImage,
        documentMime,
        { threshold, userId },
        ipAddress
    );

    return res.status(200).json({
        success: true,
        message: result.isMatch ? "Face match verified." : "Face match failed.",
        data:    result
    });
});

// ─── POST /api/v1/kyc/face/verify ─────────────────────────────────────────────
// Body: { selfieImage, selfieMime, documentImage, documentMime, challengeId, threshold }
const verifyFullFace = asyncHandler(async (req, res) => {
    const userId    = req.user.userId;
    const ipAddress = req.ip;

    const result = await faceVerificationService.verifyFullFacePipeline(userId, req.body, ipAddress);

    return res.status(200).json({
        success: true,
        message: result.verified ? "Face & Liveness verification passed." : "Face & Liveness verification failed.",
        data:    result
    });
});

module.exports = {
    captureSelfie,
    detectLiveness,
    getActiveChallenge,
    verifyActiveChallenge,
    checkAntiSpoof,
    matchFaces,
    verifyFullFace
};
