const BankTransfer = require("../model/bankTransfer.model");

class BankTransferRepository {

    // Persist a new bank transfer record. - @param {Object} data - @param {import("mongoose").ClientSession|null} session
    async create(data, session = null) {
        const opts = session ? { session } : {};
        const transfer = new BankTransfer(data);
        return await transfer.save(opts);
    }

    // Find a transfer by its snowflake txnId. - Returns the raw document (with encrypted account number).
    async findById(txnId) {
        return await BankTransfer.findOne({ txnId });
    }

    // Paginated transfer history for a user. - Supports filters: status, mode, from/to date range.
    async findByUser(userId, query = {}) {
        const page  = parseInt(query.page)  || 1;
        const limit = parseInt(query.limit) || 20;
        const skip  = (page - 1) * limit;

        const filter = { userId };

        if (query.status) filter.status = query.status;
        if (query.mode)   filter.mode   = query.mode;

        if (query.from || query.to) {
            filter.createdAt = {};
            if (query.from) filter.createdAt.$gte = new Date(query.from);
            if (query.to)   filter.createdAt.$lte = new Date(query.to);
        }

        const [rawData, total] = await Promise.all([
            BankTransfer.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            BankTransfer.countDocuments(filter)
        ]);

        // Strip encrypted beneficiary account number before returning
        const data = rawData.map(({ toAccountNumberEncrypted, ...safe }) => safe);

        return { data, total, page, limit };
    }

    // Update the status of a transfer (e.g. pending → success / failed). - @param {string} txnId - @param {string} status - @param {import("mongoose").ClientSession|null} session
    async updateStatus(txnId, status, session = null) {
        const opts = session ? { session } : {};
        return await BankTransfer.findOneAndUpdate(
            { txnId },
            { $set: { status } },
            { returnDocument: 'after', ...opts }
        );
    }

    // Update status and attach a UTR number from the payment gateway.
    async markSuccess(txnId, utrNumber, session = null) {
        const opts = session ? { session } : {};
        return await BankTransfer.findOneAndUpdate(
            { txnId },
            { $set: { status: "success", utrNumber } },
            { returnDocument: 'after', ...opts }
        );
    }

    // Mark a transfer as failed with a reason stored in metadata.
    async markFailed(txnId, reason = "", session = null) {
        const opts = session ? { session } : {};
        return await BankTransfer.findOneAndUpdate(
            { txnId },
            {
                $set: { status: "failed" },
                $push: { "metadata.failureReasons": reason }
            },
            { returnDocument: 'after', ...opts }
        );
    }

    // Total amount transferred by a user in the current calendar day - (across all modes, successful only — used for daily limit checks).
    async getDailyTotal(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await BankTransfer.aggregate([
            {
                $match: {
                    userId,
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

}

module.exports = new BankTransferRepository();
