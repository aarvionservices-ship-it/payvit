const asyncHandler = require("../../../middlewares/asyncHandler");
const bankTransferService = require("../service/bankTransfer.service");

// POST /api/v1/wallet/bank-transfer - Initiate a bank-to-bank transfer (NEFT / IMPS / RTGS). - Body: { - fromBankAccountId : string   — _id of user's linked BankAccount - toAccountHolderName : string - toAccountNumber  : string - toIfscCode       : string - toBankName       : string    (optional, for display) - amount           : number - pin              : string    — wallet PIN (4–6 digits) - mode             : "IMPS" | "NEFT" | "RTGS" - description      : string    (optional) - scheduledAt      : ISO date  (optional — reserved for future use) - }
const initiate = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const ipAddress  = req.headers["x-forwarded-for"]?.split(",")[0].trim()
                     || req.socket?.remoteAddress
                     || null;
    const deviceInfo = req.headers["user-agent"] || null;

    const result = await bankTransferService.initiateBankTransfer(userId, {
        ...req.body,
        ipAddress,
        deviceInfo
    });

    return res.status(201).json({
        success: true,
        message: result.message,
        data: result
    });
});

// GET /api/v1/wallet/bank-transfer/history - Paginated list of the authenticated user's outgoing bank transfers. - Query params: - page    — default 1 - limit   — default 20 - status  — "pending" | "processing" | "success" | "failed" - mode    — "IMPS" | "NEFT" | "RTGS" - from    — ISO date (start of range) - to      — ISO date (end of range)
const getHistory = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const result = await bankTransferService.getBankTransferHistory(userId, req.query);

    return res.status(200).json({
        success: true,
        data: result
    });
});

// GET /api/v1/wallet/bank-transfer/:txnId - Fetch a single bank transfer by its txnId. - Returns 403 if the transfer does not belong to the requesting user.
const getById = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { txnId } = req.params;

    const transfer = await bankTransferService.getBankTransferById(txnId, userId);

    return res.status(200).json({
        success: true,
        data: transfer
    });
});

module.exports = { initiate, getHistory, getById };
