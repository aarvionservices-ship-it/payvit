/**
 * videoKycAgent.service.js
 *
 * Thin wrapper around Google Gemini AI.
 * Provides two capabilities:
 *   1. chat()        — conversational agent (Gemini 2.0 Flash)
 *   2. analyseImage()— vision-based tasks: PAN OCR and liveness check
 *
 * When VIDEO_KYC_MOCK_MODE=true (default), all Gemini calls are bypassed and
 * deterministic mock responses are returned — perfect for local development.
 */

const config = require("../../../core/config/env.config");

function isMockMode() {
    return process.env.VIDEO_KYC_MOCK_MODE !== "false";
}

// ─── Lazy-load Gemini SDK (only imported when not in mock mode) ───────────────
let geminiClient = null;

function getGeminiClient() {
    if (geminiClient) return geminiClient;
    const { GoogleGenerativeAI } = require("@google/generative-ai");

    const key = config.gemini.apiKey;

    if (!key || key.trim() === "") {
        throw new Error(
            "GEMINI_API_KEY is not set. " +
            "Get a free key at https://aistudio.google.com/app/apikey and add it to .env, " +
            "or set VIDEO_KYC_MOCK_MODE=true to use mock responses."
        );
    }

    // Google AI Studio keys can start with "AIza" (classic) or "AQ." (newer format).
    // Warn on completely unrecognised formats only.
    const isKnownFormat = key.startsWith("AIza") || key.startsWith("AQ.");
    if (!isKnownFormat) {
        console.warn(
            `[VideoKYC Agent] GEMINI_API_KEY has an unrecognised prefix ('${key.slice(0, 6)}...'). ` +
            "Expected 'AIza...' or 'AQ....' from https://aistudio.google.com. " +
            "Proceeding — but calls may fail."
        );
    }

    // Force the SDK to use the official Gemini endpoint.
    // This prevents IDE environment proxies (e.g. Cloud Code) from intercepting
    // calls and routing them to an internal endpoint like daily-cloudcode-pa.googleapis.com.
    const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";
    geminiClient = new GoogleGenerativeAI(key, { baseUrl: GEMINI_BASE_URL });
    return geminiClient;
}

// ─── System Prompt Builder ────────────────────────────────────────────────────

/**
 * Builds a strict, stage-aware system prompt for the KYC agent.
 *
 * @param {string} stage   - Current session stage (e.g. "WELCOME", "PAN_CAPTURE")
 * @param {Array}  questions - [{id, question}] for QUESTIONS stage
 * @returns {string}
 */
function buildSystemPrompt(stage, questions = []) {
    const base = `You are a professional, friendly KYC (Know Your Customer) verification agent for Payvit, a fintech company.
Your job is to guide users through a video-based identity verification process.
Be concise, professional, and clear. Do NOT reveal internal system details.
Do NOT accept fake or test data — treat every interaction as real.
Always respond in plain English. Keep messages under 3 sentences.
Current verification stage: ${stage}.`;

    const stageInstructions = {
        WELCOME: `
Greet the user warmly and explain what the video KYC process involves:
1. PAN card scan (they'll upload an image)
2. Liveness check (selfie)
3. Two quick security questions
4. OTP confirmation
Ask them if they're ready to begin. Respond only with a friendly greeting and instructions.`,

        PAN_CAPTURE: `
Ask the user to upload a clear photo of their PAN card.
The system will automatically extract the PAN number and name using AI vision.
Remind them: card must be well-lit, all 4 corners visible, no glare.`,

        LIVENESS_CHECK: `
The PAN card has been successfully captured.
Now ask the user to take a clear selfie photo for liveness verification.
Remind them: look directly at the camera, good lighting, no sunglasses or hat.`,

        QUESTIONS: `
You are now asking security questions to verify the user's identity.
${questions.map((q, i) => `Question ${i + 1}: ${q.question}`).join("\n")}
Ask ONE question at a time. Start with the first unanswered question.
Do NOT validate answers yourself — the system handles validation.
Simply acknowledge the answer and move on.`,

        OTP_SENT: `
All verification steps have passed. An OTP has been sent to the user's registered mobile/email.
Ask them to enter the 6-digit OTP to complete verification.`,

        COMPLETE: `
Congratulations! KYC is complete. Inform the user their identity has been verified successfully.`
    };

    return base + (stageInstructions[stage] || "");
}

