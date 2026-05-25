const express = require("express");

const controller =
    require("../controller/analytics.controller");

const auth =
    require("../../../middlewares/auth.middleware");

const roles =
    require("../../../middlewares/role.middleware");

const router = express.Router();

router.get(
    "/dashboard",
    auth,
    roles(["admin"]),
    controller.dashboard
);

router.get(
    "/trends",
    auth,
    roles(["admin"]),
    controller.trends
);

router.get(
    "/affiliates",
    auth,
    roles(["admin"]),
    controller.affiliates
);

module.exports = router;
