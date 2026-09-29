/**
 * videoRecording.service.js
 *
 * Handles the VIDEO_RECORDING stage of Video KYC:
 *   1. Accept a base64-encoded video blob from the client.
 *   2. Enforce minimum 20-second duration.
 *   3. Compute SHA-256 integrity hash.
 *   4. Encrypt the video with AES-256-GCM and store securely (GridFS / local FS).
 *   5. Run Gemini Vision / Audio analysis for:
 *        a) Voice consistency  – does the spoken identity match the user record?
 *        b) Face consistency   – is the same face visible throughout the video?
 *   6. Advance session stage to QUESTIONS on success.
 *
 * Storage strategy (configurable via env):
 *   VIDEO_KYC_STORAGE=gridfs  → stores in MongoDB GridFS  (default)
 *   VIDEO_KYC_STORAGE=local   → stores under /uploads/video-kyc/  (dev/test)
 *
 * Encryption:
 *   AES-256-GCM with a random 96-bit IV; key is derived from
 *   VIDEO_KYC_ENCRYPTION_KEY env var (must be a 64-char hex string = 32 bytes).
 *   The IV and auth-tag are prepended to the ciphertext before storage.
 */

const crypto   = require("crypto");
const fs       = require("fs");
const path     = require("path");
const mongoose = require("mongoose");

const VideoKycSession = require("../model/VideoKycSession.model");
const AppError        = require("../../../core/utils/AppError");
const auditService    = require("../../../core/audit/audit.service");
const agent           = require("./videoKycAgent.service");

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_DURATION_SECONDS = 20;          // enforce ≥ 20-second video
const MAX_DURATION_SECONDS = 120;         // cap at 2 minutes
const MAX_SIZE_BYTES       = 150 * 1024 * 1024; // 150 MB upper limit
const STORAGE_BACKEND      = process.env.VIDEO_KYC_STORAGE || "local";
const LOCAL_UPLOAD_DIR     = path.resolve("uploads", "video-kyc");
const ENCRYPTION_KEY_HEX   = process.env.VIDEO_KYC_ENCRYPTION_KEY || null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute SHA-256 hash of a Buffer, returned as hex string.
 */
function sha256(buffer) {
    return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Encrypt a buffer with AES-256-GCM.
 * Returns a single Buffer: [iv(12)] + [authTag(16)] + [ciphertext]
 * Returns null if no encryption key is configured (dev/test mode).
 */
function encryptBuffer(plainBuffer) {
    if (!ENCRYPTION_KEY_HEX) return null;   // encryption disabled in dev

    const key    = Buffer.from(ENCRYPTION_KEY_HEX, "hex");
    const iv     = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
    const authTag   = cipher.getAuthTag();   // 16 bytes

    return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Persist the (optionally encrypted) video buffer.
 * Supports "local" and "gridfs" backends.
 *
 * @param {Buffer}  buffer
 * @param {string}  sessionId
 * @param {string}  mimeType
 * @returns {{ storageKey: string, encryptionKeyId: string|null }}
 */
async function storeVideo(buffer, sessionId, mimeType) {
    const payloadToStore = ENCRYPTION_KEY_HEX ? encryptBuffer(buffer) : buffer;
    const ext            = mimeType.includes("mp4") ? "mp4" : "webm";
    const objectKey      = `vkyc_${sessionId}_${Date.now()}.${ext}`;

    if (STORAGE_BACKEND === "gridfs") {
        // ── GridFS storage ──────────────────────────────────────────────────
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: "videoKycRecordings"
        });

        await new Promise((resolve, reject) => {
            const uploadStream = bucket.openUploadStream(objectKey, {
                metadata: {
                    sessionId,
                    mimeType,
                    encrypted: !!ENCRYPTION_KEY_HEX,
                    storedAt:  new Date().toISOString()
                }
            });
            uploadStream.on("error", reject);
            uploadStream.on("finish", resolve);
            uploadStream.end(payloadToStore);
        });
    } else {
        // ── Local FS storage (dev / test) ───────────────────────────────────
        if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
            fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
        }
        const filePath = path.join(LOCAL_UPLOAD_DIR, objectKey);
        fs.writeFileSync(filePath, payloadToStore);
    }

    return {
        storageKey:      objectKey,
        encryptionKeyId: ENCRYPTION_KEY_HEX ? "VIDEO_KYC_ENCRYPTION_KEY" : null
    };
}

