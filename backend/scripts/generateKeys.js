const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Script to generate RSA key pairs for request encryption/decryption
 * and secure secrets for JWT.
 */

async function generateKeys() {
  const keysDir = path.join(process.cwd(), "keys");

  // 1. Create keys directory if it doesn't exist
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir);
    console.log("Created 'keys' directory.");
  }

  console.log("Generating RSA Key Pair...");

  // 2. Generate RSA Key Pair
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  // 3. Save RSA Keys to files
  const publicPath = path.join(keysDir, "public.pem");
  const privatePath = path.join(keysDir, "private.pem");

  fs.writeFileSync(publicPath, publicKey);
  fs.writeFileSync(privatePath, privateKey);

  console.log(`RSA Public Key saved to: ${publicPath}`);
  console.log(`RSA Private Key saved to: ${privatePath}`);

  // 4. Generate JWT Secrets
  console.log("\nGenerating Secure JWT Secrets...");
  const accessSecret = crypto.randomBytes(64).toString("hex");
  const refreshSecret = crypto.randomBytes(64).toString("hex");

  console.log(
    "------------------------------------------------------------------",
  );
  console.log("Add these to your .env file:");
  console.log(
    "------------------------------------------------------------------",
  );
  console.log(`JWT_ACCESS_SECRET=${accessSecret}`);
  console.log(`JWT_REFRESH_SECRET=${refreshSecret}`);
  console.log(
    "------------------------------------------------------------------",
  );
}

generateKeys().catch((err) => {
  console.error("Error generating keys:", err);
  process.exit(1);
});
