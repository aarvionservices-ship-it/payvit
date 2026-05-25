import forge from "node-forge"
import { usePublicKeyStore } from "./publicKey.store"

export function encryptPayload(data: any) {
    const publicKeyPem = usePublicKeyStore.getState().publicKey

    if (!publicKeyPem) {
        throw new Error("Public key not loaded")
    }

    try {
        const publicKey = forge.pki.publicKeyFromPem(publicKeyPem)
        const payload = JSON.stringify(data)
        
        // --- Hybrid Encryption (AES + RSA) ---
        // 1. Generate a random AES key and IV
        const aesKey = forge.random.getBytesSync(32) // 256-bit key
        const iv = forge.random.getBytesSync(16)    // 128-bit IV

        // 2. Encrypt the actual payload with AES-CBC
        const cipher = forge.cipher.createCipher('AES-CBC', aesKey)
        cipher.start({ iv: iv })
        cipher.update(forge.util.createBuffer(payload, 'utf8'))
        cipher.finish()
        const encryptedPayload = cipher.output.getBytes()

        // 3. Encrypt the AES key with RSA-OAEP
        const encryptedKey = publicKey.encrypt(aesKey, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: {
                md: forge.md.sha256.create()
            }
        })

        // 4. Return combined package
        return {
            encryptedData: forge.util.encode64(encryptedPayload),
            encryptedKey: forge.util.encode64(encryptedKey),
            iv: forge.util.encode64(iv)
        }
    } catch (error: any) {
        console.error("Encryption failed:", error)
        throw new Error("Encryption failed: " + error.message)
    }
}
