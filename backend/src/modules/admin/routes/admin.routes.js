const express = require("express");

const adminController = require("../controller/admin.controller");

const auth = require("../../../middlewares/auth.middleware");

const roles = require("../../../middlewares/role.middleware");

const validate = require("../../../middlewares/validateRequest");

const employeeDTO = require("../dto/createEmployee.dto");
const updateEmployeeDTO = require("../dto/updateEmployee.dto");

const router = express.Router();

router.get(
    "/dashboard",
    auth,
    roles(["admin"]),
    adminController.dashboard
);

router.get(
    "/analytics",
    auth,
    roles(["admin"]),
    adminController.analytics
);

router.post(
    "/employees",
    auth,
    roles(["admin"]),
    validate(employeeDTO),
    adminController.createEmployee
);

router.get(
    "/employees",
    auth,
    roles(["admin"]),
    adminController.getEmployees
);

router.get(
    "/employees/:id",
    auth,
    roles(["admin"]),
    adminController.getEmployeeById
);

router.put(
    "/employees/:id",
    auth,
    roles(["admin"]),
    validate(updateEmployeeDTO),
    adminController.updateEmployee
);

router.patch(
    "/employees/:id/password",
    auth,
    roles(["admin"]),
    adminController.resetEmployeePassword
);

module.exports = router;
