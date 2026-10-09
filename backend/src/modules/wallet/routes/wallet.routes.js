const express = require("express");
const router = express.Router();

const authenticate = require("../../../middlewares/auth.middleware");
const walletController = require("../controller/wallet.controller");
const bankTransferController = require("../controller/bankTransfer.controller");

// Wallet Status

// GET  /api/v1/wallet/status — wallet existence + KYC + balance summary
router.get("/status", authenticate, walletController.getWalletStatus);

// KYC Onboarding

// POST /api/v1/wallet/kyc/aadhaar/send-otp — send OTP to Aadhaar-linked mobile
router.post("/kyc/aadhaar/send-otp", authenticate, walletController.sendAadhaarOtp);

// POST /api/v1/wallet/kyc/aadhaar/verify   — verify OTP
router.post("/kyc/aadhaar/verify", authenticate, walletController.verifyAadhaarOtp);

// POST /api/v1/wallet/kyc/pan              — verify PAN number
router.post("/kyc/pan", authenticate, walletController.submitPan);

// POST /api/v1/wallet/kyc/consent          — record Terms / Privacy / KYC consent
router.post("/kyc/consent", authenticate, walletController.submitConsent);

// Bank Linking

// POST /api/v1/wallet/bank/link            — link bank account with IFSC validation
router.post("/bank/link", authenticate, walletController.linkBank);

// Wallet Creation

// POST /api/v1/wallet/create               — create wallet (all preconditions required)
router.post("/create", authenticate, walletController.createWalletGuarded);

// Dashboard

// GET  /api/v1/wallet/dashboard            — one-shot aggregated dashboard
router.get("/dashboard", authenticate, walletController.getDashboard);

// GET  /api/v1/wallet/offers               — available wallet offers
router.get("/offers", authenticate, walletController.getOffers);

// GET  /api/v1/wallet/linked-banks         — list of linked bank accounts
router.get("/linked-banks", authenticate, walletController.getLinkedBanks);

// GET  /api/v1/wallet/linked-accounts      — list linked accounts (cards + banks)
router.get("/linked-accounts", authenticate, walletController.getLinkedAccounts);

// POST /api/v1/wallet/linked-accounts      — link account (bank or card)
router.post("/linked-accounts", authenticate, walletController.addLinkedAccount);

// DELETE /api/v1/wallet/linked-accounts/:id  — unlink account (bank or card)
router.delete("/linked-accounts/:id", authenticate, walletController.removeLinkedAccount);

// GET  /api/v1/wallet/cards                — list of linked cards (stub)
router.get("/cards", authenticate, walletController.getCards);

// POST /api/v1/wallet/send                 — P2P wallet transfer (alias for /transfer)
router.post("/send", authenticate, walletController.sendMoney);

// POST /api/v1/wallet/receive              — credit transaction for incoming payment
router.post("/receive", authenticate, walletController.receiveMoney);

// GET  /api/v1/wallet/statement            — transaction statement
router.get("/statement", authenticate, walletController.getStatement);

// Savings Goals

// GET    /api/v1/wallet/goals              — list savings goals
router.get("/goals", authenticate, walletController.getGoals);

// POST   /api/v1/wallet/goals              — create savings goal
router.post("/goals", authenticate, walletController.createGoal);

// PUT    /api/v1/wallet/goals/:id          — update savings goal
router.put("/goals/:id", authenticate, walletController.updateGoal);

// DELETE /api/v1/wallet/goals/:id          — delete savings goal
router.delete("/goals/:id", authenticate, walletController.deleteGoal);

// Bills

// GET  /api/v1/wallet/bills                — list bills
router.get("/bills", authenticate, walletController.getBills);

// POST /api/v1/wallet/bills/link           — link bill provider
router.post("/bills/link", authenticate, walletController.linkBill);

// POST /api/v1/wallet/pay                  — pay bill
router.post("/pay", authenticate, walletController.payBill);

// Wallet

