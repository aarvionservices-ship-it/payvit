/**
 * videoKycSocket.handler.js
 *
 * Registers all Socket.io event listeners for the /video-kyc namespace.
 *
 * Authentication:
 *   JWT is verified during the handshake (middleware) — no need to pass
 *   tokens on every event.
 *
 * ─── Events (client → server) ────────────────────────────────────────────────
 *   join_session   { sessionId }                     — join / resume a session
 *   start_session  {}                                — create a brand new session
 *   send_message   { sessionId, message }            — text message to agent
 *   send_frame     { sessionId, image, mimeType, task } — webcam frame capture
 *   verify_otp     { sessionId, otp }                — submit 6-digit OTP
 *   resend_otp     { sessionId }                     — resend OTP
 *   get_session    { sessionId }                     — re-hydrate state
 *   ping_session   { sessionId }                     — keepalive heartbeat
 *
 * ─── Events (server → client) ────────────────────────────────────────────────
 *   session_started  { sessionId, stage, agentMessage }   — new session created
 *   session_joined   { sessionId, stage, status, ... }    — joined existing session
 *   agent_typing     {}                                    — agent is generating
 *   agent_chunk      { chunk }                             — streaming token
 *   agent_message    { agentMessage, stage, done, nextAction } — full reply
 *   stage_change     { stage, nextAction }                 — stage advanced
 *   frame_result     { agentMessage, stage, extractedData } — OCR/liveness done
 *   otp_verified     { agentMessage, stage, done }         — KYC complete
 *   session_error    { code, message }                     — error detail
 *   session_expired  {}                                    — session timed out
 *   pong_session     { expiresAt }                         — keepalive response
 */

const jwt                    = require("jsonwebtoken");
const liveService            = require("../service/videoKycLive.service");
const videoRecordingService  = require("../service/videoRecording.service");
const { createSocketRateLimiter } = require("../../../core/socket/socketRateLimiter");

// ─── Namespace Registration ───────────────────────────────────────────────────

/**
 * Registers the /video-kyc Socket.io namespace on the given io instance.
 * Call once from server.js after initSocketServer().
 *
 * @param {import("socket.io").Server} io
 */
