const communicationLogRepo = require("../repository/communicationLog.repository");
const userService = require("../../user/service/user.service");

class CommunicationLogService {
    async createLog(data) {
        if (!data.leadId || !data.employeeId || !data.content) {
            throw new Error("Missing required fields for communication log");
        }
        
        const log = await communicationLogRepo.createLog(data);

        // Also add to LeadHistory for a unified timeline
        const leadHistoryService = require("../../leadHistory/service/leadHistory.service");
        await leadHistoryService.log({
            leadId: data.leadId,
            action: "COMMUNICATION_LOGGED",
            performedBy: data.employeeId,
            role: "employee",
            details: {
                type: data.type,
                outcome: data.outcome,
                content: data.content
            }
        });

        return log;
    }

    async getLogsByLeadId(leadId) {
        const logs = await communicationLogRepo.findByLeadId(leadId);
        
        // Populate employee names if needed
        const enrichedLogs = await Promise.all(logs.map(async (log) => {
            const l = log.toObject ? log.toObject() : log;
            const employee = await userService.getProfile(l.employeeId);
            if (employee) l.employeeName = employee.name;
            return l;
        }));
        
        return enrichedLogs;
    }

    async getLogsByEmployeeId(employeeId) {
        const logs = await communicationLogRepo.findByEmployeeId(employeeId);
        const leadService = require("./lead.service");

        // Populate lead info (customer name)
        const enrichedLogs = await Promise.all(logs.map(async (log) => {
            const l = log.toObject ? log.toObject() : log;
            const lead = await leadService.getLead(l.leadId);
            if (lead) l.customerName = lead.customerName;
            return l;
        }));

        return enrichedLogs;
    }
}

module.exports = new CommunicationLogService();

