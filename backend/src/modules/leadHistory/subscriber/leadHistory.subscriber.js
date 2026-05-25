const eventBus = require("../../../core/eventBus");
const leadHistoryService = require("../service/leadHistory.service");

eventBus.on("lead.created", async (lead) => {
    await leadHistoryService.log({
        leadId: lead.leadId,
        action: "LEAD_CREATED",
        performedBy: "system",
        role: "system",
        details: { customerName: lead.customerName }
    });
});

eventBus.on("lead.assigned", async ({ leadId, employeeId, employeeName, adminId }) => {
    await leadHistoryService.log({
        leadId,
        action: "LEAD_ASSIGNED",
        performedBy: adminId || "system",
        role: "admin",
        details: { employeeId, employeeName }
    });
});

eventBus.on("lead.status.updated", async ({ leadId, status, oldStatus, note, employeeId, role }) => {
    await leadHistoryService.log({
        leadId,
        action: "STATUS_UPDATED",
        performedBy: employeeId,
        role: role || "employee",
        details: { status, oldStatus, note }
    });
});

eventBus.on("lead.document.requested", async ({ leadId, name, employeeId, role }) => {
    await leadHistoryService.log({
        leadId,
        action: "DOCUMENT_REQUESTED",
        performedBy: employeeId,
        role: role || "employee",
        details: { documentName: name }
    });
});

eventBus.on("lead.document.uploaded", async ({ leadId, name, customerId, role }) => {
    await leadHistoryService.log({
        leadId,
        action: "DOCUMENT_UPLOADED",
        performedBy: customerId,
        role: role || "customer",
        details: { documentName: name }
    });
});

eventBus.on("lead.initial.document.updated", async ({ leadId, documentType, customerId, role }) => {
    await leadHistoryService.log({
        leadId,
        action: "INITIAL_DOCUMENT_UPDATED",
        performedBy: customerId,
        role: role || "customer",
        details: { documentType }
    });
});

module.exports = eventBus;

