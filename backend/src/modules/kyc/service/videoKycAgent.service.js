/**
 * videoKycAgent.service.js
 *
 * Internal KYC agent service — returns deterministic mock responses.
 * No external AI APIs are used.
 *
 * Provides:
 *   1. chat()              — returns stage-appropriate response text
 *   2. chatStream()        — yields the same response as a single chunk (for Socket.io compatibility)
 *   3. analyseImage()      — deterministic OCR / liveness / anti-spoof results
 *   4. compareFaces()      — deterministic face-match result
 *   5. analyseVideoVoice() — deterministic voice consistency result
 *   6. analyseVideoFace()  — deterministic face consistency result
 *   7. getStageGreeting()  — initial greeting for a new session
 */

// ─── Stage-based Chat Responses ───────────────────────────────────────────────

const CHAT_RESPONSES = {
    WELCOME: "Hello! Welcome to Payvit's Video KYC verification. I'll guide you through a quick 4-step process: PAN scan, selfie liveness check, security questions, and OTP confirmation. Are you ready to begin?",
    PAN_CAPTURE: "Please upload a clear photo of your PAN card. Make sure it's well-lit with all 4 corners visible and no glare on the card.",
    LIVENESS_CHECK: "Your PAN card has been captured successfully! Now please take a clear selfie. Look directly at the camera in good lighting — no sunglasses or hats please.",
    QUESTIONS: "Great! Let's verify your identity with a couple of quick questions. Please answer accurately.",
    OTP_SENT: "All verification steps passed! I've sent a 6-digit OTP to your registered mobile number and email. Please enter it to complete your KYC.",
    COMPLETE: "🎉 Congratulations! Your Video KYC verification is complete. Your identity has been successfully verified."
};

// ─── Image Analysis Responses ─────────────────────────────────────────────────

const IMAGE_RESPONSES = {
    pan_ocr: {
        success:    true,
        panNumber:  "ADHPB7061Q",
        nameOnPAN:  "VARSHA SHARMA",
        confidence: 0.97
    },
    liveness: {
        success:        true,
        livenessPassed: true,
        confidence:     0.95,
        reason:         "Live human face detected with high confidence."
    },
    anti_spoof: {
        success:         true,
        isSpoofDetected: false,
        spoofRiskScore:  0.05,
        passed:          true,
        indicators:      [],
        quality: {
            brightness:    85,
            sharpness:     90,
            faceDetected:  true,
            multipleFaces: false
        },
        reason: "Clean physical biometric capture. No screen, paper, mask, or deepfake artifacts."
    },
    face_match: {
        success:         true,
        isMatch:         true,
        similarityScore: 0.92,
        confidence:      0.94,
        threshold:       0.75,
        details:         "Strong facial landmark alignment: eyes, nose bridge, jawline, and facial symmetry match."
    },
    active_liveness: {
        success:         true,
        challengePassed: true,
        confidence:      0.96,
        actionDetected:  "blink",
        reason:          "User successfully completed the active challenge."
    },
    pan_document_analysis: {
        success:             true,
        isOriginal:          true,
        panNumber:           "ADHPB7061Q",
        nameOnPAN:           "VARSHA SHARMA",
        dob:                 "15/05/1998",
        confidence:          0.98,
        quality: {
            brightness:          88,
            sharpness:           92,
            cornersVisible:      true,
            glareDetected:       false,
            isPhotocopyOrScreen: false
        },
        reason: "Valid original physical PAN card detected."
    },
    aadhaar_document_analysis: {
        success:       true,
        isMasked:      true,
        aadhaarLast4:  "0019",
        nameOnAadhaar: "VARSHA SHARMA",
        dob:           "15/05/1998",
        gender:        "FEMALE",
        confidence:    0.96,
        quality: {
            brightness:   85,
            sharpness:    90,
            textReadable: true
        },
        reason: "Valid Aadhaar card with masked numbers detected."
    }
};

// ─── Agent Service ────────────────────────────────────────────────────────────

class VideoKycAgentService {

    /**
     * Returns a stage-appropriate response message.
     *
     * @param {Array<{role, parts}>} _history  - Conversation history (unused — no AI)
     * @param {string} _userMessage            - Latest user message (unused)
     * @param {string} stage                   - Current KYC stage
     * @param {Array}  _questions              - Security questions (unused)
     * @returns {Promise<{agentReply: string}>}
     */
    async chat(_history, _userMessage, stage, _questions = []) {
        const reply = CHAT_RESPONSES[stage] || "Please proceed with the next step.";
        return { agentReply: reply };
    }

    /**
     * Yields the stage response as a single chunk (Socket.io streaming compatibility).
     *
     * @param {Array<{role, parts}>} _history   - Conversation history (unused)
     * @param {string} _userMessage             - Latest user message (unused)
     * @param {string} stage                    - Current KYC stage
     * @param {Array}  _questions               - Security questions (unused)
     * @yields {string}  text chunk
     * @returns {AsyncGenerator<string>}
     */
    async *chatStream(_history, _userMessage, stage, _questions = []) {
        const reply = CHAT_RESPONSES[stage] || "Please proceed with the next step.";
        yield reply;
    }

    /**
     * Returns a deterministic image analysis result for the given task.
     *
     * @param {string} _base64Image  - Base64-encoded image (unused — no external API)
     * @param {string} _mimeType     - e.g. "image/jpeg"
     * @param {"pan_ocr"|"liveness"|"anti_spoof"|"active_liveness"|"pan_document_analysis"|"aadhaar_document_analysis"} task
     * @param {object} [_options]    - Additional task metadata (unused)
     * @returns {Promise<object>}
     */
    async analyseImage(_base64Image, _mimeType, task, _options = {}) {
        return IMAGE_RESPONSES[task] || { success: false, reason: `Unknown task: ${task}` };
    }

    /**
     * Returns a deterministic face comparison result.
     *
     * @param {string} _selfieBase64
     * @param {string} _selfieMime
     * @param {string} _documentBase64
     * @param {string} _documentMime
     * @param {number} [threshold=0.75]
     * @returns {Promise<object>}
     */
    async compareFaces(_selfieBase64, _selfieMime, _documentBase64, _documentMime, threshold = 0.75) {
        return {
            ...IMAGE_RESPONSES.face_match,
            threshold
        };
    }

    /**
     * Generates the initial greeting message for a new session.
     * @param {string} stage
     * @returns {string}
     */
    getStageGreeting(stage) {
        return CHAT_RESPONSES[stage] || CHAT_RESPONSES["WELCOME"];
    }

    /**
     * Returns a deterministic voice consistency result.
     *
     * @param {string} _base64Video   - Raw base64 video (unused)
     * @param {string} _mimeType      - "video/webm" | "video/mp4"
     * @param {{ expectedName: string, sessionId: string, minDuration: number }} _context
     * @returns {Promise<{ passed, confidenceScore, transcribedText, details }>}
     */
    async analyseVideoVoice(_base64Video, _mimeType, _context) {
        return {
            passed:          true,
            confidenceScore: 0.95,
            transcribedText: "Voice analysis completed.",
            details:         "Voice consistency check passed."
        };
    }

    /**
     * Returns a deterministic face consistency result.
     *
     * @param {string} _base64Video
     * @param {string} _mimeType
     * @param {{ nameOnPAN: string, panLast4: string }} _context
     * @returns {Promise<{ passed, details }>}
     */
    async analyseVideoFace(_base64Video, _mimeType, _context) {
        return {
            passed:  true,
            details: "Face consistency check passed."
        };
    }
}

module.exports = new VideoKycAgentService();
