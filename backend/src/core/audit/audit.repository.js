const AuditLog = require("./audit.model");

class AuditRepository {

    async createLog(data) {
        return AuditLog.create(data);
    }

}

module.exports = new AuditRepository();