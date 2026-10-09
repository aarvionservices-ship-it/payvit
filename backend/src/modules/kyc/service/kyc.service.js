const kycRepo = require("../repository/kyc.repository");
const aadhaarService = require("./aadhaar.service");
const customerProfileRepo = require("../../user/repository/customerProfile.repository");
const walletRepo = require("../../wallet/repository/wallet.repository");
const auditService = require("../../../core/audit/audit.service");
const eventBus = require("../../../core/eventBus");
const emailTemplateService = require("../../emailTemplate/service/emailTemplate.service");
const User = require("../../auth/model/auth.model");
const Kyc = require("../model/kyc.model");
const AppError = require("../../../core/utils/AppError");
const snowflake = require("../../../core/utils/distributedId");
const mongoose = require("mongoose");

const verhoeffD = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const verhoeffP = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

function validateAadhaar(aadhaarString) {
    if (!/^\d{12}$/.test(aadhaarString)) return false;
    let c = 0;
    const digits = aadhaarString.split("").map(Number);
    for (let i = 0; i < digits.length; i++) {
        c = verhoeffD[c][verhoeffP[i % 8][digits[digits.length - 1 - i]]];
    }
    return c === 0;
}

class KycService {
    async initiateKyc(userId, aadhaarNumber, ipAddress) {
        if (!aadhaarNumber || typeof aadhaarNumber !== "string") {
            throw new AppError("Aadhaar number is required", 400);
        }

        if (!/^\d{12}$/.test(aadhaarNumber)) {
            throw new AppError("Invalid Aadhaar", 400);
        }

        const isTestAadhaar = aadhaarNumber === "999999990019";
        if (!isTestAadhaar && !validateAadhaar(aadhaarNumber)) {
            throw new AppError("Invalid Aadhaar", 400);
        }

        const existingKyc = await kycRepo.findByUserId(userId);
        if (existingKyc && existingKyc.status === "verified") {
            throw new AppError("Aadhaar KYC is already verified for this account.", 400);
        }

        // Prevent linking the same Aadhaar to multiple accounts
        const allKycs = await Kyc.find({ status: "verified" });
        for (const k of allKycs) {
            if (k.getDecryptedAadhaar() === aadhaarNumber && k.userId !== userId) {
                throw new AppError("Aadhaar already linked to another account.", 400);
            }
        }

        const isNewSession = !existingKyc || existingKyc.status === "failed";
        const currentOtpSentCount = (isNewSession ? 0 : (existingKyc.otpSentCount || 0)) + 1;
        if (currentOtpSentCount > 3) {
            throw new AppError("OTP limit exceeded.", 400);
        }

        const aadhaarLast4 = aadhaarNumber.slice(-4);
        const aadhaarEncrypted = Kyc.encryptAadhaar(aadhaarNumber);

        const apiResponse = await aadhaarService.sendOtp(aadhaarNumber);

        await kycRepo.update(userId, {
            kycId: existingKyc?.kycId || snowflake.nextId(),
            aadhaarLast4,
            aadhaarEncrypted,
            status: "otp_sent",
            txnId: apiResponse.txnId,
            attempts: 0,
            otpSentCount: currentOtpSentCount,
            ipAddress
        });

        return {
            message: apiResponse.message || "OTP sent successfully."
        };
    }

    async verifyKycOtp(userId, otp, ipAddress) {
        const kycRecord = await kycRepo.findByUserId(userId);
        if (!kycRecord || kycRecord.status !== "otp_sent") {
            throw new AppError("No active KYC verification session found. Please initiate KYC first.", 400);
        }

        if (kycRecord.attempts >= 3) {
            await kycRepo.updateStatus(userId, "failed");
            await auditService.log("KYC_FAILED", userId, "Kyc", kycRecord.kycId, { reason: "Max OTP attempts exceeded" }, ipAddress);
            throw new AppError("Maximum Aadhaar OTP verification attempts exceeded. Please restart the process.", 400);
        }

        try {
            const identity = await aadhaarService.verifyOtp(kycRecord.txnId, otp);

            const user = await User.findOne({ userId });
            if (!user) throw new AppError("User not found", 404);

            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                await Kyc.findOneAndUpdate(
                    { userId },
                    {
                        $set: {
                            status: "verified",
                            nameOnAadhaar: identity.name,
                            dobOnAadhaar: new Date(identity.dob),
                            genderOnAadhaar: identity.gender,
                            addressOnAadhaar: identity.address,
                            verifiedAt: new Date()
                        }
                    },
                    { session }
                );

                const genderMapped = identity.gender?.toLowerCase();
                const gender = ["male", "female", "other"].includes(genderMapped) ? genderMapped : "other";

                const newAddress = {
                    street: [identity.address.house, identity.address.street, identity.address.landmark].filter(Boolean).join(", "),
                    city: identity.address.district || identity.address.locality || "",
                    state: identity.address.state || "",
                    pincode: identity.address.pincode || "",
                    type: "permanent"
                };

                await customerProfileRepo.update(userId, {
                    dob: new Date(identity.dob),
                    gender,
                    aadhaarNumber: kycRecord.aadhaarEncrypted,
                    addresses: [newAddress]
                }, { session });

                await walletRepo.updateDailyLimitForKYC(userId);

                await session.commitTransaction();
                session.endSession();

                await auditService.log("KYC_VERIFIED", userId, "Kyc", kycRecord.kycId, { nameOnAadhaar: identity.name }, ipAddress);

                try {
                    await emailTemplateService.sendEmailWithTemplate("kyc-approved", user.email, { username: user.name });
                } catch (emailError) {
                    if (process.env.NODE_ENV !== "test") {
                        console.error(`Failed to send KYC approval email: ${emailError.message}`);
                    }
                }

                eventBus.emit("kyc.verified", { userId });

                return {
                    message: "Aadhaar KYC verified successfully.",
                    name: identity.name,
                    aadhaarLast4: kycRecord.aadhaarLast4
                };

            } catch (err) {
                await session.abortTransaction();
                session.endSession();
                throw err;
            }

        } catch (error) {
            await Kyc.findOneAndUpdate({ userId }, { $inc: { attempts: 1 } });
            
            const updatedKyc = await kycRepo.findByUserId(userId);
            if (updatedKyc && updatedKyc.attempts >= 3) {
                await kycRepo.updateStatus(userId, "failed");
                await auditService.log("KYC_FAILED", userId, "Kyc", kycRecord.kycId, { reason: "Max OTP attempts exceeded" }, ipAddress);
                throw new AppError("Maximum Aadhaar OTP verification attempts exceeded. Please restart the process.", 400);
            }

            if (error instanceof AppError && error.message !== "Invalid OTP. Try 123456 in mock mode." && !error.message.toLowerCase().includes("otp")) {
                throw error;
            }

            throw new AppError("Invalid/Expired OTP", 400);
        }
    }

    async getKycStatus(userId) {
        const kyc = await kycRepo.findByUserId(userId);
        if (!kyc) {
            return {
                status: "pending_otp",
                kycVerified: false,
                panVerified: false,
                message: "KYC has not been initiated yet."
            };
        }

        return {
            status: kyc.status,
            kycVerified: kyc.status === "verified" || kyc.status === "pan_verified",
            panVerified: !!kyc.panVerified,
            nameOnAadhaar: kyc.nameOnAadhaar,
            aadhaarLast4: kyc.aadhaarLast4,
            nameOnPAN: kyc.nameOnPAN,
            panLast4: kyc.panLast4,
            verifiedAt: kyc.verifiedAt,
            panVerifiedAt: kyc.panVerifiedAt
        };
    }
}

module.exports = new KycService();