// GET  /api/v1/wallet              — get wallet dashboard (auto-creates if missing)
router.get("/", authenticate, walletController.getWallet);

// PIN

// POST /api/v1/wallet/pin          — set PIN (first-time)
router.post("/pin", authenticate, walletController.setPin);

// PUT  /api/v1/wallet/pin          — change existing PIN
router.put("/pin", authenticate, walletController.changePin);

// POST /api/v1/wallet/pin/verify   — verify PIN
router.post("/pin/verify", authenticate, walletController.verifyPin);

// Biometrics

// GET  /api/v1/wallet/biometric/challenge — retrieve biometric verification challenge
router.get("/biometric/challenge", authenticate, walletController.getBiometricChallenge);

// POST /api/v1/wallet/biometric/register  — register biometric public key
router.post("/biometric/register", authenticate, walletController.registerBiometrics);

// POST /api/v1/wallet/biometric/disable   — disable biometric authentication
router.post("/biometric/disable", authenticate, walletController.disableBiometrics);

// QR Code Payments

// GET  /api/v1/wallet/qr          — retrieve payment QR code
router.get("/qr", authenticate, walletController.getMyQrCode);

// POST /api/v1/wallet/qr/resolve  — resolve scanned QR data to profile
router.post("/qr/resolve", authenticate, walletController.resolveQrCode);

// POST /api/v1/wallet/qr/transfer — execute transfer using resolved QR data
router.post("/qr/transfer", authenticate, walletController.transferViaQr);

// POST /api/v1/wallet/scan-pay    — QR scan pay alias
router.post("/scan-pay", authenticate, walletController.transferViaQr);

// Money Movement

// POST /api/v1/wallet/add-money    — buy tokens (INR → Tokens)
router.post("/add-money", authenticate, walletController.addMoney);

// POST /api/v1/wallet/withdraw     — redeem tokens (Tokens → INR)
router.post("/withdraw", authenticate, walletController.withdrawMoney);

// Token Spend

// POST /api/v1/wallet/spend        — spend / deduct tokens
router.post("/spend", authenticate, walletController.spendTokens);

// P2P Token Transfer

// GET  /api/v1/wallet/search-recipient?q=  — search user by phone/email
router.get("/search-recipient", authenticate, walletController.searchRecipient);

// POST /api/v1/wallet/transfer     — wallet-to-wallet token transfer
router.post("/transfer", authenticate, walletController.transferToWallet);

// Transaction History

// GET  /api/v1/wallet/transactions         — paginated history
router.get("/transactions", authenticate, walletController.getTransactions);

// GET  /api/v1/wallet/transactions/:txnId  — single transaction
router.get("/transactions/:txnId", authenticate, walletController.getTransactionById);

// Bank Accounts

// GET    /api/v1/wallet/bank-accounts            — list linked accounts
router.get("/bank-accounts", authenticate, walletController.getBankAccounts);

// POST   /api/v1/wallet/bank-accounts            — link new account
router.post("/bank-accounts", authenticate, walletController.addBankAccount);

// DELETE /api/v1/wallet/bank-accounts/:id        — unlink account
router.delete("/bank-accounts/:id", authenticate, walletController.removeBankAccount);

// PUT    /api/v1/wallet/bank-accounts/:id/primary — set as primary
router.put("/bank-accounts/:id/primary", authenticate, walletController.setPrimaryBankAccount);

// Bank-to-Bank Transfer (NEFT / IMPS / RTGS)

// POST /api/v1/wallet/bank-transfer              — initiate bank transfer
router.post("/bank-transfer", authenticate, bankTransferController.initiate);

// ⚠️ history MUST come before /:txnId to avoid "history" matching as txnId
router.get("/bank-transfer/history", authenticate, bankTransferController.getHistory);

// GET  /api/v1/wallet/bank-transfer/:txnId       — single bank transfer
router.get("/bank-transfer/:txnId", authenticate, bankTransferController.getById);

module.exports = router;
