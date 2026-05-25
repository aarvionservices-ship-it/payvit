const leadHistoryService = require("../service/leadHistory.service");

class LeadHistoryController {

    async getHistory(req, res) {
        let history = await leadHistoryService.getHistory(req.params.leadId);
        
        // Backfill employee names for LEAD_ASSIGNED actions if missing
        // This handles records created before the name-recording update
        const employeeIds = [...new Set(
            history
                .filter(h => h.action === "LEAD_ASSIGNED" && !h.details?.employeeName)
                .map(h => h.details.employeeId)
        )];

        if (employeeIds.length > 0) {
            const userService = require("../../user/service/user.service");
            const employees = await Promise.all(
                employeeIds.map(id => userService.getProfile(id).catch(() => null))
            );
            
            const empMap = employees.reduce((acc, emp) => {
                if (emp) acc[emp.userId] = emp.name;
                return acc;
            }, {});

            history = history.map(h => {
                if (h.action === "LEAD_ASSIGNED" && !h.details?.employeeName && empMap[h.details.employeeId]) {
                    return {
                        ...h,
                        details: { ...h.details, employeeName: empMap[h.details.employeeId] }
                    };
                }
                return h;
            });
        }

        res.json({
            success: true,
            data: history
        });
    }

}

module.exports = new LeadHistoryController();

