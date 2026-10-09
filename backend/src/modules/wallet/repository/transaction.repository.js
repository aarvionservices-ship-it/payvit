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

        // Filter setup
        let filter = {
            $or: [{ fromUserId: userId }, { toUserId: userId }]
        };

        // Type filter (DEBIT / CREDIT or mapped category or raw type)
        const categoryToTypeMap = {
            ADD_MONEY:      "bank_topup",
            SEND:           "wallet_transfer",
            RECEIVE:        "wallet_transfer",
            QR_PAYMENT:     "wallet_transfer",
            BILL_PAYMENT:   "token_spend",
            TRANSFER:       "wallet_transfer",
            WITHDRAWAL:     "bank_withdrawal",
            REFUND:         "refund",
            REVERSAL:       "refund"
        };

        if (query.type) {
            const t = query.type.toUpperCase();
            if (t === "DEBIT") {
                filter = { fromUserId: userId };
            } else if (t === "CREDIT") {
                filter = { toUserId: userId };
            } else {
                filter.type = query.type;
            }
        } else if (query.category) {
            const mappedType = categoryToTypeMap[query.category.toUpperCase()] || query.category.toLowerCase();
            if (mappedType) filter.type = mappedType;
        }

        if (query.status) {
            filter.status = query.status.toLowerCase();
        }

        // Date range — support both from/to (legacy) and startDate/endDate (spec)
        const dateFrom = query.startDate || query.from;
        const dateTo   = query.endDate   || query.to;
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo)   filter.createdAt.$lte = new Date(dateTo);
        }

        // Month/year filter (for statement endpoint)
        if (query.month && query.year) {
            const m = parseInt(query.month);
            const y = parseInt(query.year);
            const start = new Date(y, m - 1, 1);
            const end   = new Date(y, m, 0, 23, 59, 59, 999);
            filter.createdAt = { $gte: start, $lte: end };
        }

        // Full-text search on description field (NoSQL regex injection protection)
        if (query.search && typeof query.search === "string") {
            const sanitizedSearch = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            if (sanitizedSearch.length > 0) {
                filter.description = { $regex: sanitizedSearch, $options: "i" };
            }
        }

        // Sort direction
        const sortDir = query.sort === "asc" ? 1 : -1;

        const [rawTxns, total] = await Promise.all([
            Transaction.find(filter)
                .sort({ createdAt: sortDir })
                .skip(skip)
                .limit(limit)
                .lean(),
            Transaction.countDocuments(filter)
        ]);

        const formattedTxns = rawTxns.map(txn => this._formatTransaction(txn, userId));

        return {
            transactions: formattedTxns,
            data: formattedTxns,   // keep backward compat alias
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalRecords: total
        };
    }

    _formatTransaction(txn, userId) {
        const isDebit = txn.fromUserId === userId;
        let category = txn.metadata?.category || "TRANSFER";

        if (txn.type === "bank_topup") category = "ADD_MONEY";
        else if (txn.type === "bank_withdrawal") category = "WITHDRAWAL";
        else if (txn.type === "token_spend") category = "BILL_PAYMENT";
        else if (txn.type === "refund") category = "REFUND";
        else if (txn.type === "wallet_transfer") {
            if (txn.metadata?.isQr || txn.metadata?.category === "QR_PAYMENT") {
                category = "QR_PAYMENT";
            } else {
                category = isDebit ? "SEND" : "RECEIVE";
            }
        }

        const paymentMethod = txn.metadata?.paymentMethod || (txn.type.includes("bank") ? "BANK" : "WALLET");

        return {
            ...txn,
            transactionId: txn.txnId,
            walletId: txn.walletId || null,
            userId: userId,
            referenceId: txn.txnId,
            type: isDebit ? "DEBIT" : "CREDIT",
            category: txn.category || category,
            title: txn.description || (isDebit ? "Money Sent" : "Money Received"),
            subtitle: txn.metadata?.serviceName || txn.metadata?.provider || (isDebit ? "Paid from Wallet" : "Credited to Wallet"),
            amount: txn.amount,
            currency: txn.currency || "INR",
            status: (txn.status || "success").toUpperCase(),
            paymentMethod,
            receiverName: txn.metadata?.senderName || txn.metadata?.receiverName || null,
            receiverWallet: txn.toUserId || null,
            senderWallet: txn.fromUserId || null,
            createdAt: txn.createdAt,
            completedAt: txn.updatedAt || txn.createdAt,
            remarks: txn.description || ""
        };
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
