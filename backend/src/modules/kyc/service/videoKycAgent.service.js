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
     * Analyses an uploaded image for PAN OCR or liveness detection.
     *
     * @param {string} base64Image  - Base64-encoded image (without data URI prefix)
     * @param {string} mimeType     - e.g. "image/jpeg", "image/png"
     * @param {"pan_ocr"|"liveness"} task
     * @returns {Promise<object>}
     */
    async analyseImage(base64Image, mimeType, task) {
        if (isMockMode()) {
            return MOCK_IMAGE_RESPONSES[task] || { success: false, reason: "Unknown task" };
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
            prompt = `You are a liveness detection AI for a KYC system.
Analyse this image and determine if it shows a real, live human face (not a photo of a photo, not a screen, not a mask).

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{"success": true, "livenessPassed": true, "confidence": 0.95, "reason": "Live face detected"}

If liveness check fails or no face is detected:
{"success": true, "livenessPassed": false, "confidence": 0.1, "reason": "brief reason"}`;
        } else {
            throw new Error(`Unknown image analysis task: ${task}`);
        }

        const result = await model.generateContent([prompt, imagePart]);
        const text   = result.response.text().trim();

        // Strip markdown code fences if Gemini wraps the JSON
        const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

        try {
            return JSON.parse(cleaned);
        } catch {
            throw new Error(`Gemini returned unparseable response for task ${task}: ${text}`);
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
}

module.exports = new VideoKycAgentService();
