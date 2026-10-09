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

        let publicPath =
            path.join(process.cwd(), "keys", "public.pem");

        let privatePath =
            path.join(process.cwd(), "keys", "private.pem");

        if (!fs.existsSync(publicPath) || !fs.existsSync(privatePath)) {
            publicPath = path.join(__dirname, "../../../keys/public.pem");
            privatePath = path.join(__dirname, "../../../keys/private.pem");
        }

        if (fs.existsSync(publicPath) && fs.existsSync(privatePath)) {
            this.privateKey = fs.readFileSync(privatePath, "utf8");
            try {
                const derived = crypto.createPublicKey(this.privateKey);
                this.publicKey = derived.export({ type: "spki", format: "pem" });
            } catch {
                this.publicKey = fs.readFileSync(publicPath, "utf8");
            }
            console.log("RSA keys loaded from PEM files");
        }

    }

    getPublicKey() {
        if (!this.publicKey) {
            this.loadKeys();
        }
        return this.publicKey;
    }

    getPrivateKey() {
        if (!this.privateKey) {
            this.loadKeys();
        }
        return this.privateKey;
    }

}

module.exports = new KeyLoader();
