/**
 * socketRateLimiter.js
 *
 * Per-socket event-level rate limiter for the Video KYC WebSocket namespace.
 *
 * Why this is needed:
 *   HTTP rate limiters (express-rate-limit) only cover REST endpoints.
 *   WebSocket connections bypass them entirely, so without this an attacker
 *   could flood the socket with `send_frame` events containing large base64
 *   payloads or spam `send_message` to exhaust server resources.
 *
 * Strategy — token bucket per socket per event group:
 *   - "message"  bucket  : send_message + send_frame (AI calls)
 *   - "otp"      bucket  : verify_otp + resend_otp
 *   - "session"  bucket  : start_session + join_session + get_session
 *   Each bucket refills at a configurable rate.
 *
 * Usage (inside the socket connection handler):
 *   const limiter = createSocketRateLimiter();
 *   socket.on("send_message", () => {
 *       if (!limiter.allow("message")) {
 *           return socket.emit("session_error", { code: "RATE_LIMITED", message: "..." });
 *       }
 *       // ... handle event
 *   });
 */

// ─── Bucket config ────────────────────────────────────────────────────────────

const BUCKETS = {
    // AI / frame events: max 10 per 10 s window (1 per second on average)
    message: { capacity: 10, refillPerMs: 10 / (10 * 1000) },

    // OTP events: max 5 per 60 s (generous for resend, strict on brute-force)
    otp:     { capacity: 5,  refillPerMs: 5  / (60 * 1000) },

    // Session control events: max 20 per 60 s
    session: { capacity: 20, refillPerMs: 20 / (60 * 1000) }
};

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a fresh rate-limiter instance per socket connection.
 * Each instance holds its own independent token buckets.
 *
 * @returns {{ allow: (bucket: string) => boolean, reset: () => void }}
 */
function createSocketRateLimiter() {
    // State: { [bucketName]: { tokens, lastRefillAt } }
    const state = {};

    for (const [name, cfg] of Object.entries(BUCKETS)) {
        state[name] = {
            tokens:       cfg.capacity,   // start full
            lastRefillAt: Date.now()
        };
    }

    /**
     * Checks whether the given bucket has a token available.
     * If yes, consumes one token and returns true.
     * If no, returns false (caller should emit RATE_LIMITED).
     *
     * @param {string} bucket  - "message" | "otp" | "session"
     * @returns {boolean}
     */
    function allow(bucket) {
        const cfg = BUCKETS[bucket];
        if (!cfg) return true;   // unknown bucket — let it through

        const s   = state[bucket];
        const now = Date.now();

        // Refill tokens based on elapsed time
        const elapsed   = now - s.lastRefillAt;
        const newTokens = elapsed * cfg.refillPerMs;
        s.tokens        = Math.min(cfg.capacity, s.tokens + newTokens);
        s.lastRefillAt  = now;

        if (s.tokens < 1) {
            return false;   // rate limited
        }

        s.tokens -= 1;
        return true;
    }

    /**
     * Resets all buckets to full capacity.
     * Useful in tests.
     */
    function reset() {
        for (const [name, cfg] of Object.entries(BUCKETS)) {
            state[name] = { tokens: cfg.capacity, lastRefillAt: Date.now() };
        }
    }

    return { allow, reset };
}

module.exports = { createSocketRateLimiter, BUCKETS };
