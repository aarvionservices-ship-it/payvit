const mongoose = require("mongoose");

const affiliateSchema = new mongoose.Schema({

    affiliateId: {
        type: String,
        unique: true,
        index: true
    },

    name: String,

    partner: String,

    loanType: {
        type: String,
        enum: ["personal", "business", "home"]
    },

    redirectUrl: String,

    isActive: {
        type: Boolean,
        default: true
    },

    clicks: {
        type: Number,
        default: 0
    },

    conversions: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

module.exports = mongoose.model("Affiliate", affiliateSchema);