// ─── Main Service ─────────────────────────────────────────────────────────────

class VideoRecordingService {

    /**
     * Upload and process a 20-second video recording.
     *
     * @param {string} sessionId
     * @param {string} userId
     * @param {string} base64Video      - Raw base64 video (no data URI prefix)
     * @param {string} mimeType         - e.g. "video/webm" | "video/mp4"
     * @param {number} durationSeconds  - Client-reported duration (we enforce ≥ 20)
     * @param {string} ipAddress
     * @returns {{ agentMessage: string, stage: string, videoData: object }}
     */
    async processVideoRecording(sessionId, userId, base64Video, mimeType, durationSeconds, ipAddress) {

        // ── 1. Load and guard session ────────────────────────────────────────
        const session = await this._getActiveSession(sessionId, userId);

        if (session.stage !== "VIDEO_RECORDING") {
            throw new AppError(
                `Video upload is only valid at the VIDEO_RECORDING stage. Current stage: ${session.stage}.`,
                400
            );
        }

        // ── 2. Decode base64 → Buffer ────────────────────────────────────────
        if (!base64Video) throw new AppError("Video data (base64) is required.", 400);

        // Strip data URI prefix if present
        const cleanedBase64 = base64Video.replace(/^data:video\/[a-z0-9]+;base64,/, "");
        const videoBuffer   = Buffer.from(cleanedBase64, "base64");

        // ── 3. Validate size ─────────────────────────────────────────────────
        if (videoBuffer.length > MAX_SIZE_BYTES) {
            throw new AppError(
                `Video file too large. Maximum allowed is ${MAX_SIZE_BYTES / (1024 * 1024)} MB.`,
                400
            );
        }

        // ── 4. Enforce minimum 20-second duration ────────────────────────────
        const reportedDuration = Number(durationSeconds) || 0;

        if (reportedDuration < MIN_DURATION_SECONDS) {
            const msg = `Video must be at least ${MIN_DURATION_SECONDS} seconds long. ` +
                        `Received: ${reportedDuration.toFixed(1)}s. ` +
                        `Please record a full ${MIN_DURATION_SECONDS}-second video and try again.`;

            session.agentLog.push({
                role:      "agent",
                message:   msg,
                stage:     "VIDEO_RECORDING",
                timestamp: new Date()
            });
            await session.save();

            return {
                agentMessage: msg,
                stage:        "VIDEO_RECORDING",
                videoData:    null
            };
        }

        if (reportedDuration > MAX_DURATION_SECONDS) {
            throw new AppError(
                `Video duration exceeds the ${MAX_DURATION_SECONDS}-second maximum. Please record a shorter clip.`,
                400
            );
        }

        // ── 5. Compute SHA-256 integrity hash ────────────────────────────────
        const integrityHash = sha256(videoBuffer);

        // ── 6. Secure storage (encrypt + persist) ────────────────────────────
        const cleanedMime = mimeType || "video/webm";
        const { storageKey, encryptionKeyId } = await storeVideo(videoBuffer, sessionId, cleanedMime);

        // ── 7. AI Voice Consistency Analysis ─────────────────────────────────
        //  We send the first frame as a still image + instruct the agent
        //  to evaluate voice and face consistency from the video metadata.
        //  (Full audio transcription requires a speech-to-text provider;
        //   here we use Gemini's multimodal capabilities via a frame + prompt.)
        const voiceResult = await this._analyseVoiceConsistency(
            cleanedBase64, cleanedMime, session, userId
        );

        if (!voiceResult.passed) {
            const msg = `Voice consistency check failed: ${voiceResult.details || "Voice did not match expected identity patterns."}. ` +
                        `Please re-record the video and clearly state your full name, date of birth, and the last 4 digits of your mobile number.`;

            session.agentLog.push({
                role:      "agent",
                message:   msg,
                stage:     "VIDEO_RECORDING",
                timestamp: new Date()
            });
            await session.save();

            await auditService.log(
                "VIDEO_KYC_VOICE_FAILED",
                userId,
                "VideoKycSession",
                sessionId,
                { reason: voiceResult.details },
                ipAddress
            );

            return {
                agentMessage: msg,
                stage:        "VIDEO_RECORDING",
                videoData:    null
            };
        }

        // ── 8. AI Face Consistency Analysis ──────────────────────────────────
        const faceResult = await this._analyseFaceConsistency(cleanedBase64, cleanedMime, session);

        if (!faceResult.passed) {
            const msg = `Face consistency check failed: ${faceResult.details || "Face not consistently visible throughout the video."}. ` +
                        `Please ensure your face is clearly visible throughout the recording.`;

            session.agentLog.push({
                role:      "agent",
                message:   msg,
                stage:     "VIDEO_RECORDING",
                timestamp: new Date()
            });
            await session.save();

            await auditService.log(
                "VIDEO_KYC_FACE_CONSISTENCY_FAILED",
                userId,
                "VideoKycSession",
                sessionId,
                { reason: faceResult.details },
                ipAddress
            );

            return {
                agentMessage: msg,
                stage:        "VIDEO_RECORDING",
                videoData:    null
            };
        }

        // ── 9. Persist all results to session ────────────────────────────────
        const now = new Date();

        session.videoRecording = {
            recorded:        true,
            storageKey,
            secureUrl:       `/api/v1/kyc/video/recording/${sessionId}`,
            durationSeconds: reportedDuration,
            recordedAt:      now,
            sizeBytes:       videoBuffer.length,
            sha256Hash:      integrityHash,
            mimeType:        cleanedMime,
            encryptionKeyId
        };

        session.voiceConsistency = {
            passed:          true,
            confidenceScore: voiceResult.confidenceScore,
            transcribedText: voiceResult.transcribedText,
            checkedAt:       now,
            details:         voiceResult.details
        };

        // Mark step complete and advance stage
        session.steps.videoRecording.status      = "completed";
        session.steps.videoRecording.completedAt = now;

        const firstQuestion = session.questions[0];
        const agentMessage  =
            `✅ Video recording verified! ` +
            `Duration: ${reportedDuration.toFixed(1)}s | ` +
            `Voice consistency: passed ✓ | Face consistency: passed ✓\n\n` +
            `Now I need to verify your identity with a couple of security questions. ${firstQuestion?.question || "Please stand by."}`;

        session.stage = "QUESTIONS";
        session.agentLog.push({
            role:      "agent",
            message:   agentMessage,
            stage:     "QUESTIONS",
            timestamp: now
        });
        await session.save();

        // ── 10. Audit trail ───────────────────────────────────────────────────
        await auditService.log(
            "VIDEO_KYC_RECORDING_STORED",
            userId,
            "VideoKycSession",
            sessionId,
            {
                storageKey,
                durationSeconds: reportedDuration,
                sizeBytes:       videoBuffer.length,
                sha256Hash:      integrityHash,
                encrypted:       !!encryptionKeyId,
                voicePassed:     true,
                facePassed:      true
            },
            ipAddress
        );

        return {
            agentMessage,
            stage:     "QUESTIONS",
            videoData: {
                recorded:        true,
                durationSeconds: reportedDuration,
                sha256Hash:      integrityHash,
                voiceConsistency: {
                    passed:          true,
                    confidenceScore: voiceResult.confidenceScore
                },
                faceConsistency: {
                    passed:  true,
                    details: faceResult.details
                }
            }
        };
    }