function registerVideoKycNamespace(io) {
    const ns = io.of("/video-kyc");

    // ── JWT Auth Middleware (runs on every new connection) ───────────────────
    ns.use((socket, next) => {
        try {
            // Accept token from handshake auth OR as a query param
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.query?.token;

            if (!token) {
                return next(new Error("AUTH_MISSING: No token provided"));
            }

            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            socket.user = decoded;   // attach decoded payload for later use
            next();
        } catch (err) {
            next(new Error("AUTH_INVALID: " + err.message));
        }
    });

    // ── Connection Handler ───────────────────────────────────────────────────
    ns.on("connection", (socket) => {
        const userId = socket.user?.userId;
        const ip     = socket.handshake.address;

        // One rate-limiter instance per connection
        const limiter = createSocketRateLimiter();

        console.log(`[VideoKYC Socket] Connected  | socket=${socket.id} | user=${userId}`);

        // ── join_session ─────────────────────────────────────────────────────
        socket.on("join_session", async ({ sessionId } = {}) => {
            try {
                if (!limiter.allow("session")) {
                    return _emitError(socket, "RATE_LIMITED", "Too many requests. Please slow down.");
                }
                if (!sessionId) return _emitError(socket, "MISSING_SESSION_ID", "sessionId is required.");

                // Put socket in a room named after the session
                socket.join(sessionId);

                const snapshot = await liveService.joinSession(socket.id, sessionId, userId);
                socket.emit("session_joined", snapshot);

                console.log(`[VideoKYC Socket] Joined     | socket=${socket.id} | session=${sessionId} | stage=${snapshot.stage}`);
            } catch (err) {
                _handleError(socket, err);
            }
        });

        // ── start_session ────────────────────────────────────────────────────
        socket.on("start_session", async () => {
            try {
                if (!limiter.allow("session")) {
                    return _emitError(socket, "RATE_LIMITED", "Too many requests. Please slow down.");
                }
                const result = await liveService.startSession(userId);
                socket.join(result.sessionId);
                socket.emit("session_started", result);

                console.log(`[VideoKYC Socket] Started    | socket=${socket.id} | session=${result.sessionId}`);
            } catch (err) {
                _handleError(socket, err);
            }
        });

        // ── send_message ──────────────────────────────────────────────────────
        socket.on("send_message", async ({ sessionId, message } = {}) => {
            try {
                if (!limiter.allow("message")) {
                    return _emitError(socket, "RATE_LIMITED", "Sending too fast — please wait a moment.");
                }
                if (!sessionId) return _emitError(socket, "MISSING_SESSION_ID", "sessionId is required.");
                if (!message || typeof message !== "string" || !message.trim()) {
                    return _emitError(socket, "MISSING_MESSAGE", "message is required.");
                }

                // Signal that the agent is thinking
                socket.emit("agent_typing", {});

                // Stream response chunks back to this socket
                const result = await liveService.processMessage(
                    sessionId,
                    userId,
                    message.trim(),
                    ip,
                    (chunk) => {
                        socket.emit("agent_chunk", { chunk });
                    }
                );

                // Emit the final assembled message + any stage advancement
                socket.emit("agent_message", {
                    agentMessage: result.agentMessage,
                    stage:        result.stage,
                    done:         result.done,
                    nextAction:   result.nextAction
                });

                // If stage changed, broadcast to all sockets in the session room
                // (useful if multiple browser tabs are open)
                if (result.stage) {
                    socket.to(sessionId).emit("stage_change", {
                        stage:      result.stage,
                        nextAction: result.nextAction
                    });
                }
            } catch (err) {
                _handleError(socket, err);
            }
        });

        // ── send_frame ────────────────────────────────────────────────────────
        socket.on("send_frame", async ({ sessionId, image, mimeType, task } = {}) => {
            try {
                if (!limiter.allow("message")) {
                    return _emitError(socket, "RATE_LIMITED", "Sending frames too fast — please wait a moment.");
                }
                if (!sessionId) return _emitError(socket, "MISSING_SESSION_ID", "sessionId is required.");
                if (!image)     return _emitError(socket, "MISSING_IMAGE", "image (base64) is required.");
                const validTasks = ["pan_ocr", "liveness", "face_match", "anti_spoof"];
                if (!task)      return _emitError(socket, "MISSING_TASK", `task is required: ${validTasks.join(", ")}.`);

                if (!validTasks.includes(task)) {
                    return _emitError(socket, "INVALID_TASK", `task must be one of: ${validTasks.join(", ")}.`);
                }

                socket.emit("agent_typing", {});

                const result = await liveService.processFrame(
                    sessionId, userId, image, mimeType, task, ip
                );

                socket.emit("frame_result", {
                    agentMessage:  result.agentMessage,
                    stage:         result.stage,
                    extractedData: result.extractedData
                });

                // Broadcast stage change to other sockets in the room
                if (result.stage) {
                    socket.to(sessionId).emit("stage_change", {
                        stage:      result.stage,
                        nextAction: null
                    });
                }
            } catch (err) {
                _handleError(socket, err);
            }
        });

        // ── upload_video ─────────────────────────────────────────────────
        // Client emits this after recording a 20-second video at VIDEO_RECORDING stage.
        // Payload: { sessionId, video (base64), mimeType, durationSeconds }
        socket.on("upload_video", async ({ sessionId, video, mimeType, durationSeconds } = {}) => {
            try {
                if (!limiter.allow("message")) {
                    return _emitError(socket, "RATE_LIMITED", "Please wait before uploading again.");
                }
                if (!sessionId)        return _emitError(socket, "MISSING_SESSION_ID", "sessionId is required.");
                if (!video)            return _emitError(socket, "MISSING_VIDEO", "video (base64) is required.");
                if (durationSeconds === undefined || durationSeconds === null) {
                    return _emitError(socket, "MISSING_DURATION", "durationSeconds is required.");
                }

                socket.emit("agent_typing", {});

                const cleanedVideo = video.replace(/^data:video\/[a-z0-9]+;base64,/, "");
                const cleanedMime  = mimeType || "video/webm";
                const duration     = Number(durationSeconds);

                const result = await videoRecordingService.processVideoRecording(
                    sessionId,
                    userId,
                    cleanedVideo,
                    cleanedMime,
                    duration,
                    ip
                );

                socket.emit("video_result", {
                    agentMessage: result.agentMessage,
                    stage:        result.stage,
                    videoData:    result.videoData
                });

                // Broadcast stage advance to other sockets in the session room
                if (result.stage && result.stage !== "VIDEO_RECORDING") {
                    socket.to(sessionId).emit("stage_change", {
                        stage:      result.stage,
                        nextAction: "answer_questions"
                    });
                }

                console.log(
                    `[VideoKYC Socket] VideoUpload | socket=${socket.id} | session=${sessionId}` +
                    ` | duration=${duration}s | stage=${result.stage}`
                );
            } catch (err) {
                _handleError(socket, err);
            }
        });

        // ── verify_otp ────────────────────────────────────────────────────────
        socket.on("verify_otp", async ({ sessionId, otp } = {}) => {
            try {
                if (!limiter.allow("otp")) {
                    return _emitError(socket, "RATE_LIMITED", "Too many OTP attempts. Please wait.");
                }
                if (!sessionId) return _emitError(socket, "MISSING_SESSION_ID", "sessionId is required.");
                if (!otp)       return _emitError(socket, "MISSING_OTP", "otp is required.");

                const result = await liveService.verifyOtp(sessionId, userId, otp, ip);
                socket.emit("otp_verified", result);

                // Notify all sockets in the session room
                socket.to(sessionId).emit("otp_verified", result);
            } catch (err) {
                _handleError(socket, err);
            }
        });

        // ── resend_otp ────────────────────────────────────────────────────────
        socket.on("resend_otp", async ({ sessionId } = {}) => {
            try {
                if (!limiter.allow("otp")) {
                    return _emitError(socket, "RATE_LIMITED", "Too many OTP requests. Please wait.");
                }
                if (!sessionId) return _emitError(socket, "MISSING_SESSION_ID", "sessionId is required.");
                const result = await liveService.resendOtp(sessionId, userId, ip);
                socket.emit("agent_message", {
                    agentMessage: result.agentMessage,
                    stage:        "OTP_SENT",
                    done:         false,
                    nextAction:   "enter_otp"
                });
            } catch (err) {
                _handleError(socket, err);
            }
        });

        // ── get_session ───────────────────────────────────────────────────────
        socket.on("get_session", async ({ sessionId } = {}) => {
            try {
                if (!limiter.allow("session")) {
                    return _emitError(socket, "RATE_LIMITED", "Too many requests. Please slow down.");
                }
                if (!sessionId) return _emitError(socket, "MISSING_SESSION_ID", "sessionId is required.");
                const snapshot = await liveService.getSession(sessionId, userId);
                socket.emit("session_joined", snapshot);
            } catch (err) {
                _handleError(socket, err);
            }
        });

        // ── ping_session ──────────────────────────────────────────────────────
        // Client sends this periodically to keep the session alive without
        // sending a real message (e.g. while user is reading the agent reply).
        socket.on("ping_session", async ({ sessionId } = {}) => {
            try {
                if (!sessionId) return;
                const snapshot = await liveService.getSession(sessionId, userId);
                socket.emit("pong_session", { expiresAt: snapshot.expiresAt });
            } catch (_err) {
                // Silent on ping errors — don't expose internals
                socket.emit("pong_session", { expiresAt: null });
            }
        });

        // ── disconnect ────────────────────────────────────────────────────────
        socket.on("disconnect", (reason) => {
            const meta = liveService.getSocketMeta(socket.id);
            liveService.onDisconnect(socket.id);

            console.log(
                `[VideoKYC Socket] Disconnected | socket=${socket.id} | user=${userId}` +
                (meta ? ` | session=${meta.sessionId}` : "") +
                ` | reason=${reason}`
            );
        });
    });

    console.log("[VideoKYC Socket] Namespace /video-kyc registered");
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

/**
 * Emits a structured error event to the socket.
 */
function _emitError(socket, code, message) {
    socket.emit("session_error", { code, message });
}

/**
 * Converts any thrown error (AppError or generic) into a socket error event.
 * Session-expired errors get their own dedicated event.
 */
function _handleError(socket, err) {
    const message = err.message || "An unexpected error occurred.";
    const isExpired = message.toLowerCase().includes("expired");

    if (isExpired) {
        socket.emit("session_expired", {});
    } else {
        socket.emit("session_error", {
            code:       err.statusCode ? `HTTP_${err.statusCode}` : "INTERNAL_ERROR",
            message
        });
    }

    if (process.env.NODE_ENV !== "production") {
        console.error("[VideoKYC Socket] Error:", err.message);
    }
}

module.exports = { registerVideoKycNamespace };
