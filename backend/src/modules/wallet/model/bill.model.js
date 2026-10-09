const mongoose = require("mongoose");
const snowflake = require("../../../core/utils/distributedId");

const billSchema = new mongoose.Schema(
    {
        billId: {
            type: String,
            unique: true,
            index: true
        },

        walletId: {
            type: String,
            default: null,
            index: true
        },

        userId: {
            type: String,
            required: true,
            index: true
        },

        provider: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            enum: [
                "ELECTRICITY",
                "WATER",
                "GAS",
                "INTERNET",
                "MOBILE",
                "DTH",
                "INSURANCE",
                "RENT",
                "OTHER"
            ],
            default: "OTHER"
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        dueDate: {
            type: Date,
            default: null
        },

        autopay: {
            type: Boolean,
            default: false
        },

        status: {
            type: String,
            enum: ["UPCOMING", "PENDING", "PAID", "FAILED"],
            default: "UPCOMING"
        },

        paidAt: {
            type: Date,
            default: null
        },

        transactionId: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

// Auto-generate billId before save if not set
billSchema.pre("save", function (next) {
    if (!this.billId) {
        this.billId = snowflake.nextId();
    }
    if (typeof next === "function") next();
});

// Index for upcoming bills query
billSchema.index({ userId: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model("Bill", billSchema);
