const crypto = require("crypto");
const keyLoader = require("./keyLoader");

class EncryptionService {

    decryptPayload(data) {
        const privateKey = keyLoader.getPrivateKey();
        if (!privateKey) return data;

        try {
            if (data && typeof data === "object" && data.encryptedData && data.encryptedKey && data.iv) {
                const aesKey = crypto.privateDecrypt(
                    {
                        key: privateKey,
                        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                        oaepHash: "sha256"
                    },
                    Buffer.from(data.encryptedKey, "base64")
                );

                const decipher = crypto.createDecipheriv(
                    "aes-256-cbc",
                    aesKey,
                    Buffer.from(data.iv, "base64")
                );

                let decrypted = decipher.update(Buffer.from(data.encryptedData, "base64"), "binary", "utf8");
                decrypted += decipher.final("utf8");

                return JSON.parse(decrypted);
            }

            const encryptedStr = typeof data === "object" ? data.encryptedData : data;
            if (!encryptedStr) return data;

            const buffer = Buffer.from(encryptedStr, "base64");
            const decrypted = crypto.privateDecrypt(
                {
                    key: privateKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: "sha256"
                },
                buffer
            );

            return JSON.parse(decrypted.toString());
        } catch (error) {
            throw new Error("Payload decryption failed: " + error.message);
        }
    }

    encryptWithPublicKey(payload) {
        const publicKey = keyLoader.getPublicKey();
        if (!publicKey) return null;

        try {
            const buffer = Buffer.from(JSON.stringify(payload));
            const encrypted = crypto.publicEncrypt(
                {
                    key: publicKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: "sha256"
                },
                buffer
            );

            return encrypted.toString("base64");
        } catch (error) {
            throw new Error("Payload encryption failed: " + error.message);
        }
    }

}

module.exports = new EncryptionService();
