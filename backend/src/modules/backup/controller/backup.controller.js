const backupService = require('../service/backup.service');

class BackupController {
    async exportBackup(req, res, next) {
        try {
            const compressed = await backupService.generateBackup();
            
            res.setHeader('Content-Type', 'application/gzip');
            res.setHeader('Content-Disposition', `attachment; filename=backup-leads-history-${new Date().toISOString().split('T')[0]}.json.gz`);
            res.send(compressed);
        } catch (error) {
            next(error);
        }
    }

    async restoreBackup(req, res, next) {
        try {
            const { fileData } = req.body;
            if (!fileData) {
                return res.status(400).json({ success: false, message: "Backup fileData is required" });
            }

            const result = await backupService.restoreBackup(fileData);

            res.status(200).json({
                success: true,
                message: "Database restore completed successfully",
                data: result
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async cleanupPreview(req, res, next) {
        try {
            const { statuses } = req.body;
            if (!Array.isArray(statuses) || statuses.length === 0) {
                return res.status(400).json({ success: false, message: "statuses array is required" });
            }

            const result = await backupService.getCleanupPreview(statuses);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async executeCleanup(req, res, next) {
        try {
            const { statuses } = req.body;
            if (!Array.isArray(statuses) || statuses.length === 0) {
                return res.status(400).json({ success: false, message: "statuses array is required" });
            }

            const result = await backupService.executeCleanup(statuses);
            res.status(200).json({
                success: true,
                message: "Database cleanup completed successfully",
                data: result
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new BackupController();
