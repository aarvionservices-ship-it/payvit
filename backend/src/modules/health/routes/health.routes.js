const express = require("express");
const healthController = require("../controller/health.controller");
const asyncHandler = require("../../../middlewares/asyncHandler");

const router = express.Router();

router.get(
    "/",
    asyncHandler(healthController.check.bind(healthController))
);

module.exports = router;

