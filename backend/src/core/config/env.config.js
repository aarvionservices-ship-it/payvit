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
};