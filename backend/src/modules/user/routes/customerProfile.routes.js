const express = require("express");
const router = express.Router();
const customerProfileController = require("../controller/customerProfile.controller");
const auth = require("../../../middlewares/auth.middleware");

router.use(auth);

router.get("/me", customerProfileController.getProfile);
router.post("/update", customerProfileController.updateProfile);
router.post("/step", customerProfileController.saveStep);

module.exports = router;

