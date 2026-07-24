const mongoose = require("mongoose");
const walletRepository = require("../repository/wallet.repository");
const User = require("../../auth/model/auth.model");
const AppError = require("../../../core/utils/AppError");

class WalletService {
    async getOrCreateWallet(userId) {
        let wallet = await walletRepository.findByUserId(userId);
        if (!wallet) {
            wallet = await walletRepository.createWallet(userId);
        }
        return wallet;
    }

    async getWalletDetails(userId, query = {}) {
        const wallet = await this.getOrCreateWallet(userId);
        const limit = parseInt(query.limit) || 10;
        const page = parseInt(query.page) || 1;
        const skip = (page - 1) * limit;

        const total = await walletRepository.countTransactions(userId);
        const transactions = await walletRepository.getTransactions(userId, limit, skip);

        return {
            balance: wallet.balance,
            transactions,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async addMoney(userId, amount) {
        if (!amount || amount <= 0) {
            throw new AppError("Amount must be greater than zero", 400);
        }

        // Fetch/create wallet
        await this.getOrCreateWallet(userId);

        // Update balance
        const wallet = await walletRepository.updateBalance(userId, amount);

        // Create transaction history log
        await walletRepository.createTransaction({
            userId,
            type: "credit",
            amount,
            transactionType: "deposit",
            description: `Deposited ₹${amount} into wallet`,
            status: "Success"
        });

        return wallet;
    }

    async transferTokens(senderUserId, recipientQuery, amount, description) {
        if (!amount || amount <= 0) {
            throw new AppError("Transfer amount must be greater than zero", 400);
        }

        // 1. Fetch sender's wallet
        const senderWallet = await this.getOrCreateWallet(senderUserId);
        if (senderWallet.balance < amount) {
            throw new AppError("Insufficient balance for this transfer", 400);
        }

        // 2. Find recipient user
        const cleanQuery = recipientQuery.trim();
        const recipient = await User.findOne({
            $or: [
                { email: cleanQuery },
                { phone: cleanQuery },
                { userId: cleanQuery }
            ]
        });

        if (!recipient) {
            throw new AppError("Recipient user not found", 404);
        }

        if (recipient.userId === senderUserId) {
            throw new AppError("You cannot transfer tokens to yourself", 400);
        }

        const senderUser = await User.findOne({ userId: senderUserId });
        const senderName = senderUser?.name || "Unknown Sender";
        const recipientName = recipient.name || "Unknown Recipient";

        // Fetch/create recipient wallet
        await this.getOrCreateWallet(recipient.userId);

        // 3. Process transfer (Using MongoDB session transaction if replica set supports it, or direct updates)
        // Since local setups might not have replica sets enabled for transactions, we'll perform updates and log
        let session;
        try {
            session = await mongoose.startSession();
            session.startTransaction();

            // Deduct sender balance
            await walletRepository.updateBalance(senderUserId, -amount, session);

            // Add recipient balance
            await walletRepository.updateBalance(recipient.userId, amount, session);

            // Log debit transaction for sender
            await walletRepository.createTransaction({
                userId: senderUserId,
                type: "debit",
                amount,
                transactionType: "transfer",
                peerUserId: recipient.userId,
                peerName: recipientName,
                description: description || `Transferred to ${recipientName}`,
                status: "Success"
            }, session);

            // Log credit transaction for recipient
            await walletRepository.createTransaction({
                userId: recipient.userId,
                type: "credit",
                amount,
                transactionType: "transfer",
                peerUserId: senderUserId,
                peerName: senderName,
                description: description || `Received from ${senderName}`,
                status: "Success"
            }, session);

            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            if (session) {
                await session.abortTransaction();
                session.endSession();
            }
            // Fallback for environment without replication support
            const isNoTransactionSupport = error.message && (
                error.message.includes("does not support transactions") ||
                error.message.includes("replica set member or mongos") ||
                error.message.includes("Transaction numbers")
            );
            if (isNoTransactionSupport) {
                // Deduct sender balance
                await walletRepository.updateBalance(senderUserId, -amount);

                // Add recipient balance
                await walletRepository.updateBalance(recipient.userId, amount);

                // Log debit transaction for sender
                await walletRepository.createTransaction({
                    userId: senderUserId,
                    type: "debit",
                    amount,
                    transactionType: "transfer",
                    peerUserId: recipient.userId,
                    peerName: recipientName,
                    description: description || `Transferred to ${recipientName}`,
                    status: "Success"
                });

                // Log credit transaction for recipient
                await walletRepository.createTransaction({
                    userId: recipient.userId,
                    type: "credit",
                    amount,
                    transactionType: "transfer",
                    peerUserId: senderUserId,
                    peerName: senderName,
                    description: description || `Received from ${senderName}`,
                    status: "Success"
                });
            } else {
                throw error;
            }
        }

        const updatedWallet = await walletRepository.findByUserId(senderUserId);
        return {
            balance: updatedWallet.balance,
            transferredTo: recipientName
        };
    }

    async searchUser(query) {
        if (!query || query.length < 3) {
            return [];
        }

        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
                { phone: { $regex: query, $options: "i" } }
            ]
        })
        .select("userId name email phone role")
        .limit(5);

        return users;
    }
}

module.exports = new WalletService();
