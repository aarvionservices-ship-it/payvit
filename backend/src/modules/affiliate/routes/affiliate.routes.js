const express = require("express");

const controller = require("../controller/affiliate.controller");

const auth = require("../../../middlewares/auth.middleware");
const roles = require("../../../middlewares/role.middleware");

const validate = require("../../../middlewares/validateRequest");

const createDTO = require("../dto/createAffiliate.dto");

const router = express.Router();

router.post(
    "/",
    auth,
    roles(["admin"]),
    validate(createDTO),
    controller.createAffiliate
);

router.get(
    "/",
    auth,
    roles(["admin"]),
    controller.getAffiliates
);

router.get(
    "/redirect/:id",
    controller.redirect
);

module.exports = router;
