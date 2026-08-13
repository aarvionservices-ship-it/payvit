const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        txnId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        fromUserId: {
            type: String,
            index: true,
            default: null   // null for bank top-up (external source)
        },

        toUserId: {
            type: String,
            index: true,
            default: null   // null for bank withdrawal (external dest)
        },

        amount: {
            type: Number,
            required: true,
            min: 1
        },

        fee: {
            type: Number,
            default: 0
        },

        type: {
            type: String,
            enum: [
                "wallet_transfer",      // P2P: user to user (token transfer)
                "bank_topup",           // bank account → wallet (buy tokens)
                "bank_withdrawal",      // wallet → bank account (redeem tokens)
                "bank_transfer",        // direct bank → bank (NEFT/IMPS/RTGS)
                "recharge_payment",     // wallet used for recharge
                "refund",               // reversal / refund
                "admin_credit",         // admin manual credit
                "admin_debit",          // admin manual debit
                "token_spend"           // tokens spent on a service/merchant
            ],
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "success", "failed", "reversed"],
            default: "pending"
        },

        description: {
            type: String,
            default: ""
        },

        // Snapshot of balance at time of transaction
        senderBalanceBefore: {
            type: Number,
            default: null
        },
        senderBalanceAfter: {
            type: Number,
            default: null
        },
        receiverBalanceBefore: {
            type: Number,
            default: null
        },
        receiverBalanceAfter: {
            type: Number,
            default: null
        },

        // Bank account reference for topups/withdrawals
        bankAccountId: {
            type: String,
            default: null
        },

        // Security & audit
        ipAddress: {
            type: String,
            default: null
        },

        deviceInfo: {
            type: String,
            default: null
        },

        flaggedAsFraud: {
            type: Boolean,
            default: false
        },

        fraudReason: {
            type: String,
            default: null
        },

        // For reversals: link to the original transaction
        relatedTxnId: {
            type: String,
            default: null
        },

        // Extra metadata (gateway response, UPI ref, etc.)
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    { timestamps: true }
);

// Index for fast history queries
transactionSchema.index({ fromUserId: 1, createdAt: -1 });
transactionSchema.index({ toUserId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, type: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
