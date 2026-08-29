/**
 * videoKycLive.service.js
 *
 * Real-time Video KYC orchestrator for the Socket.io layer.
 *
 * Responsibilities:
 *   - Wraps the existing videoKyc.service.js (all KYC business logic lives there)
 *   - Adds streaming Gemini responses (token-by-token via chatStream)
 *   - Manages in-memory socket→session mapping
 *   - Extends session TTL on user activity (keepalive)
 *   - Exposes clean, socket-friendly methods consumed by videoKycSocket.handler.js
 *
 * Session keepalive strategy:
 *   Every user event renews expiresAt by +30 min.
 *   This means sessions stay alive as long as the user is active —
 *   solving the "not limited to 3-4 hours" requirement.
 */

const VideoKycSession  = require("../model/VideoKycSession.model");
const videoKycService  = require("./videoKyc.service");
const agent            = require("./videoKycAgent.service");
const AppError         = require("../../../core/utils/AppError");
const config           = require("../../../core/config/env.config");

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_TTL_MS    = config.videoKyc.sessionTtlMs;   // default 30 min
const KEEPALIVE_EXTEND  = SESSION_TTL_MS;                  // extend by same amount

// ─── In-memory socket tracking ────────────────────────────────────────────────
// Maps socketId → { sessionId, userId }
// Used to clean up on disconnect without needing a DB query.

const socketSessionMap = new Map();

// ─── Service ──────────────────────────────────────────────────────────────────

class VideoKycLiveService {

    // ─── 1. Join / Resume Session ─────────────────────────────────────────────

    /**
     * Called when a socket emits `join_session`.
     * Validates the sessionId, loads state, registers the socket.
     *
     * @param {string} socketId
     * @param {string} sessionId
     * @param {string} userId
     * @returns {Promise<object>}  Safe session snapshot for the client
     */
    async joinSession(socketId, sessionId, userId) {
        const session = await this._getSession(sessionId, userId);
        await this._extendSession(session);

        // Track socket ↔ session mapping in memory
        socketSessionMap.set(socketId, { sessionId, userId });

        return this._safeSnapshot(session);
    }

    // ─── 2. Process a Text Message (streaming) ────────────────────────────────

    /**
     * Processes a user's text message.
     * Delegates KYC logic to videoKyc.service.js.
     * For the WELCOME stage, streams the agent reply token-by-token.
     *
     * @param {string} sessionId
     * @param {string} userId
     * @param {string} message
     * @param {string} ipAddress
     * @param {Function} onChunk   - (chunk: string) => void   called per token
     * @returns {Promise<{ agentMessage, stage, done, nextAction }>}
     */
    async processMessage(sessionId, userId, message, ipAddress, onChunk) {
        // Load session for current stage + history
        const session = await this._getSession(sessionId, userId);
        await this._extendSession(session);

        const stage     = session.stage;
        const questions = session.questions || [];

        // ── QUESTIONS stage: server validates the answer — no streaming ─────────
        // The answer is validated server-side (correct/wrong). Streaming here
        // could deliver a "Correct!" message even if the answer is wrong.
        // Delegate directly to the authoritative service.
        if (stage === "QUESTIONS") {
            return videoKycService.chat(sessionId, userId, message, ipAddress);
        }

        // ── OTP_SENT / COMPLETE: no Gemini call needed ────────────────────────
        if (stage === "OTP_SENT" || stage === "COMPLETE") {
            return videoKycService.chat(sessionId, userId, message, ipAddress);
        }

        // ── Conversational stages: stream Gemini reply for live-call feel ──────
        // We stream the reply token-by-token so the client sees the agent
        // "typing" in real time.  The full reply is assembled from the stream
        // and we then call videoKycService.chat() ONLY for its DB write / stage
        // transition — we skip the Gemini call inside that service by calling
        // it in mock mode? No — we just accept the extra call for correctness.
        //
        // Trade-off: 2 Gemini calls per conversational message:
        //   Call 1 — streaming, for UX (chunks emitted to client)
        //   Call 2 — non-streaming inside videoKycService.chat(), for DB write
        // Both calls use the same prompt so replies are effectively equivalent.
        // The client renders the streamed version; the DB stores the service version.
        const history = (session.agentLog || []).slice(-10);

        // Determine the stream stage context (WELCOME advances to PAN_CAPTURE)
        const streamStage = stage === "WELCOME" ? "PAN_CAPTURE" : stage;

        let streamedAnyChunk = false;

        try {
            const stream = agent.chatStream(history, message, streamStage, questions);
            for await (const chunk of stream) {
                streamedAnyChunk = true;
                if (onChunk) onChunk(chunk);
            }
        } catch (streamErr) {
            // If the stream itself throws (e.g. invalid API key), log and continue
            // — videoKycService.chat() below will throw its own error if needed.
            console.error("[VideoKYC Live] Stream error (proceeding to authoritative call):", streamErr.message);
        }

        // Always call the authoritative service — it owns DB + state machine
        const result = await videoKycService.chat(sessionId, userId, message, ipAddress);

        // If we never managed to stream anything (e.g. stream failed silently),
        // emit the full reply as a single chunk so the client still gets text.
        if (!streamedAnyChunk && result.agentMessage && onChunk) {
            onChunk(result.agentMessage);
        }

        return result;
    }

