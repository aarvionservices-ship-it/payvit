const argon2 = require("argon2");
const crypto = require("crypto");
const walletRepo = require("../repository/wallet.repository");
const bankAccountRepo = require("../repository/bankAccount.repository");
const transactionRepo = require("../repository/transaction.repository");
const snowflake = require("../../../core/utils/distributedId");
const AppError = require("../../../core/utils/AppError");
const mongoose = require("mongoose");

class WalletService {

    // Wallet Lifecycle

    async getWallet(userId) {
        const wallet = await walletRepo.findByUserId(userId);
        if (!wallet) throw new AppError("Wallet not found. Please create your wallet first.", 404);

        // Auto-reset daily usage if it's a new day
        const today = new Date().toISOString().split("T")[0];
        if (wallet.lastResetDate !== today) {
            await walletRepo.resetDailyUsage(userId);
            wallet.usedToday = 0;
            wallet.lastResetDate = today;
        }

        return this._safeWallet(wallet);
    }

    async createWallet(userId) {
        const existing = await walletRepo.findByUserId(userId);
        if (existing) throw new AppError("Wallet already exists for this user.", 409);

        const wallet = await walletRepo.create(userId);
        return this._safeWallet(wallet);
    }

    // PIN Management

    async setPin(userId, pin) {
        this._validatePin(pin);
        const wallet = await this._getWalletOrThrow(userId);

        const hashedPin = await argon2.hash(pin.toString());
        await walletRepo.setPin(userId, hashedPin);

        return { message: "Wallet PIN set successfully." };
    }

    async changePin(userId, currentPin, newPin) {
        this._validatePin(newPin);
        const wallet = await this._getWalletOrThrow(userId);

        if (!wallet.isPinSet) throw new AppError("No PIN set. Use set-pin instead.", 400);
        await this._verifyPinOrThrow(wallet, currentPin);

        const hashedPin = await argon2.hash(newPin.toString());
        await walletRepo.setPin(userId, hashedPin);

        return { message: "Wallet PIN changed successfully." };
    }

    async verifyPin(userId, pin) {
        const wallet = await this._getWalletOrThrow(userId);
        await this._verifyPinOrThrow(wallet, pin);
        return { valid: true };
    }

    async generateBiometricChallenge(userId) {
        await this._getWalletOrThrow(userId);
        const challenge = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration
        await walletRepo.setBiometricChallenge(userId, challenge, expires);
        return { challenge };
    }

    async registerBiometrics(userId, { biometricPublicKey, deviceId, pin }) {
        const wallet = await this._getWalletOrThrow(userId);
        if (!pin) throw new AppError("Wallet PIN is required to register biometrics.", 400);
        await this._verifyPinOrThrow(wallet, pin);

        if (!biometricPublicKey) {
            throw new AppError("Biometric public key is required.", 400);
        }

        // Check if key is in valid format
        if (!biometricPublicKey.includes("PUBLIC KEY")) {
            throw new AppError("Invalid public key format. Expected PEM format.", 400);
        }

        await walletRepo.setBiometrics(userId, { publicKey: biometricPublicKey, deviceId });
        return { message: "Biometrics registered successfully." };
    }

    async disableBiometrics(userId, { pin }) {
        const wallet = await this._getWalletOrThrow(userId);
        if (!pin) throw new AppError("Wallet PIN is required to disable biometrics.", 400);
        await this._verifyPinOrThrow(wallet, pin);

        await walletRepo.disableBiometrics(userId);
        return { message: "Biometrics disabled successfully." };
    }

    // Bank ↔ Wallet Money Movement

