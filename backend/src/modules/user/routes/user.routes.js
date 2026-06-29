const express = require("express");

const userController = require("../controller/user.controller");
const customerProfileController = require("../controller/customerProfile.controller");

const auth = require("../../../middlewares/auth.middleware");
const roles = require("../../../middlewares/role.middleware");

const validate = require("../../../middlewares/validateRequest");

const updateDTO = require("../dto/updateUser.dto");

const router = express.Router();

router.get("/customer-profile", auth, customerProfileController.getProfile);
router.post("/customer-profile/update", auth, customerProfileController.updateProfile);
router.post("/customer-profile/step", auth, customerProfileController.saveStep);

router.get(
    "/profile",
    auth,
    userController.profile
);

router.put(
    "/profile",
    auth,
    validate(updateDTO),
    userController.updateProfile
);

router.get(
    "/",
    auth,
    roles(["admin", "employee"]),
    userController.getUsers
);

router.post(
    "/create-customer",
    auth,
    roles(["admin", "employee"]),
    userController.createCustomer
);

router.get(
    "/:id",
    auth,
    roles(["admin", "employee"]),
    userController.getUser
);

router.delete(
    "/:id",
    auth,
    roles(["admin"]),
    userController.deleteUser
);

module.exports = router;
