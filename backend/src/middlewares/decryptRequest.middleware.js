const encryptionService = require("../core/security/encryption.service");

module.exports = (req, res, next) => {
    try {
        if (req.body && (req.body.encryptedData || (req.body.encryptedKey && req.body.iv))) {
            req.body = encryptionService.decryptPayload(req.body);
        }
        next();
    } catch (error) {
        console.error("Request payload decryption failed:", error.message);
        return res.status(400).json({
            success: false,
            message: "Invalid encrypted payload: " + error.message
        });
    }
};
