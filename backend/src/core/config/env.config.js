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
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173", // Base URL for reset links, etc.
    encryptionKey: process.env.BANK_ACCOUNT_ENCRYPTION_KEY || "payvit_bank_key_32bytes_default!",
    aadhaar: {
        apiKey: process.env.AADHAAR_API_KEY || "none",
        baseUrl: process.env.AADHAAR_BASE_URL || "https://api.sandbox.co.in",
        mockMode: !process.env.AADHAAR_API_KEY || process.env.AADHAAR_API_KEY === "none"
    },
    kyc: {
        unverifiedDailyLimit: Number(process.env.KYC_UNVERIFIED_DAILY_LIMIT) || 10000,
        verifiedDailyLimit: Number(process.env.KYC_VERIFIED_DAILY_LIMIT) || 100000
    },
    pan: {
        apiKey: process.env.PAN_API_KEY || "none",
        baseUrl: process.env.PAN_BASE_URL || "https://api.sandbox.co.in",
        mockMode: !process.env.PAN_API_KEY || process.env.PAN_API_KEY === "none"
    }
};