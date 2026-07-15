const Lead = require("../model/lead.model");
const LeadNote = require("../model/leadNote.model");

class LeadRepository {

    async createLead(data) {

        return Lead.create(data);

    }

    async findById(leadId) {

        const lead = await Lead.findOne({ leadId, isDeleted: { $ne: true } }).lean();
        if (lead) {
            lead.notes = await LeadNote.find({ leadId }).sort({ createdAt: -1 }).lean();
        }
        return lead;

    }

    async findAll(filter, options) {

        const safeFilter = { ...filter, isDeleted: { $ne: true } };
        return Lead.find(safeFilter)
            .sort(options.sort)
            .skip(options.skip)
            .limit(options.limit)
            .lean();

    }

    async updateLead(leadId, data) {

        return Lead.updateOne(
            { leadId },
            data
        );

    }

    async addNote(data) {
        await LeadNote.create(data);
        await Lead.updateOne({ leadId: data.leadId }, { $inc: { notesCount: 1 } });
    }

    async countLeads(filter) {

        const safeFilter = { ...filter, isDeleted: { $ne: true } };
        return Lead.countDocuments(safeFilter);

    }

    async bulkUpdateLeads(leadIds, data) {
        return Lead.updateMany(
            { leadId: { $in: leadIds } },
            { $set: data }
        );
    }

    async addRequestedDocument(leadId, name) {
        return Lead.findOneAndUpdate(
            { leadId },
            { $push: { requestedDocuments: { name, status: 'pending' } } },
            { new: true }
        );
    }

    async updateRequestedDocument(leadId, name, url) {
        return Lead.findOneAndUpdate(
            { leadId, "requestedDocuments.name": name },
            {
                $set: {
                    "requestedDocuments.$.status": "uploaded",
                    "requestedDocuments.$.url": url,
                    "requestedDocuments.$.uploadedAt": new Date()
                }
            },
            { new: true }
        );
    }

    async updateInitialDocument(leadId, documentType, url, name) {
        return Lead.findOneAndUpdate(
            { leadId, "documents.documentType": documentType },
            {
                $set: {
                    "documents.$.url": url,
                    "documents.$.name": name,
                    "documents.$.uploadedAt": new Date()
                }
            },
            { new: true }
        );
    }

    async findByPhoneAndType(phone, leadType) {
        return Lead.findOne({ phone, leadType, isDeleted: { $ne: true } }).lean();
    }

    async softDeleteLead(leadId) {
        return Lead.updateOne(
            { leadId },
            { $set: { isDeleted: true, deletedAt: new Date() } }
        );
    }

    async bulkSoftDeleteLeads(leadIds) {
        return Lead.updateMany(
            { leadId: { $in: leadIds } },
            { $set: { isDeleted: true, deletedAt: new Date() } }
        );
    }

    async softDeleteLeadsByEmployee(employeeId) {
        return Lead.updateMany(
            { assignedEmployee: employeeId, isDeleted: { $ne: true } },
            { $set: { isDeleted: true, deletedAt: new Date() } }
        );
    }

}

module.exports = new LeadRepository();