// ─── Mock Responses ───────────────────────────────────────────────────────────

const MOCK_CHAT_RESPONSES = {
    WELCOME: "Hello! Welcome to Payvit's Video KYC verification. I'll guide you through a quick 4-step process: PAN scan, selfie liveness check, security questions, and OTP confirmation. Are you ready to begin?",
    PAN_CAPTURE: "Please upload a clear photo of your PAN card. Make sure it's well-lit with all 4 corners visible and no glare on the card.",
    LIVENESS_CHECK: "Your PAN card has been captured successfully! Now please take a clear selfie. Look directly at the camera in good lighting — no sunglasses or hats please.",
    QUESTIONS: "Great! Let's verify your identity with a couple of quick questions. Please answer accurately.",
    OTP_SENT: "All verification steps passed! I've sent a 6-digit OTP to your registered mobile number and email. Please enter it to complete your KYC.",
    COMPLETE: "🎉 Congratulations! Your Video KYC verification is complete. Your identity has been successfully verified."
};

const MOCK_IMAGE_RESPONSES = {
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
     * Sends a chat message to the Gemini agent.
     * Maintains full conversation history for context.
     *
     * @param {Array<{role, parts}>} history  - Gemini conversation history
     * @param {string} userMessage            - Latest user message
     * @param {string} stage                  - Current KYC stage
     * @param {Array}  questions              - Security questions (for QUESTIONS stage)
     * @returns {Promise<{agentReply: string}>}
     */
    async chat(history, userMessage, stage, questions = []) {
        if (isMockMode()) {
            const reply = MOCK_CHAT_RESPONSES[stage] || "Please proceed with the next step.";
            return { agentReply: reply };
        }

        const genAI  = getGeminiClient();
        const model  = genAI.getGenerativeModel({
            model:          config.gemini.model,
            systemInstruction: buildSystemPrompt(stage, questions)
        });

        // Convert our agentLog history format to Gemini's format
        let geminiHistory = history
            .filter(entry => entry.role !== "system")
            .map(entry => ({
                role:  entry.role === "agent" ? "model" : "user",
                parts: [{ text: entry.message }]
            }));

        // Gemini requires the first message in history to have role "user"
        while (geminiHistory.length > 0 && geminiHistory[0].role === "model") {
            geminiHistory.shift();
        }

        const chat = model.startChat({ history: geminiHistory });

        const result = await chat.sendMessage(userMessage);
        const agentReply = result.response.text().trim();

        return { agentReply };
    }

    /**
     * Streaming version of chat() — yields text chunks token-by-token.
     * Designed for use by the real-time Socket.io layer so the agent's reply
     * can be sent to the client as it is generated rather than waiting for the
     * full response.
     *
     * In mock mode, yields the full mock reply as a single chunk so behaviour
     * is identical from the caller's perspective.
     *
     * @param {Array<{role, parts}>} history   - Gemini conversation history
     * @param {string} userMessage             - Latest user message
     * @param {string} stage                   - Current KYC stage
     * @param {Array}  questions               - Security questions (QUESTIONS stage)
     * @yields {string}  text chunk
     * @returns {AsyncGenerator<string>}
     */
    async *chatStream(history, userMessage, stage, questions = []) {
        if (isMockMode()) {
            const reply = MOCK_CHAT_RESPONSES[stage] || "Please proceed with the next step.";
            yield reply;   // single chunk in mock mode
            return;
        }

        const genAI  = getGeminiClient();
        const model  = genAI.getGenerativeModel({
            model:             config.gemini.model,
            systemInstruction: buildSystemPrompt(stage, questions)
        });

        // Convert conversation history
        let geminiHistory = history
            .filter(entry => entry.role !== "system")
            .map(entry => ({
                role:  entry.role === "agent" ? "model" : "user",
                parts: [{ text: entry.message }]
            }));

        // Gemini requires the first message in history to have role "user"
        while (geminiHistory.length > 0 && geminiHistory[0].role === "model") {
            geminiHistory.shift();
        }

        const chat = model.startChat({ history: geminiHistory });

        // ── Attempt streaming ───────────────────────────────────────────────────
        // If the Gemini stream connection is aborted mid-way (Windows wsarecv /
        // ECONNABORTED / ERR_HTTP2_STREAM_ERROR), we catch the error, log it,
        // and fall back to a single non-streaming call so the caller always
        // receives a complete reply.
        let streamStarted = false;
        try {
            const stream = await chat.sendMessageStream(userMessage);

            for await (const chunk of stream.stream) {
                const text = chunk.text();
                if (text) {
                    streamStarted = true;
                    yield text;
                }
            }
        } catch (streamErr) {
            const isNetworkAbort =
                streamErr.message?.includes("wsarecv") ||
                streamErr.message?.includes("stream reading error") ||
                streamErr.message?.includes("ECONNABORTED") ||
                streamErr.message?.includes("ERR_HTTP2_STREAM_ERROR") ||
                streamErr.message?.includes("connection was aborted") ||
                streamErr.message?.includes("no such host") ||
                streamErr.message?.includes("ENOTFOUND") ||
                streamErr.message?.includes("ETIMEDOUT") ||
                streamErr.message?.includes("ECONNREFUSED") ||
                streamErr.message?.includes("dial tcp");

            if (isNetworkAbort) {
                // Only fall back if we haven't already streamed partial content
                if (!streamStarted) {
                    console.warn(
                        "[VideoKYC Agent] Stream connection aborted — falling back to non-streaming call.",
                        streamErr.message
                    );
                    // Fall back: single blocking call, yield the whole reply at once
                    const fallbackChat   = model.startChat({ history: geminiHistory });
                    const fallbackResult = await fallbackChat.sendMessage(userMessage);
                    const fallbackText   = fallbackResult.response.text().trim();
                    if (fallbackText) yield fallbackText;
                } else {
                    // Partial content already streamed — log and swallow;
                    // the caller will use whatever was received.
                    console.warn(
                        "[VideoKYC Agent] Stream aborted after partial content — using partial reply.",
                        streamErr.message
                    );
                }
            } else {
                // Non-network error (e.g. invalid API key, quota exceeded) — rethrow
                throw streamErr;
            }
        }
    }

    /**
     * Analyses an uploaded single image for PAN OCR, passive liveness, or anti-spoof.
     *
     * @param {string} base64Image  - Base64-encoded image (without data URI prefix)
     * @param {string} mimeType     - e.g. "image/jpeg", "image/png"
     * @param {"pan_ocr"|"liveness"|"anti_spoof"|"active_liveness"} task
     * @param {object} [options]    - Additional task metadata (e.g. expectedAction)
     * @returns {Promise<object>}
     */
    async analyseImage(base64Image, mimeType, task, options = {}) {
        if (isMockMode()) {
            return MOCK_IMAGE_RESPONSES[task] || { success: false, reason: `Unknown mock task ${task}` };
        }

        const genAI  = getGeminiClient();
        const model  = genAI.getGenerativeModel({ model: config.gemini.model });

        const imagePart = {
            inlineData: {
                data:     base64Image,
                mimeType: mimeType || "image/jpeg"
            }
        };

        let prompt;
        if (task === "pan_ocr") {
            prompt = `You are an OCR system analyzing an Indian PAN card image.
Extract the following fields from the image:
1. PAN number (format: 5 uppercase letters, 4 digits, 1 uppercase letter — e.g. ABCDE1234F)
2. Name printed on the card

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{"success": true, "panNumber": "XXXXX0000X", "nameOnPAN": "FULL NAME", "confidence": 0.95}

If the image is not a valid PAN card or text is unreadable, respond:
{"success": false, "reason": "brief explanation"}`;
        } else if (task === "liveness") {
            prompt = `You are a biometric passive liveness detection AI for a banking KYC system.
Analyze this image and determine if it shows a live, physical human being present in front of the camera.
Check for:
- 3D facial depth and natural skin texture
- Natural light reflections on the cornea and skin
- Absense of screen borders, digital moiré patterns, paper cutouts, or masks

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{"success": true, "livenessPassed": true, "confidence": 0.95, "reason": "Live human face verified"}

If liveness fails (e.g., photo of a screen, printed paper photo, mannequin/mask, or no face detected):
{"success": true, "livenessPassed": false, "confidence": 0.15, "reason": "brief reason"}`;
        } else if (task === "anti_spoof") {
            prompt = `You are an AI biometric anti-spoofing and presentation attack detection (PAD) analyzer for a fintech platform.
Examine this selfie image for presentation attacks, digital spoofs, and physical bypasses:
1. Screen replay attacks (computer monitor, mobile screen, tablet LCD, moiré banding, reflection glares)
2. Printed paper attacks (paper edges, matte reflection, folded photo)
3. 3D masks, silicone prosthetics, or cutouts around eyes/mouth
4. Deepfake or AI generation artifacts (unnatural eye pupils, blurred skin blending, distortion)
5. Multiple faces or face truncation

Respond ONLY with valid JSON in this exact format:
{
  "success": true,
  "passed": true,
  "isSpoofDetected": false,
  "spoofRiskScore": 0.05,
  "indicators": [],
  "quality": {
    "brightness": 85,
    "sharpness": 90,
    "faceDetected": true,
    "multipleFaces": false
  },
  "reason": "Authentic physical face capture without spoof artifacts."
}

If spoof or low quality is detected:
{
  "success": true,
  "passed": false,
  "isSpoofDetected": true,
  "spoofRiskScore": 0.85,
  "indicators": ["screen_replay"],
  "quality": {
    "brightness": 50,
    "sharpness": 40,
    "faceDetected": true,
    "multipleFaces": false
  },
  "reason": "Moiré pattern and screen border detected."
}`;
        } else if (task === "active_liveness") {
            const expectedAction = options.expectedAction || "blink";
            prompt = `You are an active liveness verification AI for KYC.
The user was asked to perform the action: "${expectedAction}".
Analyze this image/frame and verify if the user has performed or is performing this action.

Respond ONLY with valid JSON in this exact format:
{"success": true, "challengePassed": true, "confidence": 0.95, "actionDetected": "${expectedAction}", "reason": "Action verified successfully"}

If the user did not perform the action:
{"success": true, "challengePassed": false, "confidence": 0.2, "actionDetected": "none", "reason": "Action ${expectedAction} not detected"}`;
        } else if (task === "pan_document_analysis") {
            prompt = `You are an expert Indian KYC document authenticity and OCR analyzer.
Examine this PAN card photo.
1. Determine if this is an ORIGINAL PHYSICAL PAN card (check for physical card edges, texture, embossed lettering, holograms vs photocopy / printout / computer or phone screen photo).
2. Extract PAN number (5 uppercase letters, 4 digits, 1 uppercase letter) and Name on card, DOB if visible.
3. Check image quality: glare, blur, corners visible.

Respond ONLY with valid JSON in this format:
{
  "success": true,
  "isOriginal": true,
  "panNumber": "ABCDE1234F",
  "nameOnPAN": "FULL NAME",
  "dob": "DD/MM/YYYY",
  "confidence": 0.95,
  "quality": {
    "brightness": 85,
    "sharpness": 90,
    "cornersVisible": true,
    "glareDetected": false,
    "isPhotocopyOrScreen": false
  },
  "reason": "Original physical PAN card verified."
}

If the image is not an original card (e.g. black and white photocopy, screen replay, tampered, or unreadable):
{
  "success": false,
  "isOriginal": false,
  "reason": "Clear explanation of why validation failed."
}`;
        } else if (task === "aadhaar_document_analysis") {
            prompt = `You are an expert Indian KYC document validator.
Analyze this Aadhaar card image (front or back).
1. Check if it is a valid government-issued Aadhaar card image.
2. Check if the first 8 digits are masked (XXXX XXXX 1234) or unmasked.
3. Extract visible details: last 4 digits of Aadhaar, Name, DOB, Gender, Address if visible.
4. Assess image readability and quality.

Respond ONLY with valid JSON in this format:
{
  "success": true,
  "isMasked": true,
  "aadhaarLast4": "1234",
  "nameOnAadhaar": "FULL NAME",
  "dob": "DD/MM/YYYY",
  "gender": "MALE/FEMALE/OTHER",
  "confidence": 0.95,
  "quality": {
    "brightness": 85,
    "sharpness": 88,
    "textReadable": true
  },
  "reason": "Valid Aadhaar card image analyzed."
}

If invalid or unreadable:
{
  "success": false,
  "isMasked": false,
  "reason": "Explanation of failure"
}`;
        } else {
            throw new Error(`Unknown image analysis task: ${task}`);
        }

        const result = await model.generateContent([prompt, imagePart]);
        const text   = result.response.text().trim();
        const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

        try {
            return JSON.parse(cleaned);
        } catch {
            throw new Error(`Gemini returned unparseable response for task ${task}: ${text}`);
        }
    }

    /**
     * Compares two face images (e.g. captured selfie vs PAN card / Aadhaar photo).
     *
     * @param {string} selfieBase64
     * @param {string} selfieMime
     * @param {string} documentBase64
     * @param {string} documentMime
     * @param {number} [threshold=0.75]
     * @returns {Promise<object>}
     */
    async compareFaces(selfieBase64, selfieMime, documentBase64, documentMime, threshold = 0.75) {
        if (isMockMode()) {
            return {
                ...MOCK_IMAGE_RESPONSES.face_match,
                threshold
            };
        }

        const genAI  = getGeminiClient();
        const model  = genAI.getGenerativeModel({ model: config.gemini.model });

        const selfiePart = {
            inlineData: {
                data:     selfieBase64,
                mimeType: selfieMime || "image/jpeg"
            }
        };

        const docPart = {
            inlineData: {
                data:     documentBase64,
                mimeType: documentMime || "image/jpeg"
            }
        };

        const prompt = `You are an advanced biometric face-matching AI for banking KYC identity verification.
Compare the person in Image 1 (Live Selfie) with the person on the identity document in Image 2 (PAN / Aadhaar card photo).

Analyze:
1. Facial bone structure, jawline shape, and facial symmetry
2. Distance and geometry between eyes, nose base, and mouth corners
3. Ear shape, eyebrow arch, and distinct facial landmarks
4. Account for age variations, lighting differences, camera angles, and glasses

Match Threshold: ${threshold} (Similarity score >= ${threshold} is considered a match).

Respond ONLY with valid JSON in this exact format (no markdown, no additional text):
{
  "success": true,
  "isMatch": true,
  "similarityScore": 0.88,
  "confidence": 0.92,
  "threshold": ${threshold},
  "details": "High confidence match across facial geometry and ocular landmarks."
}

If the faces do NOT match:
{
  "success": true,
  "isMatch": false,
  "similarityScore": 0.32,
  "confidence": 0.95,
  "threshold": ${threshold},
  "details": "Different facial structure and nose-jawline dimensions."
}`;

        const result  = await model.generateContent([prompt, selfiePart, docPart]);
        const text    = result.response.text().trim();
        const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

        try {
            const parsed = JSON.parse(cleaned);
            parsed.isMatch = typeof parsed.similarityScore === "number"
                ? parsed.similarityScore >= threshold
                : !!parsed.isMatch;
            parsed.threshold = threshold;
            return parsed;
        } catch {
            throw new Error(`Gemini returned unparseable face comparison response: ${text}`);
        }
    }

    /**
     * Generates the initial greeting message for a new session.
     * @param {string} stage
     * @returns {string}
     */
    getStageGreeting(stage) {
        return MOCK_CHAT_RESPONSES[stage] || MOCK_CHAT_RESPONSES["WELCOME"];
    }

    // ─── Video Voice Consistency Analysis ─────────────────────────────────────

    /**
     * Analyse a video clip for voice consistency.
     * Sends the base64 video as a multimodal input to Gemini and instructs it
     * to check:
     *   - Whether the person speaks clearly and states their identity
     *   - Whether the spoken content is consistent with the user's KYC record
     *   - Whether the audio/lip sync suggests a live recording (no deepfake)
     *
     * @param {string} base64Video   - Raw base64 video
     * @param {string} mimeType      - "video/webm" | "video/mp4"
     * @param {{ expectedName: string, sessionId: string, minDuration: number }} context
     * @returns {{ passed, confidenceScore, transcribedText, details }}
     */
    async analyseVideoVoice(base64Video, mimeType, context) {
        if (isMockMode()) {
            return {
                passed:          true,
                confidenceScore: 0.95,
                transcribedText: "[MOCK] Voice analysis skipped in mock mode.",
                details:         "Mock mode — voice consistency assumed passed."
            };
        }

        const client = getGeminiClient();
        const model  = client.getGenerativeModel({ model: "gemini-2.0-flash" });

        const videoPart = {
            inlineData: {
                data:     base64Video,
                mimeType: mimeType || "video/webm"
            }
        };

        const prompt = `You are a KYC voice consistency verification AI.

Analyse the provided video recording and perform a voice consistency check:

1. TRANSCRIPTION: Transcribe all spoken words from the video.
2. IDENTITY MATCH: The person should state their full name. Expected name: "${context.expectedName || "Not provided"}".
   Check if the spoken name matches or is close to the expected name.
3. LIVENESS INDICATORS: Check for:
   - Natural speech patterns (not a recording played back)
   - Lip sync matches audio
   - Background audio is consistent with a live recording
   - No obvious deepfake artefacts in voice/video sync
4. DURATION: The video should contain at least ${context.minDuration} seconds of active content.

Respond ONLY with valid JSON (no markdown):
{
  "passed": true,
  "confidenceScore": 0.92,
  "transcribedText": "My name is John Doe ...",
  "details": "Voice matches expected name. Natural speech detected. Lip sync consistent."
}

If voice check fails:
{
  "passed": false,
  "confidenceScore": 0.45,
  "transcribedText": "...",
  "details": "Reason voice check failed."
}`;

        try {
            const result  = await model.generateContent([prompt, videoPart]);
            const text    = result.response.text().trim();
            const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

            const parsed = JSON.parse(cleaned);
            return {
                passed:          !!parsed.passed,
                confidenceScore: parsed.confidenceScore ?? 0,
                transcribedText: parsed.transcribedText ?? null,
                details:         parsed.details ?? null
            };
        } catch (err) {
            throw new Error(`Gemini voice analysis failed: ${err.message}`);
        }
    }

    // ─── Video Face Consistency Analysis ──────────────────────────────────────

    /**
     * Analyse a video clip for face consistency.
     * Checks that the same face is visible and consistent throughout the video
     * (no face-swapping, no multiple people, no obscured face).
     *
     * @param {string} base64Video
     * @param {string} mimeType
     * @param {{ nameOnPAN: string, panLast4: string }} context
     * @returns {{ passed, details }}
     */
    async analyseVideoFace(base64Video, mimeType, context) {
        if (isMockMode()) {
            return {
                passed:  true,
                details: "Mock mode — face consistency assumed passed."
            };
        }

        const client = getGeminiClient();
        const model  = client.getGenerativeModel({ model: "gemini-2.0-flash" });

        const videoPart = {
            inlineData: {
                data:     base64Video,
                mimeType: mimeType || "video/webm"
            }
        };

        const prompt = `You are a KYC face consistency verification AI.

Analyse the provided video recording for face consistency:

1. SINGLE PERSON: Verify only one person is present throughout the video.
2. FACE VISIBILITY: The face must be clearly visible and unobscured for the majority of the recording.
3. CONSISTENCY: The same face must appear throughout — no face swapping or cuts to a different person.
4. ANTI-DEEPFAKE: Look for signs of AI-generated or manipulated video (unnatural blinking, texture artefacts, lighting inconsistencies).
5. LIVE PRESENCE: The person should appear to be physically present (not a photo or screen replay).

Respond ONLY with valid JSON (no markdown):
{
  "passed": true,
  "details": "Single face consistently visible. No deepfake indicators detected. Natural blinking and head movement observed."
}

If face check fails:
{
  "passed": false,
  "details": "Reason face consistency check failed."
}`;

        try {
            const result  = await model.generateContent([prompt, videoPart]);
            const text    = result.response.text().trim();
            const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

            const parsed = JSON.parse(cleaned);
            return {
                passed:  !!parsed.passed,
                details: parsed.details ?? null
            };
        } catch (err) {
            throw new Error(`Gemini face consistency analysis failed: ${err.message}`);
        }
    }
}

module.exports = new VideoKycAgentService();
