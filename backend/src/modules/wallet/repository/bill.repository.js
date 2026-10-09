const Bill = require("../model/bill.model");

class BillRepository {

    async create(data) {
        const bill = new Bill(data);
        return await bill.save();
    }

    async findByUserId(userId, query = {}) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = { userId };
        if (query.status) filter.status = query.status;
        if (query.category) filter.category = query.category;

        const [data, total] = await Promise.all([
            Bill.find(filter)
                .sort({ dueDate: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Bill.countDocuments(filter)
        ]);

        return {
            bills: data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findByIdAndUser(billId, userId) {
        return await Bill.findOne({ billId, userId });
    }

    async update(billId, userId, updates) {
        return await Bill.findOneAndUpdate(
            { billId, userId },
            { $set: updates },
            { returnDocument: "after" }
        );
    }

    async getUpcomingByUser(userId, limit = 5) {
        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);

        return await Bill.find({
            userId,
            status: { $in: ["UPCOMING", "PENDING"] },
            dueDate: { $gte: now, $lte: nextMonth }
        })
            .sort({ dueDate: 1 })
            .limit(limit)
            .lean();
    }

    async markPaid(billId, userId, transactionId) {
        return await Bill.findOneAndUpdate(
            { billId, userId },
            {
                $set: {
                    status: "PAID",
                    paidAt: new Date(),
                    transactionId: transactionId || null
                }
            },
            { returnDocument: "after" }
        );
    }
}

module.exports = new BillRepository();