    /**
     * Retrieve secure metadata for a stored recording (no raw video returned over API).
     *
     * @param {string} sessionId
     * @param {string} userId
     * @returns {{ storageKey, sha256Hash, durationSeconds, recordedAt, encrypted }}
     */
    async getRecordingMetadata(sessionId, userId) {
        const session = await VideoKycSession.findOne({ sessionId }).lean();
        if (!session)                    throw new AppError("Session not found.", 404);
        if (session.userId !== userId)   throw new AppError("Unauthorized.", 403);
        if (!session.videoRecording?.recorded) {
            throw new AppError("No video recording found for this session.", 404);
        }

        const vr = session.videoRecording;
        return {
            storageKey:      vr.storageKey,
            sha256Hash:      vr.sha256Hash,
            durationSeconds: vr.durationSeconds,
            recordedAt:      vr.recordedAt,
            sizeBytes:       vr.sizeBytes,
            mimeType:        vr.mimeType,
            encrypted:       !!vr.encryptionKeyId
        };
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Validate session ownership, status, and expiry.
     */
    async _getActiveSession(sessionId, userId) {
        const session = await VideoKycSession.findOne({ sessionId });
        if (!session) throw new AppError("Video KYC session not found.", 404);
        if (session.userId !== userId) throw new AppError("Unauthorized session access.", 403);

        if (session.status === "expired")  throw new AppError("Session has expired. Please start a new KYC session.", 400);
        if (session.status === "verified") throw new AppError("This session is already complete.", 400);
        if (session.status === "failed")   throw new AppError("This session has failed. Please start a new KYC session.", 400);

        if (new Date() > session.expiresAt) {
            session.status = "expired";
            await session.save();
            throw new AppError("Session has expired. Please start a new KYC session.", 400);
        }

        return session;
    }

    /**
     * Use Gemini multimodal to check voice consistency.
     * Sends the base64 video + a structured prompt instructing the model
     * to verify the speaker's identity matches the session user metadata.
     *
     * In MOCK mode (VIDEO_KYC_MOCK_MODE !== "false"), returns a passing result.
     *
     * @returns {{ passed, confidenceScore, transcribedText, details }}
     */
    async _analyseVoiceConsistency(base64Video, mimeType, session, userId) {
        const isMock = process.env.VIDEO_KYC_MOCK_MODE !== "false";

        if (isMock) {
            return {
                passed:          true,
                confidenceScore: 0.95,
                transcribedText: "[MOCK] Voice analysis skipped in mock mode.",
                details:         "Mock mode — voice consistency assumed passed."
            };
        }

        try {
            // Delegate to the agent service which wraps Gemini Vision
            const result = await agent.analyseVideoVoice(base64Video, mimeType, {
                expectedName:  session.nameOnPAN,
                sessionId:     session.sessionId,
                minDuration:   MIN_DURATION_SECONDS
            });

            return {
                passed:          result.passed ?? false,
                confidenceScore: result.confidenceScore ?? 0,
                transcribedText: result.transcribedText ?? null,
                details:         result.details ?? null
            };
        } catch (err) {
            console.error("[VideoRecording] Voice analysis error:", err.message);
            // Fail safe — reject if the AI call itself fails in production
            return {
                passed:          false,
                confidenceScore: 0,
                transcribedText: null,
                details:         `AI voice analysis unavailable: ${err.message}`
            };
        }
    }

    /**
     * Check face consistency throughout the video.
     * Uses the Gemini agent to verify the same face appears consistently.
     *
     * @returns {{ passed, details }}
     */
    async _analyseFaceConsistency(base64Video, mimeType, session) {
        const isMock = process.env.VIDEO_KYC_MOCK_MODE !== "false";

        if (isMock) {
            return {
                passed:  true,
                details: "Mock mode — face consistency assumed passed."
            };
        }

        try {
            const result = await agent.analyseVideoFace(base64Video, mimeType, {
                nameOnPAN: session.nameOnPAN,
                panLast4:  session.panLast4
            });

            return {
                passed:  result.passed ?? false,
                details: result.details ?? null
            };
        } catch (err) {
            console.error("[VideoRecording] Face consistency analysis error:", err.message);
            return {
                passed:  false,
                details: `AI face analysis unavailable: ${err.message}`
            };
        }
    }
}

module.exports = new VideoRecordingService();
