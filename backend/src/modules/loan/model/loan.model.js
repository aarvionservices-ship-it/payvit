const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
    loanName: {
        type: String,
        required: true,
        trim: true
    },
    provider: {
        type: String,
        required: true,
        trim: true
    },
    bankName: {
        type: String,
        required: true,
        trim: true
    },
    loanType: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String, // e.g., "Personal Loan", "Home Loan", "Car Loan"
        required: true,
        trim: true
    },
    interestRate: {
        min: Number,
        max: Number,
        type: { type: String },
        notes: String
    },
    loanAmount: {
        min: Number,
        max: Number,
        recommendedRange: String
    },
    tenure: {
        minMonths: Number,
        maxMonths: Number,
        flexibility: String
    },
    feesAndCharges: {
        type: mongoose.Schema.Types.Mixed // Varied across different loans
    },
    eligibility: {
        type: mongoose.Schema.Types.Mixed // Varied across different loans
    },
    documentsRequired: {
        type: mongoose.Schema.Types.Mixed // Varied across different loans
    },
    features: [String],
    repayment: {
        type: mongoose.Schema.Types.Mixed // Varied across different loans
    },
    disbursal: {
        type: mongoose.Schema.Types.Mixed // Varied across different loans
    },
    specialOffers: [String],
    pros: [String],
    cons: [String],
    contact: {
        website: String,
        customerCare: String
    },
    imageUrl: String,
    gradient: String,
    lastUpdated: String
}, { timestamps: true });

module.exports = mongoose.model("Loan", loanSchema);

