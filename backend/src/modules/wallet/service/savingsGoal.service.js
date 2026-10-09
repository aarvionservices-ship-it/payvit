const snowflake = require("../../../core/utils/distributedId");
const AppError = require("../../../core/utils/AppError");
const savingsGoalRepo = require("../repository/savingsGoal.repository");
const walletRepo = require("../repository/wallet.repository");

class SavingsGoalService {

    async getGoals(userId, query = {}) {
        return await savingsGoalRepo.findByUserId(userId, query);
    }

    async createGoal(userId, { title, targetAmount, targetDate }) {
        if (!title || typeof title !== "string" || title.trim().length === 0) {
            throw new AppError("Goal title is required.", 400);
        }
        if (!targetAmount || isNaN(targetAmount) || Number(targetAmount) < 1) {
            throw new AppError("Target amount must be at least ₹1.", 400);
        }
        if (targetDate && isNaN(new Date(targetDate).getTime())) {
            throw new AppError("Invalid target date.", 400);
        }
        if (targetDate && new Date(targetDate) <= new Date()) {
            throw new AppError("Target date must be in the future.", 400);
        }

        // Fetch walletId if wallet exists
        const wallet = await walletRepo.findByUserId(userId);

        const goal = await savingsGoalRepo.create({
            goalId: snowflake.nextId(),
            userId,
            walletId: wallet?.walletId || null,
            title: title.trim(),
            targetAmount: Number(targetAmount),
            savedAmount: 0,
            targetDate: targetDate ? new Date(targetDate) : null,
            status: "ACTIVE"
        });

        return goal;
    }

    async updateGoal(userId, goalId, updates) {
        const goal = await savingsGoalRepo.findByIdAndUser(goalId, userId);
        if (!goal) throw new AppError("Savings goal not found.", 404);

        const allowed = {};

        if (updates.title !== undefined) {
            if (typeof updates.title !== "string" || updates.title.trim().length === 0) {
                throw new AppError("Goal title cannot be empty.", 400);
            }
            allowed.title = updates.title.trim();
        }

        if (updates.targetAmount !== undefined) {
            const amt = Number(updates.targetAmount);
            if (isNaN(amt) || amt < 1) throw new AppError("Target amount must be at least ₹1.", 400);
            allowed.targetAmount = amt;
        }

        if (updates.targetDate !== undefined) {
            if (updates.targetDate && isNaN(new Date(updates.targetDate).getTime())) {
                throw new AppError("Invalid target date.", 400);
            }
            allowed.targetDate = updates.targetDate ? new Date(updates.targetDate) : null;
        }

        if (updates.status !== undefined) {
            const validStatuses = ["ACTIVE", "COMPLETED", "PAUSED"];
            if (!validStatuses.includes(updates.status)) {
                throw new AppError(`Status must be one of: ${validStatuses.join(", ")}.`, 400);
            }
            allowed.status = updates.status;
        }

        if (updates.savedAmount !== undefined) {
            const saved = Number(updates.savedAmount);
            if (isNaN(saved) || saved < 0) throw new AppError("Saved amount must be 0 or more.", 400);
            allowed.savedAmount = saved;
        }

        if (Object.keys(allowed).length === 0) {
            throw new AppError("No valid fields provided for update.", 400);
        }

        const updated = await savingsGoalRepo.update(goalId, userId, allowed);
        if (!updated) throw new AppError("Failed to update savings goal.", 500);

        return updated;
    }

    async deleteGoal(userId, goalId) {
        const goal = await savingsGoalRepo.findByIdAndUser(goalId, userId);
        if (!goal) throw new AppError("Savings goal not found.", 404);

        await savingsGoalRepo.delete(goalId, userId);
        return { message: "Savings goal deleted successfully." };
    }
}

module.exports = new SavingsGoalService();
