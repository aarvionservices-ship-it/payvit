const mongoose = require("mongoose");

const clickSchema = new mongoose.Schema({

    affiliateId: String,

    leadId: String,

    ip: String,

    userAgent: String,

    converted: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model("AffiliateClick", clickSchema);
