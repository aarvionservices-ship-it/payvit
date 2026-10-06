/**
 * addressVerification.service.js
 *
 * Core Service for Address Verification & GPS Risk Assessment:
 *   1. Collects permanent and current addresses.
 *   2. Captures GPS coordinates with mandatory user consent.
 *   3. Performs an offline geospatial risk check comparing GPS vs declared address.
 *   4. Persists verification record and syncs with CustomerProfile.
 *   5. Logs compliance audit events.
 */

const AddressVerification    = require("../model/AddressVerification.model");
const customerProfileRepo    = require("../../user/repository/customerProfile.repository");
const auditService           = require("../../../core/audit/audit.service");
const AppError               = require("../../../core/utils/AppError");
const snowflake              = require("../../../core/utils/distributedId");
const { evaluateAddressGpsRisk } = require("../utils/geoUtils");

class AddressVerificationService {

    /**
     * Validates address fields.
     * @private
     */
    _validateAddressFields(addr, fieldName = "Address") {
        if (!addr || typeof addr !== "object") {
            throw new AppError(`${fieldName} is required`, 400);
        }
        if (!addr.street || !addr.street.trim()) {
            throw new AppError(`${fieldName}: street address is required`, 400);
        }
        if (!addr.city || !addr.city.trim()) {
            throw new AppError(`${fieldName}: city is required`, 400);
        }
        if (!addr.state || !addr.state.trim()) {
            throw new AppError(`${fieldName}: state is required`, 400);
        }
        if (!addr.pincode || !/^[1-9][0-9]{5}$/.test(addr.pincode.toString().trim())) {
            throw new AppError(`${fieldName}: a valid 6-digit PIN code is required`, 400);
        }
    }

    /**
     * Validates GPS data and enforces user consent.
     * @private
     */
    _validateGpsPayload(gps) {
        if (!gps || typeof gps !== "object") {
            throw new AppError("GPS data is required for address verification", 400);
        }

        // Strict consent enforcement
        if (gps.consentGiven !== true) {
            throw new AppError("User consent is required to capture GPS coordinates for address verification", 400);
        }

        const lat = Number(gps.latitude);
        const lon = Number(gps.longitude);

        if (isNaN(lat) || lat < -90 || lat > 90) {
            throw new AppError("Invalid GPS latitude. Must be between -90 and 90", 400);
        }
        if (isNaN(lon) || lon < -180 || lon > 180) {
            throw new AppError("Invalid GPS longitude. Must be between -180 and 180", 400);
        }

        return {
            consentGiven:     true,
            consentTimestamp: gps.consentTimestamp ? new Date(gps.consentTimestamp) : new Date(),
            latitude:         lat,
            longitude:        lon,
            accuracy:         gps.accuracy !== undefined ? Number(gps.accuracy) : null,
            altitude:         gps.altitude !== undefined ? Number(gps.altitude) : null,
            capturedAt:       gps.capturedAt ? new Date(gps.capturedAt) : new Date()
        };
    }

