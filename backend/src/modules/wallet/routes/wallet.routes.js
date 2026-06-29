const express = require("express");
const walletController = require("../controller/wallet.controller");
const auth = require("../../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", auth, walletController.getWallet);
router.post("/add-money", auth, walletController.addMoney);
router.post("/transfer", auth, walletController.transferTokens);
router.get("/search-user", auth, walletController.searchUser);

module.exports = router;
