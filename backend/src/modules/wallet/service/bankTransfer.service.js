const argon2 = require("argon2");
const mongoose = require("mongoose");
const crypto = require("crypto");

const snowflake = require("../../../core/utils/distributedId");
const AppError = require("../../../core/utils/AppError");

const walletRepo = require("../repository/wallet.repository");
const bankAccountRepo = require("../repository/bankAccount.repository");
const bankTransferRepo = require("../repository/bankTransfer.repository");
const transactionRepo = require("../repository/transaction.repository");
const BankTransfer = require("../model/bankTransfer.model");
const walletService = require("./wallet.service");

// Mode limits (in INR)
const MODE_LIMITS = {
    IMPS: { min: 1,       max: 500000  },   // ₹1 – ₹5,00,000
    NEFT: { min: 1,       max: 1000000 },   // ₹1 – ₹10,00,000
    RTGS: { min: 200000,  max: 1000000 }    // ₹2,00,000 – ₹10,00,000
};

// IFSC pattern: 4 alpha chars + 0 + 6 alphanumeric
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

class BankTransferService {

    // Initiate a direct bank-to-bank transfer (NEFT / IMPS / RTGS). - Flow: - 1. Validate inputs (amount, mode, IFSC) - 2. Verify wallet PIN - 3. Load & validate source bank account - 4. Daily limit check (shared with wallet's usedToday) - 5. Fraud flag if amount ≥ ₹1,00,000 - 6. [MOCK] Simulate gateway debit of source bank account - 7. Atomic MongoDB session: - a. Create BankTransfer record - b. Create Transaction record (type: "bank_transfer") - c. Increment wallet.usedToday & wallet.totalTransactions - 8. Return txnId, UTR, mode, status - @param {string} userId - @param {Object} payload
    async initiateBankTransfer(userId, payload) {
        const {
            fromBankAccountId,
            toAccountHolderName,
            toAccountNumber,
            toIfscCode,
            toBankName = "",
            amount: rawAmount,
            pin,
            signature,
            challenge,
            mode = "IMPS",
            description = "",
            ipAddress = null,
            deviceInfo = null,
            scheduledAt = null
        } = payload;

        const amount = Number(rawAmount);

        // 1. Validate inputs
        this._validateMode(mode);
        this._validateAmount(amount, mode);
        this._validateIfsc(toIfscCode);
        this._validateBeneficiaryName(toAccountHolderName);
        this._validateAccountNumber(toAccountNumber);

        // 2. Load wallet & verify PIN
        const wallet = await walletRepo.findByUserId(userId);
        if (!wallet) throw new AppError("Wallet not found.", 404);
        this._ensureWalletActive(wallet);
        await walletService.verifyAuthOrThrow(wallet, { pin, signature, challenge });

        // 3. Load & validate source bank account
        const sourceBankAccount = await bankAccountRepo.findByIdAndUser(fromBankAccountId, userId);
        if (!sourceBankAccount) {
            throw new AppError("Source bank account not found or does not belong to you.", 404);
        }
        if (!sourceBankAccount.isActive) {
            throw new AppError("Source bank account is inactive.", 400);
        }

        // 4. Daily limit check
        if (!wallet.kycVerified && amount > 10000) {
            throw new AppError("KYC required for transfers above ₹10,000. Complete Aadhaar KYC first.", 403);
        }
        await this._checkDailyLimit(wallet, amount);

        // 5. Fraud flag
        const isSuspicious = amount >= 100000;

        // 6. [MOCK] Simulate gateway call
        // In production, replace with real gateway:
        //   const gatewayRes = await razorpayGateway.initiateNEFT({ sourceBankAccount, toAccountNumber, toIfscCode, amount, mode });
        //   if (!gatewayRes.success) throw new AppError(gatewayRes.message, 502);
        const mockUtr = this._generateMockUtr(mode);

        // 7. Encrypt beneficiary account number
        const { encrypted, masked } = BankTransfer.encryptAccountNumber(toAccountNumber.toString());

        // 8. Atomic session
        const txnId = snowflake.nextId();
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // a. BankTransfer record
            await bankTransferRepo.create({
                txnId,
                userId,
                fromBankAccountId,
                fromBankName: sourceBankAccount.bankName,
                fromAccountNumberMasked: sourceBankAccount.accountNumberMasked,
                fromIfscCode: sourceBankAccount.ifscCode,
                toAccountHolderName: toAccountHolderName.trim(),
                toAccountNumberEncrypted: encrypted,
                toAccountNumberMasked: masked,
                toIfscCode: toIfscCode.toUpperCase().trim(),
                toBankName: toBankName.trim(),
                amount,
                fee: 0,
                mode,
                status: "success",
                description: description || `${mode} transfer to ${toAccountHolderName.trim()}`,
                utrNumber: mockUtr,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                ipAddress,
                deviceInfo,
                flaggedAsFraud: isSuspicious,
                fraudReason: isSuspicious ? "High-value bank transfer flagged for review" : null,
                metadata: {
                    gatewayRef: mockUtr,
                    mock: true     // remove this flag when using a real gateway
                }
            }, session);

            // b. Transaction ledger record
            await transactionRepo.create({
                txnId,
                fromUserId: userId,
                toUserId: null,     // external beneficiary — no Payvit userId
                amount,
                fee: 0,
                type: "bank_transfer",
                status: "success",
                description: description || `${mode} transfer to ${toIfscCode.toUpperCase()} – ${masked}`,
                bankAccountId: fromBankAccountId,
                senderBalanceBefore: wallet.balance,
                senderBalanceAfter: wallet.balance,  // wallet balance unaffected; bank debited directly
                ipAddress,
                deviceInfo,
                flaggedAsFraud: isSuspicious,
                fraudReason: isSuspicious ? "High-value bank transfer flagged for review" : null,
                metadata: {
                    mode,
                    utrNumber: mockUtr,
                    beneficiary: {
                        name: toAccountHolderName.trim(),
                        accountMasked: masked,
                        ifsc: toIfscCode.toUpperCase().trim(),
                        bankName: toBankName.trim()
                    }
                }
            }, session);

            // c. Update wallet daily usage & txn count
            //    (wallet balance unchanged — source bank debited directly)
            await walletRepo.updateUsedToday(userId, amount, session);
            await walletRepo.incrementTxnCount(userId, session);

            await session.commitTransaction();
            session.endSession();

            return {
                message: `₹${amount} ${mode} transfer initiated successfully.`,
                txnId,
                utrNumber: mockUtr,
                mode,
                status: "success",
                beneficiary: {
                    name: toAccountHolderName.trim(),
                    accountMasked: masked,
                    ifsc: toIfscCode.toUpperCase().trim(),
                    bankName: toBankName.trim()
                },
                note: isSuspicious
                    ? "This transfer is flagged for review due to high value."
                    : undefined
            };

        } catch (err) {
            await session.abortTransaction();
            session.endSession();

            if (err instanceof AppError) throw err;
            throw new AppError("Bank transfer failed. No money was moved. Please try again.", 500);
        }
    }

    // Paginated history of a user's outgoing bank transfers. - Supports query params: page, limit, status, mode, from, to
    async getBankTransferHistory(userId, query = {}) {
        return await bankTransferRepo.findByUser(userId, query);
    }

    // Fetch a single bank transfer by txnId. - Throws 403 if the transfer does not belong to the requesting user.
    async getBankTransferById(txnId, userId) {
        const transfer = await bankTransferRepo.findById(txnId);
        if (!transfer) throw new AppError("Bank transfer not found.", 404);
        if (transfer.userId !== userId) throw new AppError("Access denied.", 403);
        return transfer.toSafeJSON();
    }

    // Private Helpers

    _validateMode(mode) {
        if (!["IMPS", "NEFT", "RTGS"].includes(mode)) {
            throw new AppError("Transfer mode must be IMPS, NEFT, or RTGS.", 400);
        }
    }

    _validateAmount(amount, mode) {
        if (!amount || isNaN(amount)) {
            throw new AppError("Transfer amount is required.", 400);
        }

        const limits = MODE_LIMITS[mode];

        if (amount < limits.min) {
            throw new AppError(
                `Minimum transfer amount for ${mode} is ₹${limits.min.toLocaleString("en-IN")}.`,
                400
            );
        }

        if (amount > limits.max) {
            throw new AppError(
                `Maximum transfer amount for ${mode} is ₹${limits.max.toLocaleString("en-IN")}.`,
                400
            );
        }
    }

    _validateIfsc(ifsc) {
        if (!ifsc || !IFSC_REGEX.test(ifsc.trim().toUpperCase())) {
            throw new AppError(
                "Invalid IFSC code. Expected format: 4 letters + 0 + 6 alphanumeric characters (e.g. SBIN0001234).",
                400
            );
        }
    }

    _validateBeneficiaryName(name) {
        if (!name || name.trim().length < 2) {
            throw new AppError("Beneficiary name must be at least 2 characters.", 400);
        }
    }

    _validateAccountNumber(accountNumber) {
        const acc = accountNumber?.toString().trim();
        if (!acc || !/^\d{9,18}$/.test(acc)) {
            throw new AppError("Account number must be 9 to 18 digits.", 400);
        }
    }

    _ensureWalletActive(wallet) {
        if (wallet.status === "frozen") {
            throw new AppError("Your wallet is frozen. Contact support to proceed.", 403);
        }
        if (wallet.status === "suspended") {
            throw new AppError("Your wallet is suspended.", 403);
        }
    }



    async _checkDailyLimit(wallet, amount) {
        const today = new Date().toISOString().split("T")[0];
        let usedToday = wallet.usedToday;
        if (wallet.lastResetDate !== today) usedToday = 0;

        if (usedToday + amount > wallet.dailyLimit) {
            const remaining = Math.max(0, wallet.dailyLimit - usedToday);
            throw new AppError(
                `Daily transfer limit of ₹${wallet.dailyLimit.toLocaleString("en-IN")} exceeded. ` +
                `You can transfer ₹${remaining.toLocaleString("en-IN")} more today.`,
                400
            );
        }
    }

    // Generate a realistic-looking mock UTR number. - Format: <MODE><YYYYMMDD><12-digit-random> - e.g. IMPS20240623847301920483
    _generateMockUtr(mode) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const random = crypto.randomBytes(6).toString("hex").toUpperCase();
        return `${mode}${date}${random}`;
    }

}

module.exports = new BankTransferService();
