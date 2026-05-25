const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({

    leadId: String,

    employeeId: String,

    note: String,

    callOutcome: {
        type: String,
        enum: [
            "interested",
            "not_interested",
            "callback",
            "converted"
        ]
    }

}, { timestamps: true });

module.exports = mongoose.model("LeadNote", noteSchema);
