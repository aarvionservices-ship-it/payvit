const fs = require("fs");
const path = require("path");

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

        this.publicKey =
            fs.readFileSync(publicPath, "utf8");

        this.privateKey =
            fs.readFileSync(privatePath, "utf8");

        console.log("RSA keys loaded from PEM files");

    }

    getPublicKey() {
        return this.publicKey;
    }

    getPrivateKey() {
        return this.privateKey;
    }

}

module.exports = new KeyLoader();
