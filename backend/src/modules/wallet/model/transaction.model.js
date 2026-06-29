const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: ["credit", "debit"],
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01
        },
        transactionType: {
            type: String,
            enum: ["deposit", "transfer"],
            required: true
        },
        peerUserId: {
            type: String,
            default: null
        },
        peerName: {
            type: String,
            default: null
        },
        description: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["Success", "Failed"],
            default: "Success"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("WalletTransaction", transactionSchema);
