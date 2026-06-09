const leadRepo = require("../repository/lead.repository");
const userService = require("../../user/service/user.service");

const snowflake = require("../../../core/utils/distributedId");

const pagination = require("../../../core/utils/pagination");
const filtering = require("../../../core/utils/filtering");
const sorting = require("../../../core/utils/sorting");

const eventBus = require("../../../core/eventBus");

class LeadService {

    async createLead(data) {

        const lead = await leadRepo.createLead({

            leadId: snowflake.nextId(),

            customerId: data.customerId || null,

            customerName: data.customerName,

            phone: data.phone,

            email: data.email,

            loanType: data.loanType,

            productId: data.productId,
            productType: data.productType,

            source: data.source || "direct",
            leadType: data.leadType || "customer_applied",
            documents: data.documents || [],
            assignedEmployee: data.assignedEmployee || null,
            status: data.assignedEmployee ? "assigned" : "new"

        });

        if (data.note) {
            await leadRepo.addNote({
                leadId: lead.leadId,
                note: data.note,
                employeeId: data.assignedEmployee || "SYSTEM",
                callOutcome: "interested"
            });
        }

        eventBus.emit("lead.created", lead);

        return lead;

    }

    async assignLead(leadId, employeeId, adminId) {

        const employeeProfile = await userService.getProfile(employeeId);
        const employeeName = employeeProfile?.name || employeeId;

        await leadRepo.updateLead(
            leadId,
            {
                assignedEmployee: employeeId,
                status: "assigned"
            }
        );

        eventBus.emit("lead.assigned", {
            leadId,
            employeeId,
            employeeName,
            adminId
        });

    }

    async updateStatus(leadId, data, employeeId) {

        const lead = await leadRepo.findById(leadId);
        const oldStatus = lead?.status;
        await leadRepo.updateLead(
            leadId,
            {
                status: data.status,
                followUpDate: data.followUpDate
            }
        );

        eventBus.emit("lead.status.updated", {
            leadId,
            status: data.status,
            oldStatus,
            note: data.note,
            employeeId,
            role: "employee"
        });

        if (data.note) {
            const validOutcomes = ["interested", "not_interested", "callback", "converted"];
            await leadRepo.addNote({
                leadId,
                employeeId,
                note: data.note,
                callOutcome: validOutcomes.includes(data.status) ? data.status : undefined
            });
            eventBus.emit("lead.note.added", { leadId, employeeId, note: data.note });
        }

    }

    async getLeads(query, securityFilter = {}) {

        const { skip, limit, page } = pagination(query);

        const baseFilter = filtering(query);

        if (baseFilter.leadType === "cold_calling") {
            baseFilter.leadType = "cold_calling";
        } else if (baseFilter.leadType === "customer_applied") {
            baseFilter.leadType = { $ne: "cold_calling" };
        } else {
            // If leadType is not specified:
            // - If filtering for an employee (assigned leads), return ALL types (applied & cold-calling)
            // - Otherwise (e.g. general admin list), default to customer-applied leads
            const hasEmployeeFilter = securityFilter.assignedEmployee || baseFilter.assignedEmployee;
            if (!hasEmployeeFilter) {
                baseFilter.leadType = { $ne: "cold_calling" };
            }
        }

        const filter = { ...baseFilter, ...securityFilter };

        const sort = sorting(query);

        const [data, total] = await Promise.all([
            leadRepo.findAll(filter, {
                skip,
                limit,
                sort
            }),
            leadRepo.countLeads(filter)
        ]);

        return {
            data,
            total,
            page,
            limit
        };

    }

