const kycService = require("../../kyc/service/kyc.service");
const panService = require("./pan.service");
const walletRepo = require("../repository/wallet.repository");
const bankAccountRepo = require("../repository/bankAccount.repository");
const WalletConsent = require("../model/walletConsent.model");
const AppError = require("../../../core/utils/AppError");
const snowflake = require("../../../core/utils/distributedId");

// IFSC format: 4 uppercase letters, '0', 6 alphanumeric chars
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

class WalletKycService {

    // Wallet Status

    // Returns a comprehensive wallet status object. - If no wallet exists walletExists = false.
    async getWalletStatus(userId) {
        const wallet = await walletRepo.findByUserId(userId);

        if (!wallet) {
            return {
                walletExists: false,
                walletId: null,
                walletStatus: null,
                kycStatus: "none",
                walletBalance: 0
            };
        }

        // Auto-sync kycVerified status if KYC is verified but wallet flag is false
        if (!wallet.kycVerified) {
            const kycStatus = await kycService.getKycStatus(userId);
            if (kycStatus.kycVerified) {
                await walletRepo.updateDailyLimitForKYC(userId);
                wallet.kycVerified = true;
                wallet.dailyLimit = 100000;
            }
        }

        return {
            walletExists: true,
            walletId: wallet.walletId || null,
            walletStatus: wallet.status,
            kycStatus: wallet.kycStatus || "none",
            walletBalance: wallet.balance,
            // Onboarding checklist
            aadhaarVerified: wallet.kycVerified,
            panVerified: wallet.panVerified || false,
            bankLinked: wallet.bankLinked || false,
            consentAccepted: wallet.consentAccepted || false
        };
    }

    // Aadhaar KYC (delegates to existing kycService)

    // Send Aadhaar OTP — delegates to the existing KYC service. - Also updates wallet kycStatus to "aadhaar_pending".
    async sendAadhaarOtp(userId, aadhaarNumber, ipAddress) {
        const result = await kycService.initiateKyc(userId, aadhaarNumber, ipAddress);

        // Update kycStatus if wallet already exists (pre-wallet onboarding flow)
        const wallet = await walletRepo.findByUserId(userId);
        if (wallet) {
            await walletRepo.updateKycStatus(userId, "aadhaar_pending");
        }

        return result;
    }

    // Verify Aadhaar OTP — delegates to the existing KYC service. - Updates wallet kycStatus to "aadhaar_verified" on success.
    async verifyAadhaarOtp(userId, otp, ipAddress) {
        const result = await kycService.verifyKycOtp(userId, otp, ipAddress);

        // kycService.verifyKycOtp already calls walletRepo.updateDailyLimitForKYC which sets kycVerified=true
        // We additionally update our new kycStatus field
        const wallet = await walletRepo.findByUserId(userId);
        if (wallet) {
            await walletRepo.updateKycStatus(userId, "aadhaar_verified");
        }

        return result;
    }

    // PAN Verification

    // Verify PAN number and mark wallet accordingly.
    async verifyPan(userId, panNumber) {
        const result = await panService.verifyPan(userId, panNumber);

        // Mark wallet as PAN verified (wallet may not exist yet during onboarding)
        const wallet = await walletRepo.findByUserId(userId);
        if (wallet) {
            await walletRepo.setPanVerified(userId);
        }

        return result;
    }

    // Bank Account Linking