    /**
     * Verifies user address with GPS coordinates and risk assessment.
     *
     * @param {string} userId
     * @param {object} payload
     * @param {string} ipAddress
     * @returns {Promise<object>}
     */
    async verifyAddress(userId, payload, ipAddress) {
        if (!userId) {
            throw new AppError("Unauthorized: userId is required", 401);
        }

        const { permanentAddress, sameAsPermanent } = payload;
        let currentAddress = payload.currentAddress;

        // If sameAsPermanent is true, inherit permanent address
        if (sameAsPermanent) {
            currentAddress = { ...permanentAddress };
        }

        // 1. Validate addresses
        this._validateAddressFields(permanentAddress, "Permanent address");
        this._validateAddressFields(currentAddress, "Current address");

        // 2. Validate GPS coordinates & verify consent
        const validatedGps = this._validateGpsPayload(payload.gps);
        validatedGps.ipAddress = ipAddress;

        // 3. Run Geospatial Risk Engine comparing GPS against declared current residence
        const riskAssessment = evaluateAddressGpsRisk(validatedGps, currentAddress);

        const status = riskAssessment.status === "VERIFIED" ? "verified" : "flagged";
        const verifiedAt = status === "verified" ? new Date() : null;

        const verificationId = snowflake.nextId();

        // 4. Persist AddressVerification record
        const record = await AddressVerification.create({
            verificationId,
            userId,
            permanentAddress: {
                street:  permanentAddress.street.trim(),
                city:    permanentAddress.city.trim(),
                state:   permanentAddress.state.trim(),
                pincode: permanentAddress.pincode.toString().trim(),
                country: permanentAddress.country?.trim() || "India"
            },
            currentAddress: {
                street:  currentAddress.street.trim(),
                city:    currentAddress.city.trim(),
                state:   currentAddress.state.trim(),
                pincode: currentAddress.pincode.toString().trim(),
                country: currentAddress.country?.trim() || "India"
            },
            sameAsPermanent: Boolean(sameAsPermanent),
            gps:            validatedGps,
            riskAssessment,
            status,
            verifiedAt
        });

        // 5. Synchronize with CustomerProfile addresses
        try {
            const formattedAddresses = [
                {
                    street:  permanentAddress.street.trim(),
                    city:    permanentAddress.city.trim(),
                    state:   permanentAddress.state.trim(),
                    pincode: permanentAddress.pincode.toString().trim(),
                    type:    "permanent"
                },
                {
                    street:  currentAddress.street.trim(),
                    city:    currentAddress.city.trim(),
                    state:   currentAddress.state.trim(),
                    pincode: currentAddress.pincode.toString().trim(),
                    type:    "current"
                }
            ];

            await customerProfileRepo.update(userId, {
                addresses: formattedAddresses
            });
        } catch (err) {
            // Non-blocking log if profile does not yet exist
            console.warn(`[AddressVerification] Could not sync addresses to CustomerProfile for ${userId}:`, err.message);
        }

        // 6. Audit Logging
        const auditAction = status === "verified"
            ? "ADDRESS_VERIFICATION_VERIFIED"
            : "ADDRESS_VERIFICATION_RISK_FLAGGED";

        await auditService.log(
            auditAction,
            userId,
            "AddressVerification",
            verificationId,
            {
                riskScore:   riskAssessment.riskScore,
                riskLevel:   riskAssessment.riskLevel,
                distanceKm:  riskAssessment.distanceKm,
                declaredCity: currentAddress.city,
                flags:       riskAssessment.flags
            },
            ipAddress
        );

        return {
            verificationId: record.verificationId,
            status:         record.status,
            riskAssessment: record.riskAssessment,
            permanentAddress: record.permanentAddress,
            currentAddress:   record.currentAddress,
            sameAsPermanent:  record.sameAsPermanent,
            gps: {
                latitude:     record.gps.latitude,
                longitude:    record.gps.longitude,
                accuracy:     record.gps.accuracy,
                consentGiven: record.gps.consentGiven,
                capturedAt:   record.gps.capturedAt
            },
            verifiedAt: record.verifiedAt
        };
    }

    /**
     * Retrieves the latest address verification status for a user.
     *
     * @param {string} userId
     * @returns {Promise<object|null>}
     */
    async getAddressStatus(userId) {
        if (!userId) {
            throw new AppError("Unauthorized: userId is required", 401);
        }

        const record = await AddressVerification.findOne({ userId })
            .sort({ createdAt: -1 })
            .lean();

        if (!record) {
            return {
                status: "not_initiated",
                verified: false,
                record: null
            };
        }

        return {
            status: record.status,
            verified: record.status === "verified",
            record: {
                verificationId:   record.verificationId,
                permanentAddress: record.permanentAddress,
                currentAddress:   record.currentAddress,
                sameAsPermanent:  record.sameAsPermanent,
                riskAssessment:   record.riskAssessment,
                gps: {
                    latitude:     record.gps.latitude,
                    longitude:    record.gps.longitude,
                    accuracy:     record.gps.accuracy,
                    capturedAt:   record.gps.capturedAt,
                    consentGiven: record.gps.consentGiven
                },
                verifiedAt: record.verifiedAt,
                createdAt:  record.createdAt
            }
        };
    }

    /**
     * Preview risk check without saving to database.
     *
     * @param {object} payload
     * @returns {object}
     */
    checkRiskPreview(payload) {
        const { currentAddress, permanentAddress, sameAsPermanent, gps } = payload;
        const targetAddress = (sameAsPermanent ? permanentAddress : currentAddress) || permanentAddress;

        this._validateAddressFields(targetAddress, "Address");
        const validatedGps = this._validateGpsPayload(gps);

        return evaluateAddressGpsRisk(validatedGps, targetAddress);
    }
}

module.exports = new AddressVerificationService();
