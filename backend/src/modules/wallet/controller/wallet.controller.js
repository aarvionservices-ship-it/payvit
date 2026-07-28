const asyncHandler = require("../../../middlewares/asyncHandler");
const walletService = require("../service/wallet.service");
const transferService = require("../service/transfer.service");
const walletKycService = require("../service/walletKyc.service");

// Wallet Lifecycle

// GET /api/v1/wallet - Returns the authenticated user's wallet. Auto-creates it if missing.
const getWallet = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    let wallet;
    try {
        wallet = await walletService.getWallet(userId);
    } catch (err) {
        // Auto-create wallet on first access
        if (err.statusCode === 404) {
            wallet = await walletService.createWallet(userId);
        } else {
            throw err;
        }
    }

    return res.status(200).json({ success: true, message: "Wallet retrieved successfully.", data: wallet });
});

// PIN Management

// POST /api/v1/wallet/pin - Body: { pin }
const setPin = asyncHandler(async (req, res) => {
    const result = await walletService.setPin(req.user.userId, req.body.pin);
    return res.status(200).json({ success: true, message: result.message || "Wallet PIN set successfully.", data: {} });
});

// PUT /api/v1/wallet/pin - Body: { currentPin, newPin }
const changePin = asyncHandler(async (req, res) => {
    const result = await walletService.changePin(
        req.user.userId,
        req.body.currentPin,
        req.body.newPin
    );
    return res.status(200).json({ success: true, message: result.message || "Wallet PIN changed successfully.", data: {} });
});

// POST /api/v1/wallet/pin/verify - Body: { pin }
const verifyPin = asyncHandler(async (req, res) => {
    const result = await walletService.verifyPin(req.user.userId, req.body.pin);
    return res.status(200).json({ success: true, message: "Wallet PIN verified successfully.", data: result });
});

// Biometrics Management

// GET /api/v1/wallet/biometric/challenge
const getBiometricChallenge = asyncHandler(async (req, res) => {
    const result = await walletService.generateBiometricChallenge(req.user.userId);
    return res.status(200).json({ success: true, message: "Biometric challenge generated.", data: result });
});

// POST /api/v1/wallet/biometric/register - Body: { biometricPublicKey, deviceId, pin }
const registerBiometrics = asyncHandler(async (req, res) => {
    const result = await walletService.registerBiometrics(req.user.userId, req.body);
    return res.status(200).json({ success: true, message: result.message || "Biometrics registered successfully.", data: {} });
});

// POST /api/v1/wallet/biometric/disable - Body: { pin }
const disableBiometrics = asyncHandler(async (req, res) => {
    const result = await walletService.disableBiometrics(req.user.userId, req.body);
    return res.status(200).json({ success: true, message: result.message || "Biometrics disabled successfully.", data: {} });
});

// QR Code Payments

// GET /api/v1/wallet/qr
const getMyQrCode = asyncHandler(async (req, res) => {
    const result = await walletService.generateMyQrCode(req.user.userId);
    return res.status(200).json({ success: true, message: "QR Code retrieved successfully.", data: result });
});

// POST /api/v1/wallet/qr/resolve - Body: { qrData }
const resolveQrCode = asyncHandler(async (req, res) => {
    const result = await walletService.resolveQrCode(req.body.qrData);
    return res.status(200).json({ success: true, message: "QR Code resolved successfully.", data: result });
});

// POST /api/v1/wallet/qr/transfer - Body: { qrData, amount, pin, signature, challenge, description }
const transferViaQr = asyncHandler(async (req, res) => {
    const ipAddress =
        req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
        req.socket?.remoteAddress ||
        null;
    const deviceInfo = req.headers["user-agent"] || null;

    const result = await transferService.transferViaQr(req.user.userId, {
        ...req.body,
        ipAddress,
        deviceInfo
    });
    return res.status(201).json({ success: true, message: result.message || "Transfer completed successfully.", data: result });
});

// Money Movement (Tokens)

// POST /api/v1/wallet/add-money - Converts INR from linked bank account into tokens (1 INR = 1 Token). - Body: { amount, bankAccountId, pin, description }
const addMoney = asyncHandler(async (req, res) => {
    const result = await walletService.addMoney(req.user.userId, req.body);
    return res.status(201).json({ success: true, message: result.message || "Money added successfully.", data: result });
});

