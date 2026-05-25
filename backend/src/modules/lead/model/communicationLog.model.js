const mongoose = require("mongoose");

const communicationLogSchema = new mongoose.Schema({
    leadId: {
        type: String,
        required: true,
        index: true
    },
    employeeId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ["call", "message", "remark", "meeting"],
        default: "remark"
    },
    outcome: {
        type: String,
        enum: ["interested", "not_interested", "callback_requested", "no_answer", "busy", "wrong_number", "switched_off", "other"],
        default: "other"
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model("CommunicationLog", communicationLogSchema);

