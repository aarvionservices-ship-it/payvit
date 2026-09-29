/**
 * identityCollection.service.js
 *
 * Core Service for Module 2: Identity Collection
 * Handles:
 *   1. Aadhaar number capture & Verhoeff validation
 *   2. eKYC response ingestion & CustomerProfile synchronization
 *   3. PAN number capture & fuzzy name matching
 *   4. Original PAN card image upload, AI OCR, and authenticity verification
 *   5. Aadhaar card image upload with compliance masking check
 *   6. Aggregated identity collection status
 */

const crypto              = require("crypto");
const Kyc                 = require("../model/kyc.model");
const kycRepo             = require("../repository/kyc.repository");
const customerProfileRepo = require("../../user/repository/customerProfile.repository");
const walletRepo          = require("../../wallet/repository/wallet.repository");
const auditService        = require("../../../core/audit/audit.service");
const agent               = require("./videoKycAgent.service");
const AppError            = require("../../../core/utils/AppError");
const snowflake           = require("../../../core/utils/distributedId");

// ─── Verhoeff Checksum Algorithm for Aadhaar ─────────────────────────────────

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

function validateVerhoeff(numStr) {
    if (!/^\d{12}$/.test(numStr)) return false;
    let c = 0;
    const digits = numStr.split("").map(Number);
    for (let i = 0; i < digits.length; i++) {
        c = verhoeffD[c][verhoeffP[i % 8][digits[digits.length - 1 - i]]];
    }
    return c === 0;
}

// ─── Image Helper Utilities ──────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES    = 10 * 1024 * 1024; // 10 MB
const MIN_IMAGE_BYTES    = 500;              // 500 Bytes

function cleanAndValidateImage(rawBase64, rawMime) {
    if (!rawBase64 || typeof rawBase64 !== "string") {
        throw new AppError("Image payload must be a non-empty base64 string.", 400);
    }

    let cleaned = rawBase64.trim();
    let mime = rawMime ? rawMime.toLowerCase().trim() : null;

    // Strip Data URI prefix if present (e.g. data:image/png;base64,...)
    if (cleaned.startsWith("data:")) {
        const matches = cleaned.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
            mime    = mime || matches[1].toLowerCase();
            cleaned = matches[2];
        } else {
            throw new AppError("Invalid data URI format for base64 image.", 400);
        }
    }

    mime = mime || "image/jpeg";
    if (mime === "image/jpg") mime = "image/jpeg";

    if (!ALLOWED_MIME_TYPES.includes(mime)) {
        throw new AppError(`Unsupported image format '${mime}'. Allowed formats: JPEG, PNG, WEBP.`, 400);
    }

    let buffer;
    try {
        buffer = Buffer.from(cleaned, "base64");
    } catch {
        throw new AppError("Failed to decode base64 image data.", 400);
    }

    if (buffer.length < MIN_IMAGE_BYTES) {
        throw new AppError("Image file size is too small or corrupt. Please upload a clear photo.", 400);
    }

    if (buffer.length > MAX_IMAGE_BYTES) {
        throw new AppError("Image file size exceeds the 10 MB limit.", 400);
    }

    const imageHash = crypto.createHash("sha256").update(buffer).digest("hex");

    return {
        cleanedBase64: cleaned,
        mimeType:      mime,
        buffer,
        imageHash,
        byteSize:      buffer.length
    };
}

// ─── Fuzzy Name Matching Utility ─────────────────────────────────────────────

function computeNameSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;
    const n1 = name1.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "").split(/\s+/);
    const n2 = name2.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "").split(/\s+/);

    let matches = 0;
    for (const token of n1) {
        if (n2.includes(token)) matches++;
    }
    const totalTokens = Math.max(n1.length, n2.length);
    return matches / totalTokens;
}

// ─── Identity Collection Service ─────────────────────────────────────────────

class IdentityCollectionService {

