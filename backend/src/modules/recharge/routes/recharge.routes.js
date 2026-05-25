const express = require("express");
const router = express.Router();
const rechargeController = require("../controller/recharge.controller");
const authenticate = require("../../../middlewares/auth.middleware");
const authorize = require("../../../middlewares/role.middleware");

// Public/Authenticated access for fetching services
router.get("/services", rechargeController.getServices);
router.get("/services/:id", rechargeController.getServiceById);

// Payment initiation and history (Authenticated)
router.post("/recharge", authenticate, rechargeController.initiateRecharge);
router.get("/history", authenticate, rechargeController.getPaymentHistory);
router.get("/history/:id", authenticate, rechargeController.getPaymentById);

// Admin operations (only admin can manage services and update payment status for manual overrides/reconciliations)
router.post("/services", authenticate, authorize(["admin"]), rechargeController.createService);
router.put("/services/:id", authenticate, authorize(["admin"]), rechargeController.updateService);
router.put("/history/:id/status", authenticate, authorize(["admin"]), rechargeController.updatePaymentStatus);

module.exports = router;

