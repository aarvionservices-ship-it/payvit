const config = require("../../../core/config/env.config");
const AppError = require("../../../core/utils/AppError");

class AadhaarService {
    async sendOtp(aadhaarNumber) {
        if (!/^\d{12}$/.test(aadhaarNumber)) {
            throw new AppError("Invalid Aadhaar number format. Must be 12 digits.", 400);
        }

        if (config.aadhaar.mockMode) {
            // Pre-registered test Aadhaar numbers for manual testing & frontend integration
            const mockIdentities = {
                "999999990019": { name: "Varsha ", dob: "1998-05-15", gender: "FEMALE" },
                "999999990020": { name: "Rahul ", dob: "1992-08-20", gender: "MALE" },
                "999999990021": { name: "Priya ", dob: "1995-12-10", gender: "FEMALE" }
            };

            const isTestNumber = mockIdentities[aadhaarNumber] || aadhaarNumber.startsWith("9999");
            if (isTestNumber) {
                if (process.env.NODE_ENV !== "test") {
                    console.log(`[MOCK Aadhaar OTP] Sent OTP for Aadhaar ${aadhaarNumber}. Use OTP: 123456`);
                }
                return {
                    txnId: `mock-txn-${aadhaarNumber}`,
                    message: "OTP sent successfully to registered mobile number (Mock Mode)"
                };
            }
            throw new AppError("Aadhaar number not registered in Sandbox environment. Use 999999990019, 999999990020, or 999999990021 for testing.", 400);
        }

        try {
            const response = await fetch(`${config.aadhaar.baseUrl}/kyc/aadhaar/otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": config.aadhaar.apiKey,
                    "accept": "application/json"
                },
                body: JSON.stringify({ aadhaarNumber })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new AppError(data.message || "Failed to send OTP via Aadhaar API", response.status || 400);
            }

            return {
                txnId: data.txnId || (data.data && data.data.txnId),
                message: data.message || "OTP sent successfully"
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(`Aadhaar service communication error: ${error.message}`, 500);
        }
    }

    async verifyOtp(txnId, otp) {
        if (!otp || typeof otp !== "string" || otp.trim() === "") {
            throw new AppError("OTP is required", 400);
        }

        if (config.aadhaar.mockMode) {
            if (!txnId || !txnId.startsWith("mock-txn-")) {
                throw new AppError("Invalid or expired Aadhaar verification transaction", 400);
            }
            if (otp !== "123456") {
                throw new AppError("Invalid OTP. Try 123456 in mock mode.", 400);
            }

            const rawNum = txnId.replace("mock-txn-", "");
            const mockIdentities = {
                "999999990019": { name: "Varsha Sharma", dob: "1998-05-15", gender: "FEMALE" },
                "999999990020": { name: "Rahul Verma", dob: "1992-08-20", gender: "MALE" },
                "999999990021": { name: "Priya Patel", dob: "1995-12-10", gender: "FEMALE" }
            };

            const identity = mockIdentities[rawNum] || {
                name: "Test User Profile",
                dob: "1995-01-01",
                gender: "MALE"
            };

            return {
                name: identity.name,
                dob: identity.dob,
                gender: identity.gender,
                address: {
                    house: "42",
                    street: "Silicon Valley Road",
                    landmark: "Near IT Park",
                    locality: "Whitefield",
                    district: "Bengaluru",
                    state: "Karnataka",
                    pincode: "560066"
                },
                aadhaarLast4: rawNum.slice(-4)
            };
        }

        try {
            const response = await fetch(`${config.aadhaar.baseUrl}/kyc/aadhaar/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": config.aadhaar.apiKey,
                    "accept": "application/json"
                },
                body: JSON.stringify({ txnId, otp })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new AppError(data.message || "Failed to verify Aadhaar OTP", response.status || 400);
            }

            const identity = data.data || data;
            return {
                name: identity.name,
                dob: identity.dob,
                gender: identity.gender,
                address: identity.address,
                aadhaarLast4: identity.aadhaarLast4 || identity.aadhaarNumber?.slice(-4)
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(`Aadhaar verification service error: ${error.message}`, 500);
        }
    }
}

module.exports = new AadhaarService();
