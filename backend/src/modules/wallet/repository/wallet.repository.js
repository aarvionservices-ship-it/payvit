const Wallet = require("../model/wallet.model");
const WalletTransaction = require("../model/transaction.model");

class WalletRepository {
    async findByUserId(userId) {
        return await Wallet.findOne({ userId });
    }

    async createWallet(userId) {
        return await Wallet.create({ userId, balance: 0 });
    }

    async updateBalance(userId, amount, session = null) {
        const query = { userId };
        const update = { $inc: { balance: amount } };
        const options = { new: true, upsert: true };
        if (session) {
            options.session = session;
        }
        return await Wallet.findOneAndUpdate(query, update, options);
    }

    async createTransaction(data, session = null) {
        if (session) {
            const [transaction] = await WalletTransaction.create([data], { session });
            return transaction;
        }
        return await WalletTransaction.create(data);
    }

    async getTransactions(userId, limit = 20, skip = 0) {
        return await WalletTransaction.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);
    }

    async countTransactions(userId) {
        return await WalletTransaction.countDocuments({ userId });
    }
}

module.exports = new WalletRepository();
