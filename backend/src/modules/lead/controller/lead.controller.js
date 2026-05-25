const leadService = require("../service/lead.service");
const communicationLogService = require("../service/communicationLog.service");

class LeadController {

    async createLead(req, res) {

        const customerId = req.user?.userId;
        const lead = await leadService.createLead({
            ...req.body,
            customerId
        });

        res.json({
            success: true,
            message: "Lead created",
            data: lead
        });

    }

    async assignLead(req, res) {

        await leadService.assignLead(
            req.params.id,
            req.body.employeeId,
            req.user.userId
        );

        res.json({
            success: true,
            message: "Lead assigned"
        });

    }

    async updateStatus(req, res) {

        await leadService.updateStatus(
            req.params.id,
            req.body,
            req.user.userId
        );

        res.json({
            success: true,
            message: "Status updated"
        });

    }

    async getLeads(req, res) {

        const { role, userId } = req.user;

        const securityFilter = {};

        if (role === "employee") {
            securityFilter.assignedEmployee = userId;
        } else if (role === "customer") {
            const userService = require("../../user/service/user.service");
            const profile = await userService.getProfile(userId);

            if (!profile) {
                return res.status(403).json({ success: false, message: "Profile not found" });
            }

            const orConditions = [{ customerId: userId }];
            if (profile.email || profile.phone) {
                const identityMatch = {};
                if (profile.email) identityMatch.email = profile.email;
                if (profile.phone) identityMatch.phone = profile.phone;
                orConditions.push(identityMatch);
            }
            securityFilter.$or = orConditions;
        } else if (role !== "admin") {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        const leads = await leadService.getLeads(req.query, securityFilter);

        res.json({
            success: true,
            data: leads
        });

    }

    async getLead(req, res) {

        const { role, userId } = req.user;
        const lead = await leadService.getLead(req.params.id);

        if (!lead) {
            return res.status(404).json({ success: false, message: "Lead not found" });
        }

        // ENFORCE PERMISSIONS
        if (role === "customer") {
            const userService = require("../../user/service/user.service");
            const profile = await userService.getProfile(userId);

            // Must match explicitly via customerId OR strictly verify BOTH identity fields
            const isOwner = lead.customerId === userId ||
                (profile.email === lead.email && profile.phone === lead.phone);

            if (!isOwner) {
                return res.status(403).json({ success: false, message: "Access denied to this application" });
            }
        } else if (role === "employee") {
            if (lead.assignedEmployee !== userId) {
                return res.status(403).json({ success: false, message: "Not assigned to you" });
            }
        }

        res.json({
            success: true,
            data: lead
        });

    }

    async bulkAssignLeads(req, res) {

        await leadService.bulkAssignLeads(
            req.body.leadIds,
            req.body.employeeId
        );

        res.json({
            success: true,
            message: "Leads assigned"
        });

    }

    async requestDocument(req, res) {
        const lead = await leadService.requestDocument(req.params.id, req.body.name, req.user.userId);
        res.json({
            success: true,
            message: "Document requested",
            data: lead
        });
    }

    async uploadRequestedDocument(req, res) {
        const lead = await leadService.uploadRequestedDocument(
            req.params.id,
            req.body.name,
            req.body.url,
            req.user.userId
        );
        res.json({
            success: true,
            message: "Document uploaded",
            data: lead
        });
    }

    async updateInitialDocument(req, res) {
        const lead = await leadService.updateInitialDocument(
            req.params.id,
            req.body.documentType,
            req.body.url,
            req.body.name,
            req.user.userId
        );
        res.json({
            success: true,
            message: "Initial document updated",
            data: lead
        });
    }

    async addLog(req, res) {
        const log = await communicationLogService.createLog({
            leadId: req.params.id,
            employeeId: req.user.userId,
            ...req.body
        });

        res.json({
            success: true,
            message: "Communication logged",
            data: log
        });
    }

    async getLogs(req, res) {
        const { role, userId } = req.user;
        const lead = await leadService.getLead(req.params.id);

        if (!lead) {
            return res.status(404).json({ success: false, message: "Lead not found" });
        }

        // ENFORCE PERMISSIONS (Same as getLead)
        if (role === "customer") {
            const userService = require("../../user/service/user.service");
            const profile = await userService.getProfile(userId);

            // Strictly verify ownership before exposing communication logs
            const isOwner = lead.customerId === userId ||
                (profile.email === lead.email && profile.phone === lead.phone);

            if (!isOwner) {
                return res.status(403).json({ success: false, message: "Access denied to logs" });
            }
        }

        const logs = await communicationLogService.getLogsByLeadId(req.params.id);

        res.json({
            success: true,
            data: logs
        });
    }

    async getEmployeeLogs(req, res) {
        const logs = await communicationLogService.getLogsByEmployeeId(req.user.userId);

        res.json({
            success: true,
            data: logs
        });
    }

    async trackLead(req, res) {
        const { id, phone } = req.query;

        if (!id || !phone) {
            return res.status(400).json({ success: false, message: "Lead ID and Phone are required" });
        }

        const lead = await leadService.getLead(id);

        if (!lead || lead.phone !== phone) {
            return res.status(404).json({ success: false, message: "No application found with these details" });
        }

        // Return only safe status tracking info
        res.json({
            success: true,
            data: {
                leadId: lead.leadId,
                status: lead.status,
                customerName: lead.customerName,
                productName: lead.productName,
                createdAt: lead.createdAt
            }
        });
    }

}

module.exports = new LeadController();