    async addMoney(userId, { amount, bankAccountId, pin, signature, challenge, description }) {
        amount = Number(amount);
        this._validateAmount(amount);

        const wallet = await this._getWalletOrThrow(userId);
        this._ensureWalletActive(wallet);
        await this.verifyAuthOrThrow(wallet, { pin, signature, challenge });

        if (!wallet.kycVerified && amount > 10000) {
            throw new AppError("KYC required for transactions above ₹10,000. Complete Aadhaar KYC first.", 403);
        }

        const bankAccount = await bankAccountRepo.findByIdAndUser(bankAccountId, userId);
        if (!bankAccount) throw new AppError("Bank account not found.", 404);

        // MOCK: Simulate successful bank debit
        // In production: call Razorpay/UPI payment gateway here
        // const gatewayRef = await gateway.initiateDebit(bankAccount, amount);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const balanceBefore = wallet.balance;
            const balanceAfter = balanceBefore + amount;

            const txn = await transactionRepo.create({
                txnId: snowflake.nextId(),
                fromUserId: null,
                toUserId: userId,
                amount,
                type: "bank_topup",
                status: "success",
                description: description || `Added ₹${amount} from ${bankAccount.bankName} ${bankAccount.accountNumberMasked}`,
                bankAccountId: bankAccountId,
                receiverBalanceBefore: balanceBefore,
                receiverBalanceAfter: balanceAfter,
                metadata: { bankName: bankAccount.bankName, accountMasked: bankAccount.accountNumberMasked }
            }, session);

            await walletRepo.incrementBalance(userId, amount, session);
            await walletRepo.incrementTxnCount(userId, session);

            await session.commitTransaction();
            session.endSession();

            return {
                message: `₹${amount} added to wallet successfully.`,
                txnId: txn.txnId,
                newBalance: balanceAfter
            };

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            if (err instanceof AppError) throw err;
            throw new AppError("Failed to add money. Please try again.", 500);
        }
    }

    async withdrawMoney(userId, { amount, bankAccountId, pin, signature, challenge, description }) {
        amount = Number(amount);
        this._validateAmount(amount);

        const wallet = await this._getWalletOrThrow(userId);
        this._ensureWalletActive(wallet);
        await this.verifyAuthOrThrow(wallet, { pin, signature, challenge });

        if (wallet.balance < amount) {
            throw new AppError(`Insufficient balance. Available: ₹${wallet.balance}`, 400);
        }

        if (!wallet.kycVerified && amount > 10000) {
            throw new AppError("KYC required for transactions above ₹10,000. Complete Aadhaar KYC first.", 403);
        }

        const bankAccount = await bankAccountRepo.findByIdAndUser(bankAccountId, userId);
        if (!bankAccount) throw new AppError("Bank account not found.", 404);

        await this._checkDailyLimit(wallet, amount);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const balanceBefore = wallet.balance;
            const balanceAfter = balanceBefore - amount;

            // Flag very large withdrawals for review
            const isSuspicious = amount >= 50000;

            const txn = await transactionRepo.create({
                txnId: snowflake.nextId(),
                fromUserId: userId,
                toUserId: null,
                amount,
                type: "bank_withdrawal",
                status: "success",
                description: description || `Withdrawn ₹${amount} to ${bankAccount.bankName} ${bankAccount.accountNumberMasked}`,
                bankAccountId,
                senderBalanceBefore: balanceBefore,
                senderBalanceAfter: balanceAfter,
                flaggedAsFraud: isSuspicious,
                fraudReason: isSuspicious ? "High-value withdrawal pending review" : null,
                metadata: { bankName: bankAccount.bankName, accountMasked: bankAccount.accountNumberMasked }
            }, session);

            await walletRepo.incrementBalance(userId, -amount, session);
            await walletRepo.updateUsedToday(userId, amount, session);
            await walletRepo.incrementTxnCount(userId, session);

            await session.commitTransaction();
            session.endSession();

            return {
                message: `₹${amount} withdrawal initiated to your ${bankAccount.bankName} account.`,
                txnId: txn.txnId,
                newBalance: balanceAfter,
                note: isSuspicious ? "Large withdrawal is under review." : undefined
            };

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            if (err instanceof AppError) throw err;
            throw new AppError("Withdrawal failed. Please try again.", 500);
        }
    }

    // Transaction History

    async getTransactionHistory(userId, query) {
        return await transactionRepo.findByUser(userId, query);
    }

    async getTransactionById(txnId, userId) {
        const txn = await transactionRepo.findById(txnId);
        if (!txn) throw new AppError("Transaction not found.", 404);

        // Ensure user is a party to this transaction
        if (txn.fromUserId !== userId && txn.toUserId !== userId) {
            throw new AppError("Access denied.", 403);
        }

        return txn;
    }

    // Token Spend

    async useTokens(userId, { amount, pin, signature, challenge, serviceName, description }) {
        amount = Number(amount);
        this._validateAmount(amount);

        const wallet = await this._getWalletOrThrow(userId);
        this._ensureWalletActive(wallet);
        await this.verifyAuthOrThrow(wallet, { pin, signature, challenge });

        if (wallet.balance < amount) {
            throw new AppError(`Insufficient tokens. Available: ${wallet.balance} tokens`, 400);
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const balanceBefore = wallet.balance;
            const balanceAfter = balanceBefore - amount;

            const txn = await transactionRepo.create({
                txnId: snowflake.nextId(),
                fromUserId: userId,
                toUserId: null,
                amount,
                type: "token_spend",
                status: "success",
                description: description || `Spent ${amount} tokens on ${serviceName || "service"}`,
                senderBalanceBefore: balanceBefore,
                senderBalanceAfter: balanceAfter,
                metadata: { serviceName: serviceName || "" }
            }, session);

            await walletRepo.incrementBalance(userId, -amount, session);
            await walletRepo.incrementTxnCount(userId, session);

            await session.commitTransaction();
            session.endSession();

            return {
                message: `${amount} tokens spent on ${serviceName || "service"} successfully.`,
                txnId: txn.txnId,
                newBalance: balanceAfter
            };

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            if (err instanceof AppError) throw err;
            throw new AppError("Token spend failed. Please try again.", 500);
        }
    }

    // Bank Account Management

    async getBankAccounts(userId) {
        return await bankAccountRepo.findByUser(userId);
    }

    async addBankAccount(userId, data) {
        const count = await bankAccountRepo.countByUser(userId);
        if (count >= 5) throw new AppError("Maximum 5 bank accounts allowed per wallet.", 400);

        const account = await bankAccountRepo.create({ ...data, userId });

        // If first account, auto-set as primary
        if (count === 0) {
            await bankAccountRepo.setPrimary(account._id, userId);
        }

        return account.toSafeJSON ? account.toSafeJSON() : account;
    }

    async removeBankAccount(userId, bankAccountId) {
        const account = await bankAccountRepo.findByIdAndUser(bankAccountId, userId);
        if (!account) throw new AppError("Bank account not found.", 404);

        await bankAccountRepo.softDelete(bankAccountId, userId);
        return { message: "Bank account removed successfully." };
    }

    async setPrimaryBankAccount(userId, bankAccountId) {
        const account = await bankAccountRepo.findByIdAndUser(bankAccountId, userId);
        if (!account) throw new AppError("Bank account not found.", 404);

        await bankAccountRepo.setPrimary(bankAccountId, userId);
        return { message: "Primary bank account updated." };
    }

    async generateMyQrCode(userId) {
        await this._getWalletOrThrow(userId);
        const User = require("../../auth/model/auth.model");
        const user = await User.findOne({ userId }).select("name");
        const name = user ? user.name : "";
        const qrData = `payvit://pay?userId=${userId}&name=${encodeURIComponent(name)}`;
        const qrCodeUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(qrData)}`;
        return { qrData, qrCodeUrl };
    }

    async resolveQrCode(qrData) {
        if (!qrData || typeof qrData !== "string") {
            throw new AppError("QR code data must be a non-empty string.", 400);
        }

        let userId = qrData;
        if (qrData.startsWith("payvit://pay?")) {
            try {
                const url = new URL(qrData.replace("payvit://", "http://"));
                userId = url.searchParams.get("userId");
            } catch (err) {
                throw new AppError("Invalid QR code format.", 400);
            }
        }

        if (!userId) {
            throw new AppError("Could not resolve recipient from QR code.", 400);
        }

        const User = require("../../auth/model/auth.model");
        const user = await User.findOne({ userId, isActive: true })
            .select("userId name phone email")
            .lean();

        if (!user) {
            throw new AppError("No active Payvit user found for this QR code.", 404);
        }

        const recipientWallet = await walletRepo.findByUserId(userId);
        if (!recipientWallet) {
            throw new AppError("Recipient does not have a Payvit wallet.", 400);
        }
        if (recipientWallet.status !== "active") {
            throw new AppError("Recipient's wallet is not active.", 400);
        }

        return {
            userId: user.userId,
            name: user.name,
            phone: user.phone ? `XXXXXX${user.phone.slice(-4)}` : null,
            email: user.email ? `${user.email[0]}***@${user.email.split("@")[1]}` : null
        };
    }

    // Admin Actions

    async freezeWallet(targetUserId) {
        const wallet = await this._getWalletOrThrow(targetUserId);
        if (wallet.status === "frozen") throw new AppError("Wallet is already frozen.", 400);
        await walletRepo.setStatus(targetUserId, "frozen");
        return { message: "Wallet frozen successfully." };
    }

    async unfreezeWallet(targetUserId) {
        await this._getWalletOrThrow(targetUserId);
        await walletRepo.setStatus(targetUserId, "active");
        return { message: "Wallet unfrozen successfully." };
    }

    async adminCredit(targetUserId, amount, description) {
        amount = Number(amount);
        this._validateAmount(amount);
        const wallet = await this._getWalletOrThrow(targetUserId);

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + amount;

        await walletRepo.incrementBalance(targetUserId, amount);

        await transactionRepo.create({
            txnId: snowflake.nextId(),
            fromUserId: null,
            toUserId: targetUserId,
            amount,
            type: "admin_credit",
            status: "success",
            description: description || "Admin credit",
            receiverBalanceBefore: balanceBefore,
            receiverBalanceAfter: balanceAfter
        });

        return { message: `₹${amount} credited to wallet.`, newBalance: balanceAfter };
    }

    // Private Helpers

    async _getWalletOrThrow(userId) {
        const wallet = await walletRepo.findByUserId(userId);
        if (!wallet) throw new AppError("Wallet not found.", 404);
        if (wallet.userId.toString() !== userId.toString()) {
            throw new AppError("Unauthorized access to wallet.", 403);
        }
        return wallet;
    }

    _ensureWalletActive(wallet) {
        if (wallet.status === "frozen") {
            throw new AppError("Your wallet is frozen. Please contact support.", 403);
        }
        if (wallet.status === "suspended") {
            throw new AppError("Your wallet is suspended.", 403);
        }
    }

    async _verifyPinOrThrow(wallet, pin) {
        if (wallet.pinLockUntil && new Date() < new Date(wallet.pinLockUntil)) {
            const minutesLeft = Math.ceil((new Date(wallet.pinLockUntil) - new Date()) / 1000 / 60);
            throw new AppError(`Too many failed attempts. Wallet is locked. Try again in ${minutesLeft} minutes.`, 403);
        }
        if (!wallet.isPinSet) throw new AppError("Wallet PIN is not set. Please set a PIN first.", 400);
        if (!pin) throw new AppError("Wallet PIN is required.", 400);
        const isValid = await argon2.verify(wallet.walletPin, pin.toString());
        if (!isValid) {
            await walletRepo.incrementPinAttempts(wallet.userId);
            throw new AppError("Incorrect wallet PIN.", 401);
        }
        await walletRepo.resetPinAttempts(wallet.userId);
    }

    async verifyAuthOrThrow(wallet, { pin, signature, challenge }, session = null) {
        if (wallet.pinLockUntil && new Date() < new Date(wallet.pinLockUntil)) {
            const minutesLeft = Math.ceil((new Date(wallet.pinLockUntil) - new Date()) / 1000 / 60);
            throw new AppError(`Too many failed attempts. Wallet is locked. Try again in ${minutesLeft} minutes.`, 403);
        }

        if (!pin && !signature) {
            throw new AppError("Authentication credentials (PIN or Biometric signature) are required.", 400);
        }

        if (signature) {
            if (!wallet.isBiometricEnabled || !wallet.biometricPublicKey) {
                throw new AppError("Biometric authentication is not enabled on this wallet.", 400);
            }
            if (!challenge) {
                throw new AppError("Challenge is required for biometric authentication.", 400);
            }
            if (wallet.biometricChallenge !== challenge) {
                throw new AppError("Invalid or expired biometric challenge.", 401);
            }
            if (wallet.biometricChallengeExpires && new Date() > new Date(wallet.biometricChallengeExpires)) {
                throw new AppError("Biometric challenge has expired.", 401);
            }

            const isValid = this._verifyBiometricSignature(wallet.biometricPublicKey, signature, challenge);
            if (!isValid) {
                await walletRepo.incrementPinAttempts(wallet.userId);
                throw new AppError("Biometric signature verification failed.", 401);
            }

            // Immediately clear challenge to prevent replay and reset failed attempts
            await walletRepo.clearBiometricChallenge(wallet.userId, session);
            await walletRepo.resetPinAttempts(wallet.userId, session);
            return;
        }

        if (pin) {
            if (!wallet.isPinSet) {
                throw new AppError("Wallet PIN is not set. Please set a PIN first.", 400);
            }
            const isValid = await argon2.verify(wallet.walletPin, pin.toString());
            if (!isValid) {
                await walletRepo.incrementPinAttempts(wallet.userId);
                throw new AppError("Incorrect wallet PIN.", 401);
            }
            await walletRepo.resetPinAttempts(wallet.userId, session);
        }
    }

    _verifyBiometricSignature(publicKeyPem, signature, challenge) {
        try {
            const verify = crypto.createVerify("SHA256");
            verify.update(challenge);
            verify.end();

            let signatureBuffer;
            if (/^[0-9a-fA-F]+$/.test(signature)) {
                signatureBuffer = Buffer.from(signature, "hex");
            } else {
                signatureBuffer = Buffer.from(signature, "base64");
            }

            return verify.verify(publicKeyPem, signatureBuffer);
        } catch (err) {
            return false;
        }
    }

    async _checkDailyLimit(wallet, amount) {
        const today = new Date().toISOString().split("T")[0];
        let usedToday = wallet.usedToday;

        if (wallet.lastResetDate !== today) {
            usedToday = 0;
        }

        if (usedToday + amount > wallet.dailyLimit) {
            const remaining = Math.max(0, wallet.dailyLimit - usedToday);
            throw new AppError(
                `Daily transfer limit exceeded. Remaining limit today: ₹${remaining}`,
                400
            );
        }
    }

    _validatePin(pin) {
        const pinStr = pin?.toString();
        if (!pinStr || !/^\d{4}$/.test(pinStr)) {
            throw new AppError("PIN must be exactly 4 digits.", 400);
        }
    }

    _validateAmount(amount) {
        if (!amount || isNaN(amount) || amount < 1) {
            throw new AppError("Amount must be at least ₹1.", 400);
        }
        if (amount > 500000) {
            throw new AppError("Amount cannot exceed ₹5,00,000 per transaction.", 400);
        }
    }

    _safeWallet(wallet) {
        const obj = wallet.toObject ? wallet.toObject() : { ...wallet };
        delete obj.walletPin;
        delete obj.biometricPublicKey;
        delete obj.biometricChallenge;
        delete obj.biometricChallengeExpires;
        delete obj.pinAttempts;
        delete obj.pinLockUntil;
        return obj;
    }

}

module.exports = new WalletService();
