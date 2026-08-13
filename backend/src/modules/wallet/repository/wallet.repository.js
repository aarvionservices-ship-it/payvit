const Wallet = require("../model/wallet.model");

class WalletRepository {

    async create(userId) {
        const wallet = new Wallet({ userId });
        return await wallet.save();
    }

    async findByUserId(userId) {
        return await Wallet.findOne({ userId });
    }

    async updateBalance(userId, newBalance, session = null) {
        const opts = session ? { session } : {};
        return await Wallet.findOneAndUpdate(
            { userId },
            { $set: { balance: newBalance } },
            { returnDocument: 'after', ...opts }
        );
    }

    async incrementBalance(userId, amount, session = null) {
        const opts = session ? { session } : {};
        return await Wallet.findOneAndUpdate(
            { userId },
            { $inc: { balance: amount } },
            { returnDocument: 'after', ...opts }
        );
    }

    async updateUsedToday(userId, amount, session = null) {
        const opts = session ? { session } : {};
        return await Wallet.findOneAndUpdate(
            { userId },
            { $inc: { usedToday: amount } },
            { returnDocument: 'after', ...opts }
        );
    }

    async setPin(userId, hashedPin) {
        return await Wallet.findOneAndUpdate(
            { userId },
            { $set: { walletPin: hashedPin, isPinSet: true } },
            { returnDocument: 'after' }
        );
    }

    async setBiometrics(userId, { publicKey, deviceId }) {
        return await Wallet.findOneAndUpdate(
            { userId },
            {
                $set: {
                    biometricPublicKey: publicKey,
                    biometricDeviceId: deviceId || null,
                    isBiometricEnabled: true
                }
            },
            { returnDocument: 'after' }
        );
    }

    async disableBiometrics(userId) {
        return await Wallet.findOneAndUpdate(
            { userId },
            {
                $set: {
                    biometricPublicKey: null,
                    biometricDeviceId: null,
                    isBiometricEnabled: false,
                    biometricChallenge: null,
                    biometricChallengeExpires: null
                }
            },
            { returnDocument: 'after' }
        );
    }

    async setBiometricChallenge(userId, challenge, expires) {
        return await Wallet.findOneAndUpdate(
            { userId },
            {
                $set: {
                    biometricChallenge: challenge,
                    biometricChallengeExpires: expires
                }
            },
            { returnDocument: 'after' }
        );
    }

    async clearBiometricChallenge(userId, session = null) {
        const opts = session ? { session } : {};
        return await Wallet.findOneAndUpdate(
            { userId },
            {
                $set: {
                    biometricChallenge: null,
                    biometricChallengeExpires: null
                }
            },
            { returnDocument: 'after', ...opts }
        );
    }

    async setStatus(userId, status) {
        return await Wallet.findOneAndUpdate(
            { userId },
            { $set: { status } },
            { returnDocument: 'after' }
        );
    }

    async incrementTxnCount(userId, session = null) {
        const opts = session ? { session } : {};
        return await Wallet.findOneAndUpdate(
            { userId },
            { $inc: { totalTransactions: 1 } },
            { returnDocument: 'after', ...opts }
        );
    }

    async incrementPinAttempts(userId) {
        const wallet = await this.findByUserId(userId);
        if (!wallet) return null;
        
        const newAttempts = (wallet.pinAttempts || 0) + 1;
        const updates = { pinAttempts: newAttempts };
        
        if (newAttempts >= 3) {
            updates.pinLockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        }
        
        return await Wallet.findOneAndUpdate(
            { userId },
            { $set: updates },
            { returnDocument: 'after' }
        );
    }

    async resetPinAttempts(userId, session = null) {
        const opts = session ? { session } : {};
        return await Wallet.findOneAndUpdate(
            { userId },
            { $set: { pinAttempts: 0, pinLockUntil: null } },
            { returnDocument: 'after', ...opts }
        );
    }

    async updateDailyLimitForKYC(userId) {
        return await Wallet.findOneAndUpdate(
            { userId },
            { $set: { kycVerified: true, dailyLimit: 100000 } },
            { returnDocument: 'after' }
        );
    }

    async resetDailyUsage(userId) {
        const today = new Date().toISOString().split("T")[0];
        return await Wallet.findOneAndUpdate(
            { userId },
            { $set: { usedToday: 0, lastResetDate: today } },
            { returnDocument: 'after' }
        );
    }

    // Onboarding / KYC Flags

    async setWalletId(userId, walletId) {
        return await Wallet.findOneAndUpdate(
            { userId },
            { $set: { walletId } },
            { returnDocument: 'after' }
        );
    }

    async updateKycStatus(userId, kycStatus) {
        return await Wallet.findOneAndUpdate(
            { userId },
            { $set: { kycStatus } },
            { returnDocument: 'after' }
        );
    }

    async setPanVerified(userId) {
        return await Wallet.findOneAndUpdate(
            { userId },
            { $set: { panVerified: true, kycStatus: "pan_verified" } },
            { returnDocument: 'after' }
        );
    }

    async setBankLinked(userId) {
        return await Wallet.findOneAndUpdate(
            { userId },
            { $set: { bankLinked: true } },
            { returnDocument: 'after' }
        );
    }

    async setConsentAccepted(userId) {
        return await Wallet.findOneAndUpdate(
            { userId },
            { $set: { consentAccepted: true } },
            { returnDocument: 'after' }
        );
    }

}

module.exports = new WalletRepository();
