const snowflake = require("../../../core/utils/distributedId");
const AppError = require("../../../core/utils/AppError");
const billRepo = require("../repository/bill.repository");
const walletRepo = require("../repository/wallet.repository");
const transactionRepo = require("../repository/transaction.repository");
const mongoose = require("mongoose");

const VALID_CATEGORIES = [
    "ELECTRICITY", "WATER", "GAS", "INTERNET",
    "MOBILE", "DTH", "INSURANCE", "RENT", "OTHER"
];

class BillService {

    async getBills(userId, query = {}) {
        return await billRepo.findByUserId(userId, query);
    }

    async linkBill(userId, { provider, category, amount, dueDate, autopay }) {
        if (!provider || typeof provider !== "string" || provider.trim().length === 0) {
            throw new AppError("Provider name is required.", 400);
        }

        const cat = (category || "OTHER").toUpperCase();
        if (!VALID_CATEGORIES.includes(cat)) {
            throw new AppError(`Category must be one of: ${VALID_CATEGORIES.join(", ")}.`, 400);
        }

        const numAmount = Number(amount);
        if (typeof numAmount !== "number" || !Number.isFinite(numAmount) || isNaN(numAmount) || numAmount < 0) {
            throw new AppError("Bill amount must be a valid non-negative number.", 400);
        }

        if (dueDate && isNaN(new Date(dueDate).getTime())) {
            throw new AppError("Invalid due date.", 400);
        }

        const wallet = await walletRepo.findByUserId(userId);

        const bill = await billRepo.create({
            billId: snowflake.nextId(),
            userId,
            walletId: wallet?.walletId || null,
            provider: provider.trim(),
            category: cat,
            amount: Number(amount),
            dueDate: dueDate ? new Date(dueDate) : null,
            autopay: autopay === true || autopay === "true",
            status: "UPCOMING"
        });

        return {
            message: "Bill provider linked successfully.",
            bill
        };
    }

    async payBill(userId, { billId, pin, signature, challenge }) {
        const bill = await billRepo.findByIdAndUser(billId, userId);
        if (!bill) throw new AppError("Bill not found.", 404);
        if (bill.status === "PAID") throw new AppError("Bill is already paid.", 400);
        if (bill.status === "FAILED") throw new AppError("Bill is in failed state. Please re-link.", 400);

        const walletService = require("./wallet.service");
        const wallet = await walletRepo.findByUserId(userId);
        if (!wallet) throw new AppError("Wallet not found.", 404);

        // Verify auth (PIN or biometric)
        await walletService.verifyAuthOrThrow(wallet, { pin, signature, challenge });

        if (wallet.balance < bill.amount) {
            throw new AppError(`Insufficient balance. Available: ₹${wallet.balance}`, 400);
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const balanceBefore = wallet.balance;
            const balanceAfter = balanceBefore - bill.amount;

            const txn = await transactionRepo.create({
                txnId: snowflake.nextId(),
                fromUserId: userId,
                toUserId: null,
                amount: bill.amount,
                type: "token_spend",
                status: "success",
                description: `Bill payment – ${bill.provider} (${bill.category})`,
                senderBalanceBefore: balanceBefore,
                senderBalanceAfter: balanceAfter,
                metadata: {
                    billId: bill.billId,
                    provider: bill.provider,
                    category: bill.category
                }
            }, session);

            await walletRepo.incrementBalance(userId, -bill.amount, session);
            await walletRepo.incrementTxnCount(userId, session);

            await session.commitTransaction();
            session.endSession();

            // Mark bill as paid (outside session — non-critical)
            await billRepo.markPaid(bill.billId, userId, txn.txnId);

            return {
                message: `₹${bill.amount} paid to ${bill.provider} successfully.`,
                txnId: txn.txnId,
                newBalance: balanceAfter
            };
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            if (err instanceof AppError || err.name === "AppError") throw err;
            throw new AppError("Bill payment failed. Please try again.", 500);
        }
    }
}

module.exports = new BillService();
