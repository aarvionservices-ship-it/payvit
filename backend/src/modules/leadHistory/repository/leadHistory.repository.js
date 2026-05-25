const LeadHistory = require("../model/leadHistory.model");

class LeadHistoryRepository {

    async create(data) {
        return LeadHistory.create(data);
    }

    async findByLeadId(leadId) {
        return LeadHistory.find({ leadId }).sort({ createdAt: -1 }).lean();
    }

}

module.exports = new LeadHistoryRepository();