    async getLead(leadId) {

        const lead = await leadRepo.findById(leadId);
        if (!lead) return null;

        // Populate Employee Name
        if (lead.assignedEmployee) {
            const profile = await userService.getProfile(lead.assignedEmployee);
            if (profile) lead.assignedEmployeeName = profile.name;
        }

        // Dynamically Populate Product Details
        if (lead.productId && lead.productType) {
            try {
                let productData = null;
                const mongoose = require("mongoose");

                // Ensure ID is treated correctly (cast only if looks like ObjectId)
                const targetId = mongoose.Types.ObjectId.isValid(lead.productId)
                    ? lead.productId
                    : null;

                if (targetId) {
                    if (lead.productType === 'loan') {
                        const loanService = require("../../loan/service/loan.service");
                        productData = await loanService.getLoanById(targetId);
                    } else if (lead.productType === 'card' || lead.productType === 'credit_card') {
                        const cardService = require("../../card/service/card.service");
                        productData = await cardService.getCardById(targetId);
                    }
                }

                if (productData) {
                    lead.appliedProduct = productData;
                    // Map common and detail fields to facilitate consistent UI rendering
                    lead.productName = productData.loanName || productData.cardName || productData.name;
                    lead.bankName = productData.bankName || productData.issuer || productData.provider;

                    // Flatten details for easier access
                    lead.interestRate = productData.interestRate;
                    lead.loanAmount = productData.loanAmount || productData.amount;
                    lead.tenure = productData.tenure || productData.validity;
                    lead.feesAndCharges = productData.feesAndCharges;
                    lead.processingFee = productData.processingFee || productData.feesAndCharges?.processingFee;
                } else {
                    console.warn(`Product not found for lead ${leadId}: Type ${lead.productType}, ID ${lead.productId}`);
                }
            } catch (err) {
                console.error(`Error populating product for lead ${leadId}:`, err.message);
            }
        }

        return lead;

    }

    async bulkAssignLeads(leadIds, employeeId) {

        await leadRepo.bulkUpdateLeads(
            leadIds,
            {
                assignedEmployee: employeeId,
                status: "assigned"
            }
        );

        leadIds.forEach(leadId => {
            eventBus.emit("lead.assigned", { leadId, employeeId });
        });

    }

    async requestDocument(leadId, name, employeeId) {
        const lead = await leadRepo.addRequestedDocument(leadId, name);
        eventBus.emit("lead.document.requested", { leadId, name, employeeId, role: "employee" });
        return lead;
    }

    async uploadRequestedDocument(leadId, name, url, customerId) {
        const lead = await leadRepo.updateRequestedDocument(leadId, name, url);
        eventBus.emit("lead.document.uploaded", { leadId, name, customerId, role: "customer" });
        return lead;
    }

    async updateInitialDocument(leadId, documentType, url, name, customerId) {
        const lead = await leadRepo.updateInitialDocument(leadId, documentType, url, name);
        eventBus.emit("lead.initial.document.updated", { leadId, documentType, customerId, role: "customer" });
        return lead;
    }

    async bulkCreateLeads(leadsData, performerId = "SYSTEM") {
        const createdLeads = [];
        const seenPhones = new Set();
        
        for (const data of leadsData) {
            if (!data.phone) continue;
            
            // Deduplicate within the same spreadsheet upload batch
            if (seenPhones.has(data.phone)) {
                console.log(`Skipping duplicate phone in the same upload batch: ${data.phone}`);
                continue;
            }
            seenPhones.add(data.phone);
            
            // Check if a cold calling lead with the same phone already exists in the database
            const existingLead = await leadRepo.findByPhoneAndType(data.phone, "cold_calling");
            if (existingLead) {
                console.log(`Skipping existing cold calling lead for phone: ${data.phone}`);
                continue;
            }
            
            const leadId = snowflake.nextId();
            
            const lead = await leadRepo.createLead({
                leadId,
                customerId: null,
                customerName: data.customerName,
                phone: data.phone,
                email: data.email || null,
                loanType: data.loanType || null,
                productId: null,
                productType: null,
                source: "csv_upload",
                leadType: "cold_calling",
                status: data.assignedEmployee ? "assigned" : "new",
                assignedEmployee: data.assignedEmployee || null
            });
            
            if (data.note || data.interactionDetails || data.logDetails) {
                const noteText = data.note || data.interactionDetails || data.logDetails;
                
                // Add note
                await leadRepo.addNote({
                    leadId,
                    note: noteText,
                    employeeId: performerId,
                    callOutcome: "interested"
                });
                
                // Create communication log
                const communicationLogService = require("./communicationLog.service");
                await communicationLogService.createLog({
                    leadId,
                    employeeId: performerId,
                    type: "remark",
                    outcome: "interested",
                    content: noteText,
                    timestamp: new Date()
                });
            }
            
            eventBus.emit("lead.created", lead);
            createdLeads.push(lead);
        }
        
        return createdLeads;
    }

}

module.exports = new LeadService();
