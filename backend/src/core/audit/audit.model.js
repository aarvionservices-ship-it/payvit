const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema({

    action: String,

    userId: String,

    entity: String,

    entityId: String,

    ip: String,

    metadata: Object,

}, { timestamps: true });

module.exports = mongoose.model("AuditLog", auditSchema);