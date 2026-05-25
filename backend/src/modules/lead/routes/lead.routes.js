const express = require("express");

const leadController = require("../controller/lead.controller");

const auth = require("../../../middlewares/auth.middleware");

const roles = require("../../../middlewares/role.middleware");

const validate = require("../../../middlewares/validateRequest");

const optionalAuth = require("../../../middlewares/optionalAuth.middleware");

const createDTO = require("../dto/createLead.dto");
const updateDTO = require("../dto/updateLeadStatus.dto");

const router = express.Router();

router.post(
    "/",
    optionalAuth,
    validate(createDTO),
    leadController.createLead
);

router.get(
    "/track",
    leadController.trackLead
);

router.get(
    "/",
    auth,
    leadController.getLeads
);

router.get(
    "/communication/employee",
    auth,
    roles(["employee", "admin"]),
    leadController.getEmployeeLogs
);

router.get(
    "/:id",
    auth,
    leadController.getLead
);

router.patch(
    "/:id/status",
    auth,
    roles(["employee", "admin"]),
    validate(updateDTO),
    leadController.updateStatus
);

router.post(
    "/:id/assign",
    auth,
    roles(["admin"]),
    leadController.assignLead
);

router.post(
    "/bulk-assign",
    auth,
    roles(["admin"]),
    leadController.bulkAssignLeads
);

router.post(
    "/:id/request-document",
    auth,
    roles(["employee", "admin"]),
    leadController.requestDocument
);

router.post(
    "/:id/upload-requested-document",
    auth,
    leadController.uploadRequestedDocument
);

router.post(
    "/:id/update-initial-document",
    auth,
    leadController.updateInitialDocument
);

router.post(
    "/:id/communication",
    auth,
    roles(["employee", "admin"]),
    leadController.addLog
);

router.get(
    "/:id/communication",
    auth,
    roles(["employee", "admin", "customer"]),
    leadController.getLogs
);

module.exports = router;
