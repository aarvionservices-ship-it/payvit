const mongoose = require('mongoose');
const zlib = require('zlib');
const Lead = require('../../lead/model/lead.model');
const LeadHistory = require('../../leadHistory/model/leadHistory.model');
const CommunicationLog = require('../../lead/model/communicationLog.model');
const LeadNote = require('../../lead/model/leadNote.model');

class BackupService {
    async generateBackup() {
        const [leads, leadHistories, communicationLogs, leadNotes] = await Promise.all([
            Lead.find({}).lean(),
            LeadHistory.find({}).lean(),
            CommunicationLog.find({}).lean(),
            LeadNote.find({}).lean()
        ]);

        const backupData = {
            metadata: {
                version: "1.0",
                backupDate: new Date().toISOString(),
                counts: {
                    leads: leads.length,
                    leadHistories: leadHistories.length,
                    communicationLogs: communicationLogs.length,
                    leadNotes: leadNotes.length
                }
            },
            data: {
                leads,
                leadHistories,
                communicationLogs,
                leadNotes
            }
        };

        const jsonString = JSON.stringify(backupData);
        return zlib.gzipSync(jsonString);
    }

    async restoreBackup(base64Data) {
        if (!base64Data) {
            throw new Error("No backup data provided");
        }

        const compressedBuffer = Buffer.from(base64Data, 'base64');
        let decompressed;
        try {
            decompressed = zlib.gunzipSync(compressedBuffer);
        } catch (err) {
            throw new Error("Invalid backup file. Failed to decompress. Please make sure it is a valid gzipped backup.");
        }

        let backupObj;
        try {
            backupObj = JSON.parse(decompressed.toString());
        } catch (err) {
            throw new Error("Failed to parse backup content as JSON.");
        }

        // Validate structure
        if (!backupObj || !backupObj.metadata || !backupObj.data) {
            throw new Error("Backup file is missing metadata or data structure.");
        }

        const { leads, leadHistories, communicationLogs, leadNotes } = backupObj.data;

        if (!Array.isArray(leads) || !Array.isArray(leadHistories)) {
            throw new Error("Invalid backup format. Leads and History data must be arrays.");
        }

        const { ObjectId } = mongoose.Types;

        // Cast helper to restore MongoDB object IDs and dates
        const castDocument = (doc) => {
            const casted = { ...doc };
            if (casted._id) {
                casted._id = ObjectId.isValid(casted._id) ? new ObjectId(casted._id) : casted._id;
            }
            if (casted.createdAt) casted.createdAt = new Date(casted.createdAt);
            if (casted.updatedAt) casted.updatedAt = new Date(casted.updatedAt);
            return casted;
        };

        const castedLeads = leads.map(lead => {
            const casted = castDocument(lead);
            if (casted.followUpDate) casted.followUpDate = new Date(casted.followUpDate);
            if (casted.deletedAt) casted.deletedAt = new Date(casted.deletedAt);
            if (Array.isArray(casted.documents)) {
                casted.documents = casted.documents.map(doc => ({
                    ...doc,
                    _id: doc._id && ObjectId.isValid(doc._id) ? new ObjectId(doc._id) : doc._id,
                    uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : undefined
                }));
            }
            if (Array.isArray(casted.requestedDocuments)) {
                casted.requestedDocuments = casted.requestedDocuments.map(doc => ({
                    ...doc,
                    _id: doc._id && ObjectId.isValid(doc._id) ? new ObjectId(doc._id) : doc._id,
                    uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : undefined
                }));
            }
            return casted;
        });

        const castedHistory = leadHistories.map(castDocument);
        const castedCommLogs = (communicationLogs || []).map(log => {
            const casted = castDocument(log);
            if (casted.timestamp) casted.timestamp = new Date(casted.timestamp);
            return casted;
        });
        const castedNotes = (leadNotes || []).map(castDocument);

        // Perform clean restore sequential replacement
        await Lead.deleteMany({});
        await LeadHistory.deleteMany({});
        await CommunicationLog.deleteMany({});
        await LeadNote.deleteMany({});

        if (castedLeads.length > 0) {
            await Lead.collection.insertMany(castedLeads);
        }
        if (castedHistory.length > 0) {
            await LeadHistory.collection.insertMany(castedHistory);
        }
        if (castedCommLogs.length > 0) {
            await CommunicationLog.collection.insertMany(castedCommLogs);
        }
        if (castedNotes.length > 0) {
            await LeadNote.collection.insertMany(castedNotes);
        }

        return {
            leadsCount: castedLeads.length,
            leadHistoriesCount: castedHistory.length,
            communicationLogsCount: castedCommLogs.length,
            leadNotesCount: castedNotes.length
        };
    }

    async getCleanupPreview(statuses) {
        if (!Array.isArray(statuses) || statuses.length === 0) {
            return {};
        }

        const results = await Lead.aggregate([
            { $match: { status: { $in: statuses } } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const preview = {};
        statuses.forEach(s => {
            preview[s] = 0;
        });
        results.forEach(res => {
            preview[res._id] = res.count;
        });

        return preview;
    }

    async executeCleanup(statuses) {
        if (!Array.isArray(statuses) || statuses.length === 0) {
            return { leadsDeleted: 0, historiesDeleted: 0, logsDeleted: 0, notesDeleted: 0 };
        }

        const leadsToDelete = await Lead.find({ status: { $in: statuses } }, { leadId: 1 }).lean();
        const leadIds = leadsToDelete.map(l => l.leadId).filter(Boolean);

        if (leadIds.length === 0) {
            return { leadsDeleted: 0, historiesDeleted: 0, logsDeleted: 0, notesDeleted: 0 };
        }

        const [leadsRes, historyRes, logsRes, notesRes] = await Promise.all([
            Lead.deleteMany({ leadId: { $in: leadIds } }),
            LeadHistory.deleteMany({ leadId: { $in: leadIds } }),
            CommunicationLog.deleteMany({ leadId: { $in: leadIds } }),
            LeadNote.deleteMany({ leadId: { $in: leadIds } })
        ]);

        return {
            leadsDeleted: leadsRes.deletedCount,
            historiesDeleted: historyRes.deletedCount,
            logsDeleted: logsRes.deletedCount,
            notesDeleted: notesRes.deletedCount
        };
    }
}

module.exports = new BackupService();
