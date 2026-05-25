const leadHistoryRepo = require("../repository/leadHistory.repository");

class LeadHistoryService {

    async log(data) {
        return leadHistoryRepo.create({
            leadId: data.leadId,
            action: data.action,
            performedBy: data.performedBy,
            role: data.role,
            details: data.details
        });
    }

    async getHistory(leadId) {
        return leadHistoryRepo.findByLeadId(leadId);
    }

}

module.exports = new LeadHistoryService();