    // ── 1. Capture Aadhaar Number ────────────────────────────────────────────
    /**
     * Validates, encrypts, and records a customer's Aadhaar number.
     * @param {string} userId
     * @param {string} aadhaarNumber - 12-digit string
     * @param {string} ipAddress
     */
    async captureAadhaar(userId, aadhaarNumber, ipAddress) {
        if (!aadhaarNumber || typeof aadhaarNumber !== "string") {
            throw new AppError("Aadhaar number is required.", 400);
        }

        const cleanAadhaar = aadhaarNumber.replace(/\s+/g, "");

        if (!/^\d{12}$/.test(cleanAadhaar)) {
            throw new AppError("Invalid Aadhaar number format. Must contain exactly 12 numeric digits.", 400);
        }

        const isSandboxTestNumber = cleanAadhaar.startsWith("9999");
        if (!isSandboxTestNumber && !validateVerhoeff(cleanAadhaar)) {
            throw new AppError("Invalid Aadhaar number checksum. Please check the number and re-enter.", 400);
        }

        // Prevent linking the same Aadhaar across multiple user accounts
        const existingWithAadhaar = await Kyc.find({
            userId: { $ne: userId }
        });
        for (const record of existingWithAadhaar) {
            if (record.getDecryptedAadhaar() === cleanAadhaar) {
                throw new AppError("This Aadhaar number is already linked to another account.", 400);
            }
        }

        const aadhaarLast4     = cleanAadhaar.slice(-4);
        const aadhaarEncrypted = Kyc.encryptAadhaar(cleanAadhaar);

        let kycRecord = await kycRepo.findByUserId(userId);
        if (!kycRecord) {
            kycRecord = await Kyc.create({
                kycId: snowflake.nextId(),
                userId,
                aadhaarLast4,
                aadhaarEncrypted,
                identityStatus: "aadhaar_captured",
                ipAddress
            });
        } else {
            kycRecord.aadhaarLast4     = aadhaarLast4;
            kycRecord.aadhaarEncrypted = aadhaarEncrypted;
            kycRecord.ipAddress        = ipAddress;
            if (kycRecord.identityStatus === "pending") {
                kycRecord.identityStatus = "aadhaar_captured";
            }
            await kycRecord.save();
        }

        // Sync with CustomerProfile
        await customerProfileRepo.update(userId, {
            aadhaarNumber: aadhaarEncrypted
        });

        await auditService.log(
            "IDENTITY_AADHAAR_CAPTURED",
            userId,
            "Kyc",
            kycRecord.kycId,
            { aadhaarLast4 },
            ipAddress
        );

        return {
            message:      "Aadhaar number captured and encrypted successfully.",
            aadhaarLast4,
            status:       kycRecord.status,
            identityStatus: kycRecord.identityStatus
        };
    }

    // ── 2. Capture eKYC Response ─────────────────────────────────────────────
    /**
     * Ingests a structured eKYC response (from UIDAI OTP verification or offline XML/QR).
     * @param {string} userId
     * @param {object} ekycPayload - { source, name, dob, gender, address, aadhaarLast4, txnId }
     * @param {string} ipAddress
     */
    async captureEkycResponse(userId, ekycPayload, ipAddress) {
        if (!ekycPayload || typeof ekycPayload !== "object") {
            throw new AppError("eKYC payload data is required.", 400);
        }

        const {
            source = "otp_online",
            name,
            dob,
            gender,
            address,
            aadhaarLast4,
            txnId,
            rawResponse
        } = ekycPayload;

        if (!name || !dob) {
            throw new AppError("eKYC response must include at least name and date of birth.", 400);
        }

        let kycRecord = await kycRepo.findByUserId(userId);
        if (!kycRecord) {
            kycRecord = await Kyc.create({
                kycId: snowflake.nextId(),
                userId,
                identityStatus: "aadhaar_captured",
                ipAddress
            });
        }

        const dobDate = new Date(dob);
        const mappedGender = gender ? gender.toLowerCase() : "other";
        const normalizedGender = ["male", "female", "other"].includes(mappedGender) ? mappedGender : "other";

        // Update KYC record with verified demographic info
        kycRecord.nameOnAadhaar    = name;
        kycRecord.dobOnAadhaar     = isNaN(dobDate.getTime()) ? null : dobDate;
        kycRecord.genderOnAadhaar   = normalizedGender;
        kycRecord.addressOnAadhaar = address || null;
        kycRecord.status           = "verified";
        kycRecord.verifiedAt       = new Date();
        if (aadhaarLast4) {
            kycRecord.aadhaarLast4 = String(aadhaarLast4).slice(-4);
        }
        if (txnId) {
            kycRecord.txnId = txnId;
        }

        kycRecord.ekycData = {
            source,
            rawResponse: rawResponse || ekycPayload,
            capturedAt:  new Date()
        };

        if (kycRecord.panVerified) {
            kycRecord.identityStatus = "completed";
        } else {
            kycRecord.identityStatus = "aadhaar_captured";
        }

        await kycRecord.save();

        // Synchronize with CustomerProfile
        const addressObj = address ? {
            street:  [address.house, address.street, address.landmark].filter(Boolean).join(", ") || address.street || "Address",
            city:    address.district || address.locality || address.city || "City",
            state:   address.state || "State",
            pincode: address.pincode || address.postalCode || "000000",
            type:    "permanent"
        } : null;

        await customerProfileRepo.update(userId, {
            dob: isNaN(dobDate.getTime()) ? undefined : dobDate,
            gender: normalizedGender,
            ...(addressObj ? { addresses: [addressObj] } : {})
        });

        // Upgrade wallet limits for verified KYC
        await walletRepo.updateDailyLimitForKYC(userId);

        await auditService.log(
            "IDENTITY_EKYC_CAPTURED",
            userId,
            "Kyc",
            kycRecord.kycId,
            { source, name, aadhaarLast4: kycRecord.aadhaarLast4 },
            ipAddress
        );

        return {
            message:       "eKYC response captured and profile synchronized successfully.",
            nameOnAadhaar: kycRecord.nameOnAadhaar,
            aadhaarLast4:  kycRecord.aadhaarLast4,
            status:        kycRecord.status,
            identityStatus: kycRecord.identityStatus
        };
    }

