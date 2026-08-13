const mongoose = require("mongoose");
const snowflake = require("../../../core/utils/distributedId");

const savingsGoalSchema = new mongoose.Schema(
    {
        goalId: {
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

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },

        targetAmount: {
            type: Number,
            required: true,
            min: 1
        },

        savedAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        targetDate: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["ACTIVE", "COMPLETED", "PAUSED"],
            default: "ACTIVE"
        }
    },
    { timestamps: true }
);

// Auto-generate goalId before save if not set
savingsGoalSchema.pre("save", function (next) {
    if (!this.goalId) {
        this.goalId = snowflake.nextId();
    }
    if (typeof next === "function") next();
});

// Useful virtual: percentage progress
savingsGoalSchema.virtual("progressPercentage").get(function () {
    if (!this.targetAmount || this.targetAmount === 0) return 0;
    return Math.min(100, Math.round((this.savedAmount / this.targetAmount) * 100));
});

savingsGoalSchema.set("toJSON", { virtuals: true });
savingsGoalSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("SavingsGoal", savingsGoalSchema);