    // Link a bank account with account number and IFSC validation. - Runs a mock penny-drop verification.
    async linkBank(userId, { accountNumber, ifscCode, accountHolderName, bankName, accountType }) {
        // Validate required fields
        if (!accountNumber) {
            throw new AppError("Account Number is required.", 400);
        }
        if (!ifscCode) {
            throw new AppError("IFSC is required.", 400);
        }

        const ifsc = ifscCode.trim().toUpperCase();
        if (!IFSC_REGEX.test(ifsc)) {
            throw new AppError("Invalid IFSC", 400);
        }

        if (typeof accountNumber !== "string" || accountNumber.trim().length < 9) {
            throw new AppError("Valid bank account number is required (minimum 9 digits).", 400);
        }

        // Check duplicate: match on masked account number (last 4) + IFSC
        const maskedLast4 = "XXXX" + accountNumber.trim().slice(-4);
        const count = await bankAccountRepo.countByUser(userId);

        if (count >= 5) {
            throw new AppError("Maximum 5 bank accounts allowed per wallet.", 400);
        }

        const existing = await bankAccountRepo.findByUser(userId);
        const duplicate = existing.find(
            (acc) => acc.accountNumberMasked === maskedLast4 && acc.ifscCode === ifsc
        );
        if (duplicate) {
            throw new AppError("This bank account is already linked.", 409);
        }

        // Mock Penny-Drop Verification
        await this._verifyBankAccount(accountNumber.trim(), ifsc);

        // Derive bank name from IFSC prefix if not provided
        const resolvedBankName = bankName || this._bankNameFromIfsc(ifsc);

        // BankAccount model requires accountHolderName — use a sensible default
        const holderName = accountHolderName?.trim() || "Account Holder";

        // Create the bank account record
        const account = await bankAccountRepo.create({
            userId,
            accountHolderName: holderName,
            accountNumber: accountNumber.trim(),
            ifscCode: ifsc,
            bankName: resolvedBankName,
            accountType: accountType || "savings"
        });

        // Auto-set as primary if first account
        if (count === 0) {
            await bankAccountRepo.setPrimary(account._id, userId);
        }

        // Mark wallet as bank linked
        const wallet = await walletRepo.findByUserId(userId);
        if (wallet) {
            await walletRepo.setBankLinked(userId);
        }

        return {
            message: "Bank account linked and verified successfully.",
            bankAccount: account.toSafeJSON ? account.toSafeJSON() : account
        };
    }

    // Consent