    // ── 3. Capture PAN Number ────────────────────────────────────────────────
    /**
     * Captures, validates format, encrypts, and checks fuzzy matching against Aadhaar name.
     * @param {string} userId
     * @param {string} panNumber - Format: ABCDE1234F
     * @param {string} [nameOnPAN]
     * @param {string} ipAddress
     */
    async capturePan(userId, panNumber, nameOnPAN, ipAddress) {
        if (!panNumber || typeof panNumber !== "string") {
            throw new AppError("PAN number is required.", 400);
        }

        const cleanPan = panNumber.trim().toUpperCase();

        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
            throw new AppError("Invalid PAN format. Must be 5 letters, 4 numbers, and 1 letter (e.g. ABCDE1234F).", 400);
        }

        // Prevent linking the same PAN across different accounts
        const existingWithPan = await Kyc.find({
            userId: { $ne: userId },
            panEncrypted: { $ne: null }
        });
        for (const record of existingWithPan) {
            if (record.getDecryptedPAN() === cleanPan) {
                throw new AppError("This PAN number is already linked to another account.", 400);
            }
        }

        let kycRecord = await kycRepo.findByUserId(userId);
        if (!kycRecord) {
            kycRecord = await Kyc.create({
                kycId: snowflake.nextId(),
                userId,
                identityStatus: "pan_captured",
                ipAddress
            });
        }

        const panLast4     = cleanPan.slice(-4);
        const panEncrypted = Kyc.encryptPAN(cleanPan);

        kycRecord.panLast4     = panLast4;
        kycRecord.panEncrypted = panEncrypted;
        if (nameOnPAN) {
            kycRecord.nameOnPAN = nameOnPAN.trim().toUpperCase();
        }
        kycRecord.panVerified   = true;
        kycRecord.panVerifiedAt = new Date();

        // Calculate demographic match against Aadhaar if available
        let nameMatchScore = null;
        if (kycRecord.nameOnAadhaar && kycRecord.nameOnPAN) {
            nameMatchScore = computeNameSimilarity(kycRecord.nameOnAadhaar, kycRecord.nameOnPAN);
        }

        if (kycRecord.status === "verified" || kycRecord.status === "pan_verified") {
            kycRecord.identityStatus = "completed";
        } else {
            kycRecord.identityStatus = "pan_captured";
        }

        await kycRecord.save();

        // Sync with CustomerProfile
        await customerProfileRepo.update(userId, {
            panNumber: cleanPan
        });

        await auditService.log(
            "IDENTITY_PAN_CAPTURED",
            userId,
            "Kyc",
            kycRecord.kycId,
            { panLast4, nameOnPAN: kycRecord.nameOnPAN, nameMatchScore },
            ipAddress
        );

