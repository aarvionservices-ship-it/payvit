const crypto = require("crypto");
const keyLoader = require("./keyLoader");

class EncryptionService {

    decryptPayload(encryptedData) {

        const privateKey = keyLoader.getPrivateKey();

        const buffer = Buffer.from(encryptedData, "base64");

        const decrypted = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
            },
            buffer
        );

        return JSON.parse(decrypted.toString());
    }


    encryptWithPublicKey(payload) {

        const publicKey = keyLoader.getPublicKey();

        const buffer = Buffer.from(JSON.stringify(payload));

        const encrypted = crypto.publicEncrypt(
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
            },
            buffer
        );

        return encrypted.toString("base64");
    }

}

module.exports = new EncryptionService();
