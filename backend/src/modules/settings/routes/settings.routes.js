const express = require('express');
const router = express.Router();
const settingsController = require('../controller/settings.controller');
const auth = require('../../../middlewares/auth.middleware');
const roles = require('../../../middlewares/role.middleware');

router.get('/', settingsController.getSettings);
router.put('/', auth, roles(['admin']), settingsController.updateSettings);

module.exports = router;

