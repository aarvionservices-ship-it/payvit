const fs = require("fs");
const path = require("path");

class PublicKeyController {

    getPublicKey(req, res) {

        try {

            let publicKey;

            // production (ENV variable)
            if (process.env.RSA_PUBLIC_KEY) {

                publicKey =
                    process.env.RSA_PUBLIC_KEY.replace(/\\n/g, "\n");

            } else {

                // development (pem file)
                const publicKeyPath = path.join(
                    process.cwd(),
                    "keys",
                    "public.pem"
                );

                publicKey = fs.readFileSync(publicKeyPath, "utf8");

            }

            res.json({
                success: true,
                data: {
                    publicKey
                }
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                message: "Failed to load public key"
            });

        }

    }

}

module.exports = new PublicKeyController();
