const crypto = require("crypto");

function generateKeys() {

    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
    });

    return {
        publicKey: publicKey.export({ type: "pkcs1", format: "pem" }),
        privateKey: privateKey.export({ type: "pkcs1", format: "pem" }),
    };

}

module.exports = generateKeys;
