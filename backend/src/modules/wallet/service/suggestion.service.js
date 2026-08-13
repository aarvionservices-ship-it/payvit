const transactionRepo = require("../repository/transaction.repository");
const userRepo = require("../../user/repository/user.repository");

// Curated list of popular banks in India with their IFSC prefix hints
const POPULAR_BANKS = [
    { bankName: "State Bank of India", shortName: "SBI", ifscPrefix: "SBIN", logo: "🏦", color: "#005A9C" },
    { bankName: "HDFC Bank", shortName: "HDFC", ifscPrefix: "HDFC", logo: "🏦", color: "#004C8F" },
    { bankName: "ICICI Bank", shortName: "ICICI", ifscPrefix: "ICIC", logo: "🏦", color: "#B02A30" },
    { bankName: "Axis Bank", shortName: "Axis", ifscPrefix: "UTIB", logo: "🏦", color: "#800000" },
    { bankName: "Kotak Mahindra Bank", shortName: "Kotak", ifscPrefix: "KKBK", logo: "🏦", color: "#EF4123" },
    { bankName: "Punjab National Bank", shortName: "PNB", ifscPrefix: "PUNB", logo: "🏦", color: "#005033" },
    { bankName: "Bank of Baroda", shortName: "BOB", ifscPrefix: "BARB", logo: "🏦", color: "#F37020" },
    { bankName: "Canara Bank", shortName: "Canara", ifscPrefix: "CNRB", logo: "🏦", color: "#003087" },
    { bankName: "Union Bank of India", shortName: "UBI", ifscPrefix: "UBIN", logo: "🏦", color: "#2C3E8C" },
    { bankName: "IndusInd Bank", shortName: "IndusInd", ifscPrefix: "INDB", logo: "🏦", color: "#005DA5" },
    { bankName: "Yes Bank", shortName: "Yes Bank", ifscPrefix: "YESB", logo: "🏦", color: "#00539F" },
    { bankName: "Federal Bank", shortName: "Federal", ifscPrefix: "FDRL", logo: "🏦", color: "#0070B8" },
    { bankName: "RBL Bank", shortName: "RBL", ifscPrefix: "RATN", logo: "🏦", color: "#005AAA" },
    { bankName: "IDFC FIRST Bank", shortName: "IDFC", ifscPrefix: "IDFB", logo: "🏦", color: "#E4002B" },
    { bankName: "Bank of India", shortName: "BOI", ifscPrefix: "BKID", logo: "🏦", color: "#003591" }
];

// Suggested quick-send amounts in INR
const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000, 5000];

class SuggestionService {

    // Get top 5 frequent payees for this user (last 90 days). - Enriches with basic user profile info.
    async getFrequentPayees(userId) {
        const topRecipients = await transactionRepo.getTopRecipients(userId, 5, 90);

        if (!topRecipients.length) return [];

        const User = require("../../auth/model/auth.model");

        const enriched = await Promise.all(
            topRecipients.map(async (rec) => {
                const user = await User.findOne({ userId: rec._id })
                    .select("userId name phone email")
                    .lean();

                if (!user) return null;

                return {
                    userId: rec._id,
                    name: user.name || "Unknown",
                    phone: user.phone ? `XXXXXX${user.phone.slice(-4)}` : null,
                    email: user.email ? `${user.email[0]}***@${user.email.split("@")[1]}` : null,
                    txnCount: rec.count,
                    totalSent: rec.totalAmount,
                    lastTransactionAt: rec.lastTxn
                };
            })
        );

        return enriched.filter(Boolean);
    }

    // Get last 10 transactions for the user (recent activity).
    async getRecentActivity(userId) {
        const txns = await transactionRepo.getRecentByUser(userId, 10);

        return txns.map(txn => ({
            txnId: txn.txnId,
            type: txn.type,
            amount: txn.amount,
            status: txn.status,
            description: txn.description,
            isCredit: txn.toUserId === userId,
            createdAt: txn.createdAt
        }));
    }

    // Return curated list of popular Indian banks to help users - quickly select their bank when adding an account.
    getBankSuggestions(search = "") {
        if (!search) return POPULAR_BANKS;

        const q = search.toLowerCase();
        return POPULAR_BANKS.filter(
            b =>
                b.bankName.toLowerCase().includes(q) ||
                b.shortName.toLowerCase().includes(q) ||
                b.ifscPrefix.toLowerCase().includes(q)
        );
    }

    // Suggest a transfer amount based on historical transfers to - a specific recipient. If no history, return quick-send defaults.
    async getSmartAmount(fromUserId, toUserId) {
        const history = await transactionRepo.getTypicalAmount(fromUserId, toUserId);

        let suggested = null;
        let quickAmounts = QUICK_AMOUNTS;

        if (history && history.count >= 2) {
            const avg = Math.round(history.avgAmount / 10) * 10; // Round to nearest 10
            suggested = avg;

            // Put suggested amount first, then quick amounts (excluding if duplicate)
            quickAmounts = [avg, ...QUICK_AMOUNTS.filter(a => a !== avg)].slice(0, 7);
        }

        return {
            suggestedAmount: suggested,
            basedOnHistory: history ? `Based on ${history.count} past transfers` : null,
            quickAmounts
        };
    }

    // Get summary statistics for the wallet dashboard.
    async getWalletStats(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const Transaction = require("../model/transaction.model");

        const [monthSent, monthReceived, todaySent, totalTxns] = await Promise.all([
            Transaction.aggregate([
                { $match: { fromUserId: userId, status: "success", createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            Transaction.aggregate([
                { $match: { toUserId: userId, status: "success", createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            Transaction.aggregate([
                { $match: { fromUserId: userId, status: "success", createdAt: { $gte: today } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            Transaction.countDocuments({
                $or: [{ fromUserId: userId }, { toUserId: userId }],
                status: "success"
            })
        ]);

        return {
            last30Days: {
                totalSent: monthSent[0]?.total || 0,
                totalReceived: monthReceived[0]?.total || 0
            },
            today: {
                totalSent: todaySent[0]?.total || 0
            },
            allTime: {
                totalTransactions: totalTxns
            }
        };
    }

}

module.exports = new SuggestionService();
