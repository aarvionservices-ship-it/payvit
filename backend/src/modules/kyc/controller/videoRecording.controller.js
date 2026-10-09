/**
 * videoRecording.controller.js
 *
 * REST controller for the VIDEO_RECORDING stage of Video KYC.
 *
 * Routes (all under /api/v1/kyc/video):
 *   POST /upload-video      — Upload 20-second video for voice+face consistency check
 *   GET  /recording/:sessionId/metadata — Get stored recording metadata (no raw video)
 */

const asyncHandler           = require("../../../middlewares/asyncHandler");
const AppError               = require("../../../core/utils/AppError");
const videoRecordingService  = require("../service/videoRecording.service");

// ─── POST /api/v1/kyc/video/upload-video ─────────────────────────────────────
// Auth:     Bearer JWT
// Body:     {
//             sessionId:       string,
//             video:           string,   ← raw base64 (no "data:video/..." prefix)
//             mimeType:        string,   ← "video/webm" | "video/mp4"
//             durationSeconds: number    ← client-reported duration (must be ≥ 20)
//           }
// Response: { success, data: { agentMessage, stage, videoData } }
const uploadVideo = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const ip     = req.ip;
    const { sessionId, video, mimeType, durationSeconds } = req.body;

    if (!sessionId)        throw new AppError("sessionId is required.", 400);
    if (!video)            throw new AppError("video (base64) is required.", 400);
    if (!durationSeconds && durationSeconds !== 0) {
        throw new AppError("durationSeconds is required.", 400);
    }

    const parsedDuration = Number(durationSeconds);
    if (isNaN(parsedDuration) || parsedDuration < 0) {
        throw new AppError("durationSeconds must be a positive number.", 400);
    }

    // Strip data URI prefix if client accidentally included it
    const cleanedVideo = video.replace(/^data:video\/[a-z0-9]+;base64,/, "");
    const cleanedMime  = mimeType || "video/webm";

    const result = await videoRecordingService.processVideoRecording(
        sessionId,
        userId,
        cleanedVideo,
        cleanedMime,
        parsedDuration,
        ip
    );

    return res.status(200).json({ success: true, data: result });
});

// ─── GET /api/v1/kyc/video/recording/:sessionId/metadata ──────────────────────
// Auth:     Bearer JWT
// Response: { success, data: { storageKey, sha256Hash, durationSeconds, recordedAt, encrypted } }
const getRecordingMetadata = asyncHandler(async (req, res) => {
    const userId        = req.user.userId;
    const { sessionId } = req.params;

    const result = await videoRecordingService.getRecordingMetadata(sessionId, userId);
    return res.status(200).json({ success: true, data: result });
});

module.exports = {
    uploadVideo,
    getRecordingMetadata
};