    // ─── 3. Process a Webcam Frame ────────────────────────────────────────────

    /**
     * Accepts a base64 frame from the live webcam and runs OCR / liveness.
     * Delegates entirely to videoKyc.service.uploadImage().
     *
     * @param {string} sessionId
     * @param {string} userId
     * @param {string} base64Image   - Raw base64 (no data URI prefix)
     * @param {string} mimeType      - e.g. "image/jpeg"
     * @param {"pan_ocr"|"liveness"} task
     * @param {string} ipAddress
     * @returns {Promise<{ agentMessage, stage, extractedData }>}
     */
    async processFrame(sessionId, userId, base64Image, mimeType, task, ipAddress) {
        const session = await this._getSession(sessionId, userId);
        await this._extendSession(session);

        // Strip data URI prefix if the client accidentally included it
        const cleanedImage = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
        const cleanedMime  = mimeType || "image/jpeg";

        const result = await videoKycService.uploadImage(
            sessionId, userId, cleanedImage, cleanedMime, task, ipAddress
        );

        return result;
    }

    // ─── 4. Verify OTP ────────────────────────────────────────────────────────

    /**
     * @param {string} sessionId
     * @param {string} userId
     * @param {string} otp
     * @param {string} ipAddress
     * @returns {Promise<{ agentMessage, stage, done }>}
     */
    async verifyOtp(sessionId, userId, otp, ipAddress) {
        const session = await this._getSession(sessionId, userId);
        await this._extendSession(session);
        return videoKycService.verifyOtp(sessionId, userId, otp, ipAddress);
    }

    // ─── 5. Resend OTP ────────────────────────────────────────────────────────

    /**
     * @param {string} sessionId
     * @param {string} userId
     * @param {string} ipAddress
     * @returns {Promise<{ agentMessage }>}
     */
    async resendOtp(sessionId, userId, ipAddress) {
        const session = await this._getSession(sessionId, userId);
        await this._extendSession(session);
        return videoKycService.resendOtp(sessionId, userId, ipAddress);
    }

    // ─── 6. Get Session ───────────────────────────────────────────────────────

    /**
     * @param {string} sessionId
     * @param {string} userId
     * @returns {Promise<object>}
     */
    async getSession(sessionId, userId) {
        const session = await this._getSession(sessionId, userId);
        // Extend session TTL so ping_session / get_session heartbeats keep
        // the session alive while the user is still on the call.
        await this._extendSession(session);
        return this._safeSnapshot(session);
    }

    // ─── 7. Cleanup on Disconnect ─────────────────────────────────────────────

    /**
     * Removes socket from the in-memory map when the socket disconnects.
     * Does NOT expire the KYC session — the user may reconnect.
     *
     * @param {string} socketId
     */
    onDisconnect(socketId) {
        socketSessionMap.delete(socketId);
    }

    /**
     * Looks up session+userId for a given socketId (for disconnect logging).
     *
     * @param {string} socketId
     * @returns {{ sessionId, userId } | undefined}
     */
    getSocketMeta(socketId) {
        return socketSessionMap.get(socketId);
    }

    // ─── 8. Start a new session ───────────────────────────────────────────────

    /**
     * Thin proxy to videoKycService.startSession.
     * Useful when the client wants to start a session over the socket.
     *
     * @param {string} userId
     * @returns {Promise<{ sessionId, stage, agentMessage }>}
     */
    async startSession(userId) {
        return videoKycService.startSession(userId);
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Loads the session doc and validates ownership + status.
     */
    async _getSession(sessionId, userId) {
        const session = await VideoKycSession.findOne({ sessionId });
        if (!session) throw new AppError("Video KYC session not found.", 404);
        if (session.userId !== userId) throw new AppError("Unauthorized session access.", 403);

        if (session.status === "verified") throw new AppError("This session is already complete.", 400);
        if (session.status === "failed")   throw new AppError("This session has failed. Please start a new KYC session.", 400);
        if (session.status === "expired")  throw new AppError("Session has expired. Please start a new KYC session.", 400);

        return session;
    }

    /**
     * Extends the session's MongoDB expiry by KEEPALIVE_EXTEND milliseconds.
     * This keeps the session alive as long as the user is active over the socket.
     *
     * @param {import("mongoose").Document} session  - Loaded session document
     */
    async _extendSession(session) {
        const newExpiry = new Date(Date.now() + KEEPALIVE_EXTEND);
        // Only extend if the new expiry is further than current — prevents regression
        if (!session.expiresAt || newExpiry > session.expiresAt) {
            session.expiresAt = newExpiry;
            await session.save();
        }
    }

    /**
     * Returns a safe (no secrets) snapshot of session state for the client.
     */
    _safeSnapshot(session) {
        return {
            sessionId:         session.sessionId,
            stage:             session.stage,
            status:            session.status,
            steps:             session.steps,
            questions:         session.questions?.map(q => ({ id: q.id, question: q.question })),
            panLast4:          session.panLast4,
            nameOnPAN:         session.nameOnPAN,
            livenessVerified:  session.livenessVerified,
            questionsAnswered: session.questionsAnswered,
            agentLog:          session.agentLog,
            startedAt:         session.startedAt,
            expiresAt:         session.expiresAt,
            completedAt:       session.completedAt
        };
    }
}

module.exports = new VideoKycLiveService();
