const crypto = require("crypto");
const keyLoader = require("../core/security/keyLoader");

module.exports = (req, res, next) => {

    try {

        const privateKey = keyLoader.getPrivateKey();

        if (!privateKey) {
            return next();
        }
        
        // If it's a standard RSA-only payload (legacy support or small payloads)
        if (req.body && req.body.encryptedData && !req.body.encryptedKey) {
             const buffer = Buffer.from(req.body.encryptedData, "base64");
             const decrypted = crypto.privateDecrypt(
                 {
                     key: privateKey,
                     padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                     oaepHash: "sha256"
                 },
                 buffer
             );
             req.body = JSON.parse(decrypted.toString());
             return next();
        }

        // --- Hybrid Decryption (AES + RSA) ---
        if (!req.body || !req.body.encryptedData || !req.body.encryptedKey || !req.body.iv) {
            return next();
        }

        // 1. Decrypt the AES key using Private RSA Key
        const aesKey = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256"
            },
            Buffer.from(req.body.encryptedKey, "base64")
        );

        // 2. Decrypt the Payload using the Decrypted AES Key
        const decipher = crypto.createDecipheriv(
            "aes-256-cbc",
            aesKey,
            Buffer.from(req.body.iv, "base64")
        );

        let decrypted = decipher.update(Buffer.from(req.body.encryptedData, "base64"), "binary", "utf8");
        decrypted += decipher.final("utf8");

        req.body = JSON.parse(decrypted);
        next();

    } catch (error) {

        console.error("Payload decryption failed:", error.message);

        return res.status(400).json({
            success: false,
            message: "Invalid encrypted payload: " + error.message
        });

    }

};
