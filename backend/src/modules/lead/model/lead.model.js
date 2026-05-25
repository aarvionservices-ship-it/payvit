const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({

    leadId: {
        type: String,
        unique: true,
        index: true
    },

    customerId: {
        type: String,
        index: true,
        default: null
    },

    customerName: String,

    phone: String,

    email: String,

    loanType: {
        type: String,
        enum: ["personal", "business", "home", "credit_card"]
    },

    source: {
        type: String,
        enum: ["affiliate", "direct", "ad", "employee_referral"]
    },

    productId: String,
    productType: {
        type: String,
        enum: ["loan", "card", "credit_card"],
        default: "loan"
    },

    affiliateId: String,

    status: {
        type: String,
        enum: [
            "new",
            "assigned",
            "contacted",
            "interested",
            "callback",
            "in-progress",
            "converted",
            "rejected"
        ],
        default: "new"
    },

    assignedEmployee: {
        type: String,
        default: null
    },

    followUpDate: Date,

    notesCount: {
        type: Number,
        default: 0
    },

    documents: [{
        name: String,
        url: String, 
        documentType: {
             type: String,
             enum: ['aadhaar', 'pan', 'bank_statement']
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    requestedDocuments: [{
        name: String,
        status: { 
            type: String, 
            enum: ['pending', 'uploaded'], 
            default: 'pending' 
        },
        url: String,
        uploadedAt: Date
    }]

}, { timestamps: true });

leadSchema.index({ status: 1 });
leadSchema.index({ assignedEmployee: 1 });
leadSchema.index({ loanType: 1 });
leadSchema.index({ phone: 1 });
leadSchema.index({ customerName: 'text', phone: 'text' });

module.exports = mongoose.model("Lead", leadSchema);
