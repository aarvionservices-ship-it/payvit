const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
    cardName: {
        type: String,
        required: true,
        trim: true
    },
    bank: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ["credit", "debit", "prepaid"],
        default: "credit"
    },
    category: [String],
    network: [String],
    fees: {
        joiningFee: { type: mongoose.Schema.Types.Mixed }, // Can be Number or String
        annualFee: { type: mongoose.Schema.Types.Mixed },  // Can be Number or String
        reloadFee: String,
        joiningFeeNote: String
    },
    eligibility: {
        age: String,
        minIncomeMonthly: Number,
        creditScore: Number,
        note: String,
        businessType: String,
        companyType: String,
        minBusinessTurnoverYearly: Number,
        documentsRequired: [String],
        fdRequired: Boolean,
        minFD: Number
    },
    features: {
        type: mongoose.Schema.Types.Mixed // Varied features across different cards
    },
    tags: [String],
    score: {
        travel: { type: Number, default: 0 },
        shopping: { type: Number, default: 0 },
        fuel: { type: Number, default: 0 },
        lifestyle: { type: Number, default: 0 },
        dining: { type: Number, default: 0 },
        premium: { type: Number, default: 0 },
        forex: { type: Number, default: 0 },
        business: { type: Number, default: 0 },
        beginner: { type: Number, default: 0 },
        secured: { type: Number, default: 0 }
    },
    bestFor: [String],
    description: {
        type: String,
        trim: true
    },
    imageUrl: String,
    gradient: String
}, { timestamps: true });

module.exports = mongoose.model("Card", cardSchema);

