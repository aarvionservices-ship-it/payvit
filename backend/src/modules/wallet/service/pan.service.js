const WalletPan = require("../model/walletPan.model");
const AppError = require("../../../core/utils/AppError");
const config = require("../../../core/config/env.config");

// PAN format: 5 uppercase letters, 4 digits, 1 uppercase letter
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

class PanService {
    // Validate and verify a PAN number for a user. - - Validates format - - Checks it isn't already linked to another account - - Calls mock/real PAN verification API - - Persists the record - @param {string} userId - @param {string} panNumber  — raw PAN (will be uppercased) - @returns {{ message: string, panMasked: string }}
    async verifyPan(userId, panNumber) {
        if (!panNumber || typeof panNumber !== "string") {
            throw new AppError("PAN number is required.", 400);
        }

        const pan = panNumber.trim().toUpperCase();

        if (!PAN_REGEX.test(pan)) {
            throw new AppError("Invalid PAN", 400);
        }

        // Check if PAN already verified for this user
        const existing = await WalletPan.findOne({ userId });
        if (existing && existing.status === "verified") {
            throw new AppError("PAN is already verified for this account.", 409);
        }

        // Check if same PAN is linked to a different user (with decryption to avoid collisions)
        const potentialDuplicates = await WalletPan.find({
            panLast4: pan.slice(-4),
            status: "verified",
            userId: { $ne: userId }
        });
        for (const dup of potentialDuplicates) {
            if (dup.getDecryptedPan() === pan) {
                throw new AppError("already linked", 409);
            }
        }

        // PAN Verification (mock or real)
        const verificationResult = await this._callPanApi(pan);

        const panMasked = this._maskPan(pan);
        const panLast4 = pan.slice(-4);
        const panEncrypted = WalletPan.encryptPan(pan);

        // Upsert PAN record
        await WalletPan.findOneAndUpdate(
            { userId },
            {
                $set: {
                    panEncrypted,
                    panLast4,
                    panMasked,
                    status: "verified",
                    verifiedAt: new Date(),
                    nameOnPan: verificationResult.nameOnPan || null
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        return {
            message: "PAN verified successfully.",
            panMasked,
            nameOnPan: verificationResult.nameOnPan || null
        };
    }

    // Get PAN verification status for a user.
    async getPanStatus(userId) {
        const pan = await WalletPan.findOne({ userId });
        if (!pan) return { status: "not_submitted", panVerified: false };
        return {
            status: pan.status,
            panVerified: pan.status === "verified",
            panMasked: pan.panMasked,
            nameOnPan: pan.nameOnPan,
            verifiedAt: pan.verifiedAt
        };
    }

    // Private

    _maskPan(pan) {
        // ABCDE1234F → ABCDE****F
        return pan.slice(0, 5) + "****" + pan.slice(-1);
    }

    async _callPanApi(pan) {
        // Mock mode (matches the Aadhaar mock pattern)
        // In production: call Sandbox.co.in or NSDL API
        const mockMode = config.pan?.mockMode !== false; // default true unless explicitly disabled

        if (mockMode) {
            // Simulate a slight network delay
            await new Promise((r) => setTimeout(r, 50));

            // Simulate PAN not found for an obviously fake PAN
            if (pan === "AAAAA0000A") {
                throw new AppError("Invalid PAN", 400);
            }

            return {
                nameOnPan: "Mock PAN Holder",
                status: "VALID"
            };
        }

        // Real API (example: Sandbox.co.in)
        try {
            const response = await fetch(`${config.pan.baseUrl}/pan/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": config.pan.apiKey,
                    "accept": "application/json"
                },
                body: JSON.stringify({ panNumber: pan })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new AppError(data.message || "PAN verification failed.", response.status || 400);
            }

            return {
                nameOnPan: data.data?.name || data.name || null,
                status: "VALID"
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(`PAN verification service error: ${error.message}`, 500);
        }
    }
}

module.exports = new PanService();