    // Record user consent for Terms, Privacy, and KYC.
    async submitConsent(userId, { termsAccepted, privacyAccepted, kycConsent }, ipAddress) {
        if (!termsAccepted) {
            throw new AppError("You must accept the Terms and Conditions to proceed.", 400);
        }
        if (!privacyAccepted) {
            throw new AppError("You must accept the Privacy Policy to proceed.", 400);
        }
        if (!kycConsent) {
            throw new AppError("You must provide KYC consent to proceed.", 400);
        }

        // Upsert consent record
        await WalletConsent.findOneAndUpdate(
            { userId },
            {
                $set: {
                    termsAccepted: true,
                    privacyAccepted: true,
                    kycConsent: true,
                    acceptedAt: new Date(),
                    ipAddress: ipAddress || null
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        // Mark wallet as consent accepted
        const wallet = await walletRepo.findByUserId(userId);
        if (wallet) {
            await walletRepo.setConsentAccepted(userId);
        }

        return { message: "Consent recorded successfully." };
    }

    // Wallet Creation (guarded)

    // Create a wallet after verifying all KYC preconditions: - ✓ Aadhaar verified - ✓ PAN verified - ✓ Bank account linked - ✓ Consent accepted
    async createWallet(userId) {
        // Check if wallet already exists
        const existing = await walletRepo.findByUserId(userId);
        if (existing && existing.walletId) {
            throw new AppError("Wallet already exists for this account.", 409);
        }

        // Precondition checks

        const kycStatus = await kycService.getKycStatus(userId);
        if (!kycStatus.kycVerified) {
            throw new AppError(
                "Aadhaar KYC is not verified. Please complete Aadhaar verification first.",
                400
            );
        }

        const WalletPan = require("../model/walletPan.model");
        const panRecord = await WalletPan.findOne({ userId });
        if (!panRecord || panRecord.status !== "verified") {
            throw new AppError("PAN verification is not complete. Please verify your PAN first.", 400);
        }

        const bankAccounts = await bankAccountRepo.findByUser(userId);
        if (!bankAccounts || bankAccounts.length === 0) {
            throw new AppError("No bank account linked. Please link a bank account first.", 400);
        }

        const consent = await WalletConsent.findOne({ userId });
        if (!consent || !consent.termsAccepted || !consent.privacyAccepted || !consent.kycConsent) {
            throw new AppError("Consent is not recorded. Please accept Terms, Privacy, and KYC consent first.", 400);
        }

        // Create or activate the wallet
        const generatedWalletId = snowflake.nextId();

        let wallet;
        if (existing) {
            // Wallet record exists but walletId not set — assign it and mark complete
            await walletRepo.setWalletId(userId, generatedWalletId);
            if (kycStatus.kycVerified) {
                await walletRepo.updateDailyLimitForKYC(userId);
            }
            await walletRepo.updateKycStatus(userId, "complete");
            wallet = await walletRepo.findByUserId(userId);
        } else {
            wallet = await walletRepo.create(userId);
            if (kycStatus.kycVerified) {
                await walletRepo.updateDailyLimitForKYC(userId);
            }
            await walletRepo.setWalletId(userId, generatedWalletId);
            await walletRepo.setPanVerified(userId);
            await walletRepo.setBankLinked(userId);
            await walletRepo.setConsentAccepted(userId);
            await walletRepo.updateKycStatus(userId, "complete");
            wallet = await walletRepo.findByUserId(userId);
        }

        return {
            message: "Wallet created successfully. You can now add money and start transacting.",
            walletId: generatedWalletId,
            walletStatus: wallet.status,
            walletBalance: wallet.balance
        };
    }

    // Offers

    // Returns available wallet offers. - In production these would come from a database/CMS.
    async getOffers(userId) {
        // Static offers — can be replaced with a DB query later
        const offers = [
            {
                offerId: "OFFER001",
                title: "Zero Transaction Fee",
                description: "Send money to any Payvit user with zero transaction fees this month.",
                discount: "100% fee waiver",
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                category: "transfer",
                isActive: true
            },
            {
                offerId: "OFFER002",
                title: "Cashback on First Top-Up",
                description: "Add ₹1,000 or more to your wallet and get ₹50 cashback instantly.",
                discount: "₹50 cashback",
                validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                category: "topup",
                isActive: true
            },
            {
                offerId: "OFFER003",
                title: "Utility Bill Discount",
                description: "Pay electricity or water bills via Payvit Wallet and get 2% off.",
                discount: "2% off",
                validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                category: "utility",
                isActive: true
            }
        ];

        return { offers, total: offers.length };
    }

    // Private Helpers

    async _verifyBankAccount(accountNumber, ifscCode) {
        // Mock penny-drop verification
        // In production: integrate with Razorpay or Cashfree penny-drop API
        const mockMode = true; // Toggle via env config when real API is available

        if (mockMode) {
            // Simulate verification failure for a known bad account
            if (accountNumber === "0000000000") {
                throw new AppError("verification failed", 400);
            }
            return { verified: true };
        }

        // Real API call would go here
        throw new AppError("Bank verification service not configured.", 500);
    }

    _bankNameFromIfsc(ifsc) {
        // Map common IFSC prefixes to bank names
        const bankMap = {
            SBIN: "State Bank of India",
            HDFC: "HDFC Bank",
            ICIC: "ICICI Bank",
            KKBK: "Kotak Mahindra Bank",
            AXIS: "Axis Bank",
            PUNB: "Punjab National Bank",
            BARB: "Bank of Baroda",
            UBIN: "Union Bank of India",
            CNRB: "Canara Bank",
            IOBA: "Indian Overseas Bank",
            UTIB: "Axis Bank",
            YESB: "Yes Bank",
            IDFC: "IDFC First Bank",
            FDRL: "Federal Bank",
            KVBL: "Karur Vysya Bank"
        };
        const prefix = ifsc.slice(0, 4).toUpperCase();
        return bankMap[prefix] || "Unknown Bank";
    }
}

module.exports = new WalletKycService();
