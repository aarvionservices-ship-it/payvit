const express = require('express');
const router = express.Router();
const emailTemplateController = require('../controller/emailTemplate.controller');
const auth = require('../../../middlewares/auth.middleware');
const role = require('../../../middlewares/role.middleware');

// Apply admin protection to all routes
router.use(auth);
router.use(role(['admin']));

router.post('/', emailTemplateController.create);
router.get('/', emailTemplateController.getAll);
router.get('/:id', emailTemplateController.getById);
router.put('/:id', emailTemplateController.update);
router.delete('/:id', emailTemplateController.delete);
router.post('/test', emailTemplateController.testTemplate);

module.exports = router;

