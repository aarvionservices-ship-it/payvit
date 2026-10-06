/**
 * addressVerification.test.js
 *
 * Test suite for Module 4: Address Verification & GPS Risk Check
 */

const request = require("supertest");
const jwt     = require("jsonwebtoken");
const app     = require("../src/app");
const User    = require("../src/modules/auth/model/auth.model");
const AddressVerification = require("../src/modules/kyc/model/AddressVerification.model");
const CustomerProfile     = require("../src/modules/user/model/customerProfile.model");
const {
    calculateHaversineDistanceKm,
    resolveAddressCoordinates,
    evaluateAddressGpsRisk
} = require("../src/modules/kyc/utils/geoUtils");

const JWT_SECRET =
    process.env.JWT_ACCESS_SECRET ||
    "345e972cbbab29aa0d9c3b620f1fc6af148277c66cefa11c23d87c848f2ecd2e170a730030622b51494ea0867239aad72a3f8b43a77c95bff6d3e17b8c95217b";

function generateToken(userId, role = "customer") {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "1h" });
}

describe("Module 4: Address Verification & GPS Risk Check", () => {
    const testUserId = "usr_test_addr_9001";
    let token;

    beforeEach(async () => {
        token = generateToken(testUserId);

        await User.deleteMany({ userId: testUserId });
        await AddressVerification.deleteMany({ userId: testUserId });
        await CustomerProfile.deleteMany({ userId: testUserId });

        await User.create({
            userId: testUserId,
            name: "Address Test User",
            email: `addrtest_${Date.now()}@payvit.in`,
            phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
            role: "customer",
            passwordHash: "mockhashedpassword"
        });

        await CustomerProfile.create({
            userId: testUserId,
            addresses: []
        });
    });

    afterAll(async () => {
        await User.deleteMany({ userId: testUserId });
        await AddressVerification.deleteMany({ userId: testUserId });
        await CustomerProfile.deleteMany({ userId: testUserId });
    });

    // ─── 1. Geospatial & Risk Engine Unit Tests ───────────────────────────────
    describe("1. Geospatial & Risk Calculation", () => {
        it("should calculate correct Haversine distance between Mumbai and Pune (~120 km)", () => {
            const mumbai = { lat: 19.0760, lon: 72.8777 };
            const pune   = { lat: 18.5204, lon: 73.8567 };

            const distance = calculateHaversineDistanceKm(mumbai.lat, mumbai.lon, pune.lat, pune.lon);
            expect(distance).toBeGreaterThan(100);
            expect(distance).toBeLessThan(150);
        });

        it("should resolve coordinates by city correctly", () => {
            const resolved = resolveAddressCoordinates({ city: "Bengaluru", state: "Karnataka", pincode: "560001" });
            expect(resolved.precision).toBe("city");
            expect(resolved.lat).toBeCloseTo(12.9716, 2);
            expect(resolved.lon).toBeCloseTo(77.5946, 2);
        });

        it("should return LOW risk when GPS is in close vicinity of declared address (< 50 km)", () => {
            // User in Bandra, Mumbai
            const gps = { latitude: 19.0596, longitude: 72.8295, accuracy: 25 };
            const address = { street: "Linking Road", city: "Mumbai", state: "Maharashtra", pincode: "400050" };

            const risk = evaluateAddressGpsRisk(gps, address);
            expect(risk.riskLevel).toBe("LOW");
            expect(risk.status).toBe("VERIFIED");
            expect(risk.distanceKm).toBeLessThan(50);
        });

        it("should return HIGH risk when GPS coordinates differ significantly from declared address", () => {
            // User GPS in Delhi (28.61, 77.20), but declared address in Chennai (13.08, 80.27)
            const gps = { latitude: 28.6139, longitude: 77.2090, accuracy: 15 };
            const address = { street: "Anna Salai", city: "Chennai", state: "Tamil Nadu", pincode: "600002" };

            const risk = evaluateAddressGpsRisk(gps, address);
            expect(risk.riskLevel).toBe("HIGH");
            expect(risk.status).toBe("FLAGGED");
            expect(risk.distanceKm).toBeGreaterThan(1500);
            expect(risk.flags).toContain("HIGH_GPS_DISTANCE_DISCREPANCY");
        });
    });

    // ─── 2. Input Validation & Consent Enforcement ────────────────────────────
    describe("2. Input Validation & Mandatory Consent", () => {
        it("should reject address verification if user consent is not given (consentGiven: false)", async () => {
            const payload = {
                permanentAddress: {
                    street: "123 MG Road",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pincode: "400001"
                },
                currentAddress: {
                    street: "123 MG Road",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pincode: "400001"
                },
                gps: {
                    latitude: 19.0760,
                    longitude: 72.8777,
                    consentGiven: false
                }
            };

            const res = await request(app)
                .post("/api/v1/kyc/address/verify")
                .set("Authorization", `Bearer ${token}`)
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/consent is required/i);
        });

        it("should reject address verification if GPS coordinates are missing or invalid", async () => {
            const payload = {
                permanentAddress: {
                    street: "123 MG Road",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pincode: "400001"
                },
                currentAddress: {
                    street: "123 MG Road",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pincode: "400001"
                },
                gps: {
                    latitude: 999.0, // Invalid latitude (> 90)
                    longitude: 72.8777,
                    consentGiven: true
                }
            };

            const res = await request(app)
                .post("/api/v1/kyc/address/verify")
                .set("Authorization", `Bearer ${token}`)
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/latitude/i);
        });

        it("should reject address verification with invalid 6-digit PIN code", async () => {
            const payload = {
                permanentAddress: {
                    street: "123 MG Road",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pincode: "0012" // Invalid
                },
                currentAddress: {
                    street: "123 MG Road",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pincode: "400001"
                },
                gps: {
                    latitude: 19.0760,
                    longitude: 72.8777,
                    consentGiven: true
                }
            };

            const res = await request(app)
                .post("/api/v1/kyc/address/verify")
                .set("Authorization", `Bearer ${token}`)
                .send(payload);

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/pin code/i);
        });
    });

    // ─── 3. Full Verification Flow (Happy Path) ───────────────────────────────
    describe("3. Happy Path Verification Flow", () => {
        it("should verify address successfully when GPS matches declared address", async () => {
            const payload = {
                permanentAddress: {
                    street: "Flat 4B, Palm Grove",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pincode: "400001"
                },
                currentAddress: {
                    street: "Flat 4B, Palm Grove",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pincode: "400001"
                },
                sameAsPermanent: true,
                gps: {
                    latitude: 19.0760,
                    longitude: 72.8777,
                    accuracy: 12,
                    consentGiven: true,
                    consentTimestamp: new Date().toISOString()
                }
            };

            const res = await request(app)
                .post("/api/v1/kyc/address/verify")
                .set("Authorization", `Bearer ${token}`)
                .send(payload);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe("verified");
            expect(res.body.data.riskAssessment.riskLevel).toBe("LOW");
            expect(res.body.data.riskAssessment.status).toBe("VERIFIED");
            expect(res.body.data.verificationId).toBeDefined();

            // Verify CustomerProfile was synchronized
            const profile = await CustomerProfile.findOne({ userId: testUserId });
            expect(profile.addresses.length).toBe(2);
            expect(profile.addresses[0].type).toBe("permanent");
            expect(profile.addresses[1].type).toBe("current");
            expect(profile.addresses[0].city).toBe("Mumbai");
        });

        it("should correctly handle sameAsPermanent flag and copy permanent address", async () => {
            const payload = {
                permanentAddress: {
                    street: "77 Residency Road",
                    city: "Bengaluru",
                    state: "Karnataka",
                    pincode: "560025"
                },
                sameAsPermanent: true,
                gps: {
                    latitude: 12.9716,
                    longitude: 77.5946,
                    consentGiven: true,
                    consentTimestamp: new Date().toISOString()
                }
            };

            const res = await request(app)
                .post("/api/v1/kyc/address/verify")
                .set("Authorization", `Bearer ${token}`)
                .send(payload);

            expect(res.status).toBe(200);
            expect(res.body.data.currentAddress.city).toBe("Bengaluru");
            expect(res.body.data.sameAsPermanent).toBe(true);
        });
    });

    // ─── 4. Risk Flagging on GPS Discrepancy ───────────────────────────────────
    describe("4. Risk Flagging on Location Discrepancy", () => {
        it("should flag verification when GPS is far from current address", async () => {
            const payload = {
                permanentAddress: {
                    street: "123 Main St",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pincode: "400001"
                },
                currentAddress: {
                    street: "Sector 18",
                    city: "Kolkata",
                    state: "West Bengal",
                    pincode: "700001"
                },
                sameAsPermanent: false,
                gps: {
                    latitude: 19.0760, // Device is in Mumbai
                    longitude: 72.8777,
                    consentGiven: true,
                    consentTimestamp: new Date().toISOString()
                }
            };

            const res = await request(app)
                .post("/api/v1/kyc/address/verify")
                .set("Authorization", `Bearer ${token}`)
                .send(payload);

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe("flagged");
            expect(res.body.data.riskAssessment.riskLevel).toBe("HIGH");
            expect(res.body.data.riskAssessment.distanceKm).toBeGreaterThan(1000);
        });
    });

    // ─── 5. Status & Risk Preview Endpoints ────────────────────────────────────
    describe("5. Address Status & Risk Preview", () => {
        it("should return not_initiated when no address verification has been submitted", async () => {
            const res = await request(app)
                .get("/api/v1/kyc/address/status")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe("not_initiated");
            expect(res.body.data.verified).toBe(false);
        });

        it("should return verified status after successful submission", async () => {
            await request(app)
                .post("/api/v1/kyc/address/verify")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    permanentAddress: { street: "Street 1", city: "Delhi", state: "Delhi", pincode: "110001" },
                    sameAsPermanent: true,
                    gps: { latitude: 28.6139, longitude: 77.2090, consentGiven: true, consentTimestamp: new Date().toISOString() }
                });

            const res = await request(app)
                .get("/api/v1/kyc/address/status")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe("verified");
            expect(res.body.data.verified).toBe(true);
            expect(res.body.data.record.permanentAddress.city).toBe("Delhi");
        });

        it("should return risk preview calculation without persisting", async () => {
            const res = await request(app)
                .post("/api/v1/kyc/address/risk-preview")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    permanentAddress: { street: "Park Ave", city: "Pune", state: "Maharashtra", pincode: "411001" },
                    sameAsPermanent: true,
                    gps: { latitude: 18.5204, longitude: 73.8567, consentGiven: true }
                });

            expect(res.status).toBe(200);
            expect(res.body.data.riskLevel).toBe("LOW");
            expect(res.body.data.distanceKm).toBeLessThan(50);
        });
    });

    // ─── 6. Auth Guard ────────────────────────────────────────────────────────
    describe("6. Authentication Guard", () => {
        it("should reject requests without JWT with 401", async () => {
            const res = await request(app).get("/api/v1/kyc/address/status");
            expect(res.status).toBe(401);
        });
    });
});
