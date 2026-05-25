const mongoose = require("mongoose");

const rechargeServiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ["Mobile", "DTH", "Electricity", "Water", "Gas", "Broadband", "Landline", "Insurance", "Fastag", "Other"]
    },
    providerName: {
        type: String,
        required: true,
        trim: true
    },
    serviceType: {
        type: String,
        required: true,
        enum: ["Prepaid", "Postpaid"]
    },
    iconUrl: String,
    isActive: {
        type: Boolean,
        default: true
    },
    description: String,
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true });

module.exports = mongoose.model("RechargeService", rechargeServiceSchema);

