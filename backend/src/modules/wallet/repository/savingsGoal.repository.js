const SavingsGoal = require("../model/savingsGoal.model");

class SavingsGoalRepository {

    async create(data) {
        const goal = new SavingsGoal(data);
        return await goal.save();
    }

    async findByUserId(userId, query = {}) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = { userId };
        if (query.status) filter.status = query.status;

        const [data, total] = await Promise.all([
            SavingsGoal.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            SavingsGoal.countDocuments(filter)
        ]);

        return {
            goals: data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findByIdAndUser(goalId, userId) {
        return await SavingsGoal.findOne({ goalId, userId });
    }

    async update(goalId, userId, updates) {
        return await SavingsGoal.findOneAndUpdate(
            { goalId, userId },
            { $set: updates },
            { returnDocument: "after" }
        );
    }

    async delete(goalId, userId) {
        return await SavingsGoal.findOneAndDelete({ goalId, userId });
    }

    async getActiveByUser(userId, limit = 5) {
        return await SavingsGoal.find({ userId, status: "ACTIVE" })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }

    async incrementSaved(goalId, userId, amount) {
        const goal = await this.findByIdAndUser(goalId, userId);
        if (!goal) return null;

        const newSaved = Math.min(goal.savedAmount + amount, goal.targetAmount);
        const newStatus = newSaved >= goal.targetAmount ? "COMPLETED" : goal.status;

        return await SavingsGoal.findOneAndUpdate(
            { goalId, userId },
            { $set: { savedAmount: newSaved, status: newStatus } },
            { returnDocument: "after" }
        );
    }
}

module.exports = new SavingsGoalRepository();