// POST /api/v1/wallet/withdraw - Converts tokens back to INR and sends to linked bank account. - Body: { amount, bankAccountId, pin, description }
const withdrawMoney = asyncHandler(async (req, res) => {
    const result = await walletService.withdrawMoney(req.user.userId, req.body);
    return res.status(201).json({ success: true, message: result.message || "Money withdrawn successfully.", data: result });
});

// Token Spend

// POST /api/v1/wallet/spend - Deducts tokens for a service/merchant payment. - Body: { amount, pin, serviceName, description }
const spendTokens = asyncHandler(async (req, res) => {
    const result = await walletService.useTokens(req.user.userId, req.body);
    return res.status(201).json({ success: true, message: result.message || "Tokens spent successfully.", data: result });
});

// P2P Wallet Transfer

// GET /api/v1/wallet/search-recipient?q=<phone or email>
const searchRecipient = asyncHandler(async (req, res) => {
    const result = await transferService.searchRecipient(req.query.q);
    return res.status(200).json({ success: true, message: "Recipient found successfully.", data: result });
});

// POST /api/v1/wallet/transfer - Body: { toUserId, amount, pin, description }
const transferToWallet = asyncHandler(async (req, res) => {
    const ipAddress =
        req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
        req.socket?.remoteAddress ||
        null;
    const deviceInfo = req.headers["user-agent"] || null;

    const result = await transferService.transferToWallet(req.user.userId, {
        ...req.body,
        ipAddress,
        deviceInfo
    });
    return res.status(201).json({ success: true, message: result.message || "Transfer completed successfully.", data: result });
});

// Transaction History

// GET /api/v1/wallet/transactions - Query: page, limit, type, status, from, to
const getTransactions = asyncHandler(async (req, res) => {
    const result = await walletService.getTransactionHistory(req.user.userId, req.query);
    return res.status(200).json({ success: true, message: "Transaction history retrieved successfully.", data: result });
});

// GET /api/v1/wallet/transactions/:txnId
const getTransactionById = asyncHandler(async (req, res) => {
    const txn = await walletService.getTransactionById(req.params.txnId, req.user.userId);
    return res.status(200).json({ success: true, message: "Transaction details retrieved successfully.", data: txn });
});

// Bank Account Management

// GET /api/v1/wallet/bank-accounts
const getBankAccounts = asyncHandler(async (req, res) => {
    const accounts = await walletService.getBankAccounts(req.user.userId);
    return res.status(200).json({ success: true, message: "Bank accounts retrieved successfully.", data: accounts });
});

// POST /api/v1/wallet/bank-accounts - Body: { accountHolderName, accountNumber, ifscCode, bankName, bankBranch, accountType }
const addBankAccount = asyncHandler(async (req, res) => {
    const account = await walletService.addBankAccount(req.user.userId, req.body);
    return res.status(201).json({ success: true, message: "Bank account added successfully.", data: account });
});

// DELETE /api/v1/wallet/bank-accounts/:id
const removeBankAccount = asyncHandler(async (req, res) => {
    const result = await walletService.removeBankAccount(req.user.userId, req.params.id);
    return res.status(200).json({ success: true, message: result.message || "Bank account unlinked successfully.", data: {} });
});

// PUT /api/v1/wallet/bank-accounts/:id/primary
const setPrimaryBankAccount = asyncHandler(async (req, res) => {
    const result = await walletService.setPrimaryBankAccount(req.user.userId, req.params.id);
    return res.status(200).json({ success: true, message: result.message || "Primary bank account set successfully.", data: {} });
});

// Wallet Status

// GET /api/v1/wallet/status - Returns walletExists, walletId, walletStatus, kycStatus, walletBalance.
const getWalletStatus = asyncHandler(async (req, res) => {
    const status = await walletKycService.getWalletStatus(req.user.userId);
    return res.status(200).json({ success: true, message: "Wallet status retrieved successfully.", data: status });
});

// Aadhaar KYC

// POST /api/v1/wallet/kyc/aadhaar/send-otp - Body: { aadhaarNumber }
const sendAadhaarOtp = asyncHandler(async (req, res) => {
    const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip || null;
    const result = await walletKycService.sendAadhaarOtp(
        req.user.userId,
        req.body.aadhaarNumber,
        ipAddress
    );
    return res.status(200).json({ success: true, message: result.message || "OTP sent successfully.", data: {} });
});

