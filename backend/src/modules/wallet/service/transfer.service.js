const argon2 = require("argon2");
const mongoose = require("mongoose");
const snowflake = require("../../../core/utils/distributedId");
const AppError = require("../../../core/utils/AppError");

const walletRepo = require("../repository/wallet.repository");
const transactionRepo = require("../repository/transaction.repository");
const userRepo = require("../../user/repository/user.repository");
const walletService = require("./wallet.service");

class TransferService {

    // Search for a recipient by phone number or email. - Returns minimal info (name, masked phone, userId) for UI.
    async searchRecipient(query) {
        if (!query || query.trim().length < 3) {
            throw new AppError("Please enter at least 3 characters to search.", 400);
        }

        const isPhone = /^\d{10}$/.test(query.trim());
        const filter = isPhone
            ? { phone: query.trim() }
            : { email: { $regex: `^${query.trim()}$`, $options: "i" } };

        const User = require("../../auth/model/auth.model");
        const user = await User.findOne({ ...filter, isActive: true })
            .select("userId name phone email")
            .lean();

        if (!user) throw new AppError("No user found with that phone/email.", 404);

        // Check recipient has a wallet
        const recipientWallet = await walletRepo.findByUserId(user.userId);
        if (!recipientWallet) throw new AppError("Recipient does not have a Payvit wallet.", 400);
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

    // Transfer money from one user's wallet to another. - Uses MongoDB atomic session to ensure consistency.
    async transferToWallet(fromUserId, { toUserId, amount, pin, signature, challenge, description, ipAddress, deviceInfo }) {
        amount = Number(amount);
        this._validateAmount(amount);

        if (fromUserId === toUserId) {
            throw new AppError("Cannot transfer money to your own wallet.", 400);
        }

        // Load sender wallet
        const senderWallet = await walletRepo.findByUserId(fromUserId);
        if (!senderWallet) throw new AppError("Your wallet was not found.", 404);
        this._ensureWalletActive(senderWallet, "sender");
        await walletService.verifyAuthOrThrow(senderWallet, { pin, signature, challenge });

        // Check balance
        if (senderWallet.balance < amount) {
            throw new AppError(`Insufficient balance. Available: ₹${senderWallet.balance}`, 400);
        }

        if (!senderWallet.kycVerified && amount > 10000) {
            throw new AppError("KYC required for transfers above ₹10,000. Complete Aadhaar KYC first.", 403);
        }

        // Check daily limit
        await this._checkDailyLimit(senderWallet, amount);

        // Load receiver wallet
        const receiverWallet = await walletRepo.findByUserId(toUserId);
        if (!receiverWallet) throw new AppError("Recipient wallet not found.", 404);
        this._ensureWalletActive(receiverWallet, "receiver");

        // Fraud detection: flag transfers ≥ ₹25,000
        const isSuspicious = amount >= 25000;

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const senderBefore = senderWallet.balance;
            const senderAfter = senderBefore - amount;
            const receiverBefore = receiverWallet.balance;
            const receiverAfter = receiverBefore + amount;
            const txnId = snowflake.nextId();

            const txn = await transactionRepo.create({
                txnId,
                fromUserId,
                toUserId,
                amount,
                fee: 0,
                type: "wallet_transfer",
                status: "success",
                description: description || `Wallet transfer to user`,
                senderBalanceBefore: senderBefore,
                senderBalanceAfter: senderAfter,
                receiverBalanceBefore: receiverBefore,
                receiverBalanceAfter: receiverAfter,
                ipAddress: ipAddress || null,
                deviceInfo: deviceInfo || null,
                flaggedAsFraud: isSuspicious,
                fraudReason: isSuspicious ? "High-value transfer flagged for review" : null
            }, session);

            // Atomic: debit sender, credit receiver
            await walletRepo.incrementBalance(fromUserId, -amount, session);
            await walletRepo.incrementBalance(toUserId, amount, session);

            // Update daily usage & txn counts
            await walletRepo.updateUsedToday(fromUserId, amount, session);
            await walletRepo.incrementTxnCount(fromUserId, session);
            await walletRepo.incrementTxnCount(toUserId, session);

            await session.commitTransaction();
            session.endSession();

            return {
                message: `₹${amount} sent successfully.`,
                txnId,
                newBalance: senderAfter,
                note: isSuspicious ? "This transfer is under review due to high value." : undefined
            };

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            if (err instanceof AppError) throw err;
            throw new AppError("Transfer failed. No money was deducted. Please try again.", 500);
        }
    }

