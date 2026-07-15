const XLSX = require("xlsx");
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

    async deleteLead(req, res) {

        const result = await leadService.deleteLead(req.params.id);

        if (!result) {
            return res.status(404).json({ success: false, message: "Lead not found" });
        }

        res.json({
            success: true,
            message: "Lead deleted successfully"
        });

    }

    async bulkDeleteLeads(req, res) {

        const { leadIds } = req.body;

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ success: false, message: "leadIds array is required" });
        }

        const result = await leadService.bulkDeleteLeads(leadIds);

        res.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} leads`,
            data: result
        });

    }

    async deleteLeadsByEmployee(req, res) {

        const { employeeId } = req.params;

        if (!employeeId) {
            return res.status(400).json({ success: false, message: "employeeId is required" });
        }

        const result = await leadService.deleteLeadsByEmployee(employeeId);

        res.json({
            success: true,
            message: `Cleared ${result.deletedCount} leads from employee history`,
            data: result
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

    async bulkCreateLeads(req, res) {
        const { fileName, fileData } = req.body;
        
        if (!fileData) {
            return res.status(400).json({ success: false, message: "File data is required" });
        }
        
        try {
            const buffer = Buffer.from(fileData, "base64");
            const workbook = XLSX.read(buffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rawRows = XLSX.utils.sheet_to_json(worksheet);
            
            if (!rawRows || rawRows.length === 0) {
                return res.status(400).json({ success: false, message: "Spreadsheet is empty" });
            }
            
            // Flexible headers mapper with alphanumeric normalization
            const mappedLeads = rawRows.map(row => {
                const mapped = {};
                const keys = Object.keys(row);
                
                // Normalize row keys to lowercase alphanumeric for flexible mapping
                const getVal = (possibleKeys) => {
                    const foundKey = keys.find(k => {
                        const normalized = k.toLowerCase().replace(/[^a-z0-9]/g, "");
                        return possibleKeys.includes(normalized);
                    });
                    return foundKey ? row[foundKey] : undefined;
                };
                
                const getMatchedKey = (possibleKeys) => {
                    return keys.find(k => {
                        const normalized = k.toLowerCase().replace(/[^a-z0-9]/g, "");
                        return possibleKeys.includes(normalized);
                    });
                };
                
                const nameKey = getMatchedKey(["name", "customername", "fullname", "contactname", "nameofdirectors", "directors", "directorname", "director"]);
                const phoneKey = getMatchedKey(["phone", "phonenumber", "mobile", "mobilenumber", "moblienumber", "contact", "phone1"]);
                const emailKey = getMatchedKey(["email", "emailaddress", "mail", "emailid"]);
                const loanTypeKey = getMatchedKey(["loantype", "type", "category", "product", "loanclass"]);
                const remarksKey = getMatchedKey(["note", "notes", "log", "logs", "interaction", "interactiondetails", "logdetails", "remarks", "remark", "details", "comment", "comments"]);
                
                mapped.customerName = nameKey ? String(row[nameKey]).trim() : "";
                
                const rawPhone = phoneKey ? row[phoneKey] : "";
                mapped.phone = rawPhone ? String(rawPhone).trim() : "";
                
                mapped.email = emailKey ? String(row[emailKey]).trim() : "";
                mapped.loanType = loanTypeKey ? String(row[loanTypeKey]).trim() : "";
                
                // Create highly structured metadata details from extra columns
                const extraDetails = [];
                
                const companyVal = getVal(["company", "companyname", "comapnyname", "organization", "firm"]);
                if (companyVal) extraDetails.push(`Company Name: ${companyVal}`);
                
                const cinVal = getVal(["cin", "cinnumber", "corporateid"]);
                if (cinVal) extraDetails.push(`CIN Number: ${cinVal}`);
                
                const natureVal = getVal(["natureofbusiness", "businessnature", "nature", "industry"]);
                if (natureVal) extraDetails.push(`Nature of Business: ${natureVal}`);
                
                const designationVal = getVal(["leads", "designation", "role", "title", "jobtitle"]);
                if (designationVal) extraDetails.push(`Designation: ${designationVal}`);
                
                const dateOfVal = getVal(["dateof", "incorporationdate", "registrationdate"]);
                if (dateOfVal) extraDetails.push(`Date of Registration/Inc: ${dateOfVal}`);
                
                // Track non-standard extra headers (e.g. Gender, City, State, etc.)
                const specialKeys = [nameKey, phoneKey, emailKey, loanTypeKey, remarksKey];
                const explicitKeys = ["company", "companyname", "comapnyname", "organization", "firm", "cin", "cinnumber", "corporateid", "natureofbusiness", "businessnature", "nature", "industry", "leads", "designation", "role", "title", "jobtitle", "dateof", "incorporationdate", "registrationdate"];
                
                keys.forEach(k => {
                    const normalized = k.toLowerCase().replace(/[^a-z0-9]/g, "");
                    if (!specialKeys.includes(k) && !explicitKeys.includes(normalized)) {
                        const val = row[k];
                        if (val !== undefined && val !== null && val !== "") {
                            extraDetails.push(`${k}: ${val}`);
                        }
                    }
                });
                
                const originalRemarks = remarksKey ? row[remarksKey] : "";
                if (originalRemarks) {
                    extraDetails.push(`Remarks: ${originalRemarks}`);
                }
                
                mapped.note = extraDetails.join("\n");
                
                return mapped;
            }).filter(lead => lead.customerName && lead.phone); // Filter out rows without valid name and phone
            
            if (mappedLeads.length === 0) {
                return res.status(400).json({ success: false, message: "No valid lead records found. 'Name' and 'Phone' columns are required." });
            }
            
            const performerId = req.user?.userId || "SYSTEM";
            
            // Asynchronously process lead inserts in the background
            leadService.bulkCreateLeads(mappedLeads, performerId)
                .then(createdLeads => {
                    console.log(`Successfully completed background import of ${createdLeads.length} cold calling leads.`);
                })
                .catch(err => {
                    console.error("Error in background bulk lead creation:", err);
                });
            
            res.json({
                success: true,
                message: `Spreadsheet parsed. Import of ${mappedLeads.length} leads started in the background.`,
                count: mappedLeads.length
            });
        } catch (err) {
            console.error("Bulk upload parsing failed:", err);
            res.status(500).json({
                success: false,
                message: "Failed to parse spreadsheet file: " + err.message
            });
        }
    }

    async quickCreateUnassignedLeads(req, res) {
        try {
            const leads = await leadService.createQuickUnassignedLeads();
            res.json({
                success: true,
                message: "Successfully created 20 unassigned leads",
                data: leads
            });
        } catch (error) {
            console.error("Error creating quick unassigned leads:", error);
            res.status(500).json({
                success: false,
                message: "Failed to create quick unassigned leads: " + error.message
            });
        }
    }

}

module.exports = new LeadController();
