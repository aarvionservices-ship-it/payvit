const mongoose = require("mongoose");

const leadHistorySchema = new mongoose.Schema({
    leadId: {
        type: String,
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true
    },
    performedBy: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["admin", "employee", "customer", "system"]
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

module.exports = mongoose.model("LeadHistory", leadHistorySchema);

