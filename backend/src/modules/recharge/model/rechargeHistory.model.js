const mongoose = require("mongoose");

const rechargeHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RechargeService",
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        required: true,
        enum: ["Pending", "Processing", "Succeeded", "Failed", "Cancelled", "Refunded"],
        default: "Pending"
    },
    customerDetails: {
        mobileNumber: {
            type: String,
            trim: true
        },
        accountNumber: {
            type: String,
            trim: true
        },
        billingCycle: String,
        otherDetails: mongoose.Schema.Types.Mixed
    },
    paymentDetails: {
        method: String,
        provider: String,
        transactionId: String,
        errorMessage: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true });

module.exports = mongoose.model("RechargeHistory", rechargeHistorySchema);