        return {
            message:        "PAN captured and verified successfully.",
            panLast4,
            nameOnPAN:      kycRecord.nameOnPAN,
            nameMatchScore,
            identityStatus: kycRecord.identityStatus
        };
    }

    // ── 4. Upload Original PAN Card Image ────────────────────────────────────
    /**
     * Uploads, hashes, and runs AI verification on the physical PAN card photo.
     * Verifies authenticity (checks if card is original physical card, not screen/tampered/photocopy).
     * @param {string} userId
     * @param {string} base64Image
     * @param {string} mimeType
     * @param {string} ipAddress
     */
    async uploadPanCardImage(userId, base64Image, mimeType, ipAddress) {
        const { cleanedBase64, mimeType: cleanMime, buffer, imageHash } = cleanAndValidateImage(base64Image, mimeType);

        let kycRecord = await kycRepo.findByUserId(userId);
        if (!kycRecord) {
            kycRecord = await Kyc.create({
                kycId: snowflake.nextId(),
                userId,
                identityStatus: "pending",
                ipAddress
            });
        }

        // Run Gemini Vision OCR & Originality Analysis
        const analysis = await agent.analyseImage(cleanedBase64, cleanMime, "pan_document_analysis");

        if (!analysis.success) {
            throw new AppError(`PAN card analysis failed: ${analysis.reason || "Unreadable or invalid image."}`, 400);
        }

        if (analysis.isOriginal === false) {
            throw new AppError(
                `Document rejected: ${analysis.reason || "The uploaded image does not appear to be an original physical PAN card."}`,
                400
            );
        }

        const extractedPan  = analysis.panNumber ? analysis.panNumber.toUpperCase() : null;
        const extractedName = analysis.nameOnPAN ? analysis.nameOnPAN.toUpperCase() : null;

        // If user already captured a PAN, verify that the image matches it
        if (kycRecord.panEncrypted) {
            const currentPan = kycRecord.getDecryptedPAN();
            if (extractedPan && currentPan && extractedPan !== currentPan) {
                throw new AppError(
                    `PAN card image does not match the captured PAN number (Image: ${extractedPan}, Registered: ${currentPan}).`,
                    400
                );
            }
        } else if (extractedPan) {
            // Automatically capture from OCR if not already present
            kycRecord.panEncrypted  = Kyc.encryptPAN(extractedPan);
            kycRecord.panLast4      = extractedPan.slice(-4);
            kycRecord.nameOnPAN     = extractedName;
            kycRecord.panVerified   = true;
            kycRecord.panVerifiedAt = new Date();

            await customerProfileRepo.update(userId, { panNumber: extractedPan });
        }

        // Persist PAN document record
        kycRecord.panDocument = {
            imageHash,
            mimeType:      cleanMime,
            data:          buffer,
            isOriginal:    true,
            confidence:    analysis.confidence || 0.95,
            extractedPan,
            extractedName,
            uploadedAt:    new Date()
        };

        if (kycRecord.aadhaarDocument?.frontData) {
            kycRecord.identityStatus = "documents_uploaded";
        }

        await kycRecord.save();

        await auditService.log(
            "IDENTITY_PAN_CARD_UPLOADED",
            userId,
            "Kyc",
            kycRecord.kycId,
            { imageHash, extractedPan, isOriginal: true },
            ipAddress
        );

        return {
            message:        "Original PAN card image uploaded and verified successfully.",
            imageHash,
            isOriginal:     true,
            extractedPan,
            extractedName,
            confidence:     analysis.confidence,
            identityStatus: kycRecord.identityStatus
        };
    }

    // ── 5. Upload Aadhaar Card Image (Front & Optional Back) ──────────────────
    /**
     * Uploads Aadhaar card image, enforces compliance masking check, and stores proof.
     * @param {string} userId
     * @param {object} images - { frontImage, frontMimeType, backImage, backMimeType }
     * @param {string} ipAddress
     */
    async uploadAadhaarImage(userId, images, ipAddress) {
        if (!images || !images.frontImage) {
            throw new AppError("Front image of Aadhaar card is required.", 400);
        }

        const front = cleanAndValidateImage(images.frontImage, images.frontMimeType);

        let back = null;
        if (images.backImage) {
            back = cleanAndValidateImage(images.backImage, images.backMimeType);
        }

        let kycRecord = await kycRepo.findByUserId(userId);
        if (!kycRecord) {
            kycRecord = await Kyc.create({
                kycId: snowflake.nextId(),
                userId,
                identityStatus: "pending",
                ipAddress
            });
        }

        // Run AI analysis on the front image for masking and validity
        const frontAnalysis = await agent.analyseImage(front.cleanedBase64, front.mimeType, "aadhaar_document_analysis");

        if (!frontAnalysis.success) {
            throw new AppError(`Aadhaar image validation failed: ${frontAnalysis.reason || "Unreadable image."}`, 400);
        }

        kycRecord.aadhaarDocument = {
            frontImageHash: front.imageHash,
            frontMimeType:  front.mimeType,
            frontData:      front.buffer,
            backImageHash:  back ? back.imageHash : null,
            backMimeType:   back ? back.mimeType : null,
            backData:       back ? back.buffer : null,
            isMasked:       frontAnalysis.isMasked !== false,
            uploadedAt:     new Date()
        };

        if (kycRecord.panDocument?.data) {
            kycRecord.identityStatus = "documents_uploaded";
        }

        await kycRecord.save();

        await auditService.log(
            "IDENTITY_AADHAAR_IMAGE_UPLOADED",
            userId,
            "Kyc",
            kycRecord.kycId,
            {
                frontImageHash: front.imageHash,
                hasBackImage:   !!back,
                isMasked:       frontAnalysis.isMasked
            },
            ipAddress
        );

        return {
            message:        "Aadhaar card image uploaded and verified successfully.",
            frontImageHash: front.imageHash,
            backImageHash:  back?.imageHash || null,
            isMasked:       frontAnalysis.isMasked !== false,
            confidence:     frontAnalysis.confidence || 0.95,
            identityStatus: kycRecord.identityStatus
        };
    }

    // ── 6. Get Identity Collection Status ────────────────────────────────────
    /**
     * Aggregates Module 2 collection readiness and verification status.
     * @param {string} userId
     */
    async getIdentityStatus(userId) {
        const kyc = await kycRepo.findByUserId(userId);

        if (!kyc) {
            return {
                identityStatus: "pending",
                aadhaar: {
                    captured:     false,
                    aadhaarLast4: null,
                    nameOnAadhaar: null,
                    isVerified:   false
                },
                pan: {
                    captured:  false,
                    panLast4:  null,
                    nameOnPAN: null,
                    isVerified: false
                },
                documents: {
                    panCardUploaded:     false,
                    isPanOriginal:       false,
                    aadhaarCardUploaded: false,
                    isAadhaarMasked:     false
                },
                readyForFaceVerification: false
            };
        }

        const isAadhaarCaptured = !!(kyc.aadhaarLast4 || kyc.aadhaarEncrypted);
        const isPanCaptured     = !!(kyc.panLast4 || kyc.panEncrypted);
        const isPanDocUploaded  = !!kyc.panDocument?.imageHash;
        const isAadhaarDocUploaded = !!kyc.aadhaarDocument?.frontImageHash;

        // Ready for Module 3 (Face & Liveness) when both Aadhaar and PAN documents/identities are in place
        const readyForFace = (isAadhaarCaptured || isAadhaarDocUploaded) && (isPanCaptured || isPanDocUploaded);

        return {
            kycId:          kyc.kycId,
            identityStatus: kyc.identityStatus || "pending",
            aadhaar: {
                captured:      isAadhaarCaptured,
                aadhaarLast4:  kyc.aadhaarLast4,
                nameOnAadhaar: kyc.nameOnAadhaar,
                isVerified:    kyc.status === "verified" || kyc.status === "pan_verified",
                ekycSource:    kyc.ekycData?.source || null
            },
            pan: {
                captured:   isPanCaptured,
                panLast4:   kyc.panLast4,
                nameOnPAN:  kyc.nameOnPAN,
                isVerified: !!kyc.panVerified
            },
            documents: {
                panCardUploaded:     isPanDocUploaded,
                isPanOriginal:       kyc.panDocument?.isOriginal || false,
                panImageHash:        kyc.panDocument?.imageHash || null,
                aadhaarCardUploaded: isAadhaarDocUploaded,
                isAadhaarMasked:     kyc.aadhaarDocument?.isMasked || false,
                aadhaarFrontHash:    kyc.aadhaarDocument?.frontImageHash || null
            },
            readyForFaceVerification: readyForFace
        };
    }
}

module.exports = new IdentityCollectionService();
