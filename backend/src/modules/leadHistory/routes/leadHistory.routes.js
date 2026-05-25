const express = require("express");
const leadHistoryController = require("../controller/leadHistory.controller");
const auth = require("../../../middlewares/auth.middleware");

const router = express.Router();

router.get("/:leadId", auth, leadHistoryController.getHistory);

module.exports = router;

