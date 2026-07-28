const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

class KeyLoader {

    constructor() {
        this.publicKey = null;
        this.privateKey = null;
    }

    loadKeys() {

        // PRODUCTION (environment variables)
        if (process.env.RSA_PRIVATE_KEY && process.env.RSA_PUBLIC_KEY) {

            this.privateKey =
                process.env.RSA_PRIVATE_KEY.replace(/\\n/g, "\n");

            this.publicKey =
                process.env.RSA_PUBLIC_KEY.replace(/\\n/g, "\n");

            console.log("RSA keys loaded from ENV");

            return;
        }

        // DEVELOPMENT (local pem files)

        const publicPath =
            path.join(process.cwd(), "keys", "public.pem");

        const privatePath =
            path.join(process.cwd(), "keys", "private.pem");

        try {
            if (fs.existsSync(privatePath)) {
                this.privateKey = fs.readFileSync(privatePath, "utf8");
                if (fs.existsSync(publicPath)) {
                    this.publicKey = fs.readFileSync(publicPath, "utf8");
                } else if (this.privateKey) {
                    this.publicKey = crypto.createPublicKey(this.privateKey).export({ type: "spki", format: "pem" });
                }
            } else if (fs.existsSync(publicPath)) {
                this.publicKey = fs.readFileSync(publicPath, "utf8");
            }
        } catch {
            // Ignore file read issues
        }

        // If no keys found, generate ephemeral RSA keys in memory
        if (!this.publicKey || !this.privateKey) {
            try {
                const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
                    modulusLength: 2048,
                    publicKeyEncoding: { type: "spki", format: "pem" },
                    privateKeyEncoding: { type: "pkcs8", format: "pem" }
                });
                this.publicKey = publicKey;
                this.privateKey = privateKey;
            } catch {
                // Ignore fallback key generation errors
            }
        }

        if (process.env.NODE_ENV !== 'test') console.log("RSA keys loaded successfully");

    }

    getPublicKey() {
        return this.publicKey;
    }

    getPrivateKey() {
        return this.privateKey;
    }

}

module.exports = new KeyLoader();