    // Transfer money to a user using QR code data.
    async transferViaQr(fromUserId, payload) {
        const { qrData, amount, pin, signature, challenge, description, ipAddress, deviceInfo } = payload;
        
        // 1. Resolve recipient from QR
        const resolved = await walletService.resolveQrCode(qrData);
        
        // 2. Perform wallet transfer to the resolved user
        return await this.transferToWallet(fromUserId, {
            toUserId: resolved.userId,
            amount,
            pin,
            signature,
            challenge,
            description: description || `QR Code money transfer to ${resolved.name}`,
            ipAddress,
            deviceInfo
        });
    }

    // Admin: Reverse a completed wallet transfer. - Credits sender back, debits receiver.
    async reverseTransaction(txnId, adminUserId) {
        const txn = await transactionRepo.findById(txnId);
        if (!txn) throw new AppError("Transaction not found.", 404);
        if (txn.status !== "success") throw new AppError("Only successful transactions can be reversed.", 400);
        if (txn.type !== "wallet_transfer") {
            throw new AppError("Only wallet-to-wallet transfers can be reversed.", 400);
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const reversalId = snowflake.nextId();

            // Create reversal transaction record
            await transactionRepo.create({
                txnId: reversalId,
                fromUserId: txn.toUserId,
                toUserId: txn.fromUserId,
                amount: txn.amount,
                type: "refund",
                status: "success",
                description: `Reversal of transaction ${txnId}`,
                relatedTxnId: txnId,
                metadata: { reversedBy: adminUserId }
            }, session);

            // Update original txn status to reversed
            await transactionRepo.updateStatus(txnId, "reversed", session);

            // Restore money: debit receiver, credit sender
            await walletRepo.incrementBalance(txn.toUserId, -txn.amount, session);
            await walletRepo.incrementBalance(txn.fromUserId, txn.amount, session);

            await session.commitTransaction();
            session.endSession();

            return {
                message: "Transaction reversed successfully.",
                reversalTxnId: reversalId,
                originalTxnId: txnId
            };

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw new AppError("Reversal failed. Please try again.", 500);
        }
    }

    // Private Helpers

    _ensureWalletActive(wallet, role = "user") {
        if (wallet.status === "frozen") {
            throw new AppError(
                role === "receiver"
                    ? "Recipient's wallet is frozen."
                    : "Your wallet is frozen. Contact support.",
                403
            );
        }
        if (wallet.status === "suspended") {
            throw new AppError(
                role === "receiver"
                    ? "Recipient's wallet is suspended."
                    : "Your wallet is suspended.",
                403
            );
        }
    }



    async _checkDailyLimit(wallet, amount) {
        const today = new Date().toISOString().split("T")[0];
        let usedToday = wallet.usedToday;
        if (wallet.lastResetDate !== today) usedToday = 0;

        if (usedToday + amount > wallet.dailyLimit) {
            const remaining = Math.max(0, wallet.dailyLimit - usedToday);
            throw new AppError(
                `Daily transfer limit of ₹${wallet.dailyLimit} exceeded. You can transfer ₹${remaining} more today.`,
                400
            );
        }
    }

    _validateAmount(amount) {
        if (!amount || isNaN(amount) || amount < 1) {
            throw new AppError("Transfer amount must be at least ₹1.", 400);
        }
        if (amount > 100000) {
            throw new AppError("Single transfer cannot exceed ₹1,00,000.", 400);
        }
    }

}

module.exports = new TransferService();
