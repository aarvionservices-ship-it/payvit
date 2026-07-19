const express = require('express');
const router = express.Router();
const backupController = require('../controller/backup.controller');
const auth = require('../../../middlewares/auth.middleware');
const roles = require('../../../middlewares/role.middleware');

router.get('/export', auth, roles(['admin']), backupController.exportBackup);
router.post('/restore', auth, roles(['admin']), backupController.restoreBackup);
router.post('/cleanup-preview', auth, roles(['admin']), backupController.cleanupPreview);
router.post('/cleanup', auth, roles(['admin']), backupController.executeCleanup);

module.exports = router;