// POST /api/v1/wallet/kyc/aadhaar/verify - Body: { otp }
const verifyAadhaarOtp = asyncHandler(async (req, res) => {
    const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip || null;
    const result = await walletKycService.verifyAadhaarOtp(
        req.user.userId,
        req.body.otp,
        ipAddress
    );
    return res.status(200).json({ success: true, message: result.message || "Aadhaar verified successfully.", data: result });
});

// PAN KYC

// POST /api/v1/wallet/kyc/pan - Body: { panNumber }
const submitPan = asyncHandler(async (req, res) => {
    const result = await walletKycService.verifyPan(req.user.userId, req.body.panNumber);
    return res.status(200).json({ success: true, message: result.message || "PAN verified successfully.", data: result });
});

// Bank Linking

// POST /api/v1/wallet/bank/link - Body: { accountNumber, ifscCode, accountHolderName?, bankName?, accountType? }
const linkBank = asyncHandler(async (req, res) => {
    const result = await walletKycService.linkBank(req.user.userId, req.body);
    return res.status(201).json({ success: true, message: result.message || "Bank account linked successfully.", data: result });
});

// Consent

// POST /api/v1/wallet/kyc/consent - Body: { termsAccepted, privacyAccepted, kycConsent }
const submitConsent = asyncHandler(async (req, res) => {
    const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip || null;
    const result = await walletKycService.submitConsent(req.user.userId, req.body, ipAddress);
    return res.status(200).json({ success: true, message: result.message || "Consent recorded successfully.", data: {} });
});

// Wallet Creation

// POST /api/v1/wallet/create - No body required — all preconditions verified server-side.
const createWalletGuarded = asyncHandler(async (req, res) => {
    const result = await walletKycService.createWallet(req.user.userId);
    return res.status(201).json({ success: true, message: result.message || "Wallet created successfully.", data: result });
});

// Dashboard Aliases

// GET /api/v1/wallet/offers
const getOffers = asyncHandler(async (req, res) => {
    const result = await walletKycService.getOffers(req.user.userId);
    return res.status(200).json({ success: true, message: "Offers retrieved successfully.", data: result });
});

// GET /api/v1/wallet/linked-banks - Alias for GET /api/v1/wallet/bank-accounts
const getLinkedBanks = asyncHandler(async (req, res) => {
    const accounts = await walletService.getBankAccounts(req.user.userId);
    return res.status(200).json({ success: true, message: "Linked bank accounts retrieved successfully.", data: accounts });
});

// POST /api/v1/wallet/send - Alias for POST /api/v1/wallet/transfer (P2P wallet transfer) - Body: { toUserId, amount, pin, description }
const sendMoney = asyncHandler(async (req, res) => {
    const ipAddress =
        req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
        req.socket?.remoteAddress ||
        null;
    const deviceInfo = req.headers["user-agent"] || null;

    const result = await transferService.transferToWallet(req.user.userId, {
        ...req.body,
        ipAddress,
        deviceInfo
    });
    return res.status(201).json({ success: true, message: result.message || "Money sent successfully.", data: result });
});

// GET /api/v1/wallet/statement - Alias for GET /api/v1/wallet/transactions with statement-oriented defaults. - Query: page, limit, type, status, from, to
const getStatement = asyncHandler(async (req, res) => {
    const result = await walletService.getTransactionHistory(req.user.userId, req.query);
    return res.status(200).json({ success: true, message: "Statement retrieved successfully.", data: result });
});

module.exports = {
    getWallet,
    setPin,
    changePin,
    verifyPin,
    getBiometricChallenge,
    registerBiometrics,
    disableBiometrics,
    getMyQrCode,
    resolveQrCode,
    transferViaQr,
    addMoney,
    withdrawMoney,
    spendTokens,
    searchRecipient,
    transferToWallet,
    getTransactions,
    getTransactionById,
    getBankAccounts,
    addBankAccount,
    removeBankAccount,
    setPrimaryBankAccount,
    // New Wallet API endpoints
    getWalletStatus,
    sendAadhaarOtp,
    verifyAadhaarOtp,
    submitPan,
    linkBank,
    submitConsent,
    createWalletGuarded,
    getOffers,
    getLinkedBanks,
    sendMoney,
    getStatement
};
