require("dotenv").config();

module.exports = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV,

    mongoUri: process.env.MONGO_URI,

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        accessExpiry: process.env.JWT_ACCESS_EXPIRY,
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY,
    },

    rsa: {
        privateKey: process.env.RSA_PRIVATE_KEY_PATH,
        publicKey: process.env.RSA_PUBLIC_KEY_PATH,
    },

    aadhaar: {
        mockMode: process.env.AADHAAR_MOCK_MODE !== "false",
        baseUrl: process.env.AADHAAR_API_BASE_URL || "",
        apiKey: process.env.AADHAAR_API_KEY || ""
    },

    // PAN KYC mock config
    // Set PAN_MOCK_MODE=false in .env to use a real PAN API
    // Set PAN_MOCK_OTP to override the default mock OTP (default: 654321)
    pan: {
        mockMode: process.env.PAN_MOCK_MODE !== "false",
        mockOtp: process.env.PAN_MOCK_OTP || "654321",
        // Production: Surepass / Karza / Signzy API credentials
        baseUrl: process.env.PAN_API_BASE_URL || "",
        apiKey:  process.env.PAN_API_KEY       || ""
    },

    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

    // ─── Video KYC Agent ───────────────────────────────────────────────────────
    videoKyc: {
        mockMode: process.env.VIDEO_KYC_MOCK_MODE !== "false",
        mockOtp: process.env.VIDEO_KYC_MOCK_OTP || "654321",
        sessionTtlMs: 30 * 60 * 1000  // 30 minutes
    },

    // ─── Socket.io ─────────────────────────────────────────────────────────────
    socket: {
        // Comma-separated allowed origins (defaults to same list as Express CORS)
        corsOrigins: process.env.CORS_ORIGINS?.split(",").map(o => o.trim()) || [],

        // Ping / keepalive (ms) — controls how long idle connections stay open
        pingTimeout:  parseInt(process.env.SOCKET_PING_TIMEOUT  || "60000", 10),
        pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || "25000", 10),

        // Max payload for webcam frames (bytes)
        maxHttpBufferSize: parseInt(process.env.SOCKET_MAX_BUFFER || String(10e6), 10)
    }
};