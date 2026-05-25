const CommunicationLog = require("../model/communicationLog.model");

class CommunicationLogRepository {
    async createLog(data) {
        return CommunicationLog.create(data);
    }

    async findByLeadId(leadId) {
        return CommunicationLog.find({ leadId })
            .sort({ createdAt: -1 })
            .lean();
    }

    async findByEmployeeId(employeeId) {
        return CommunicationLog.find({ employeeId })
            .sort({ createdAt: -1 })
            .lean();
    }

    async listLogs(filter = {}, options = {}) {
        return CommunicationLog.find(filter)
            .sort(options.sort || { createdAt: -1 })
            .skip(options.skip || 0)
            .limit(options.limit || 50)
            .lean();
    }
}

module.exports = new CommunicationLogRepository();

