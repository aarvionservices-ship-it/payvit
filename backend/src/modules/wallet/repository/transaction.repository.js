const Transaction = require("../model/transaction.model");

class TransactionRepository {

    async create(data, session = null) {
        const opts = session ? { session } : {};
        const txn = new Transaction(data);
        return await txn.save(opts);
    }

    async findById(txnId) {
        return await Transaction.findOne({ txnId });
    }

    async findByUser(userId, query = {}) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {
            $or: [{ fromUserId: userId }, { toUserId: userId }]
        };

        if (query.type) filter.type = query.type;
        if (query.status) filter.status = query.status;

        // Date range filter
        if (query.from || query.to) {
            filter.createdAt = {};
            if (query.from) filter.createdAt.$gte = new Date(query.from);
            if (query.to) filter.createdAt.$lte = new Date(query.to);
        }

        const [data, total] = await Promise.all([
            Transaction.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Transaction.countDocuments(filter)
        ]);

        return { data, total, page, limit };
    }

    async updateStatus(txnId, status, session = null) {
        const opts = session ? { session } : {};
        return await Transaction.findOneAndUpdate(
            { txnId },
            { $set: { status } },
            { returnDocument: 'after', ...opts }
        );
    }

    async getDailyDebitTotal(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await Transaction.aggregate([
            {
                $match: {
                    fromUserId: userId,
                    status: "success",
                    createdAt: { $gte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        return result[0]?.total || 0;
    }

    async getTopRecipients(userId, limit = 5, days = 90) {
        const since = new Date();
        since.setDate(since.getDate() - days);

        return await Transaction.aggregate([
            {
                $match: {
                    fromUserId: userId,
                    type: "wallet_transfer",
                    status: "success",
                    toUserId: { $ne: null },
                    createdAt: { $gte: since }
                }
            },
            {
                $group: {
                    _id: "$toUserId",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
                    lastTxn: { $max: "$createdAt" }
                }
            },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]);
    }

    async getRecentByUser(userId, limit = 10) {
        return await Transaction.find({
            $or: [{ fromUserId: userId }, { toUserId: userId }],
            status: "success"
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }

    async getTypicalAmount(fromUserId, toUserId) {
        const result = await Transaction.aggregate([
            {
                $match: {
                    fromUserId,
                    toUserId,
                    type: "wallet_transfer",
                    status: "success"
                }
            },
            {
                $group: {
                    _id: null,
                    avgAmount: { $avg: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        return result[0] || null;
    }

}

module.exports = new TransactionRepository();
