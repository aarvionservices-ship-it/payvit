const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Payvit - Video KYC Backend Architecture & Code Guide</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500;600&display=swap');

  @page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-right {
      content: "Page " counter(page);
      font-size: 9pt;
      color: #718096;
    }
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1a202c;
    background-color: #ffffff;
    line-height: 1.6;
    font-size: 10.5pt;
    margin: 0;
    padding: 0;
  }

  /* Cover / Header */
  .header-card {
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    color: #ffffff;
    padding: 30px;
    border-radius: 12px;
    margin-bottom: 25px;
    box-shadow: 0 4px 15px rgba(30, 58, 138, 0.15);
  }

  .header-card h1 {
    margin: 0 0 8px 0;
    font-size: 24pt;
    font-weight: 800;
    letter-spacing: -0.5px;
  }

  .header-card .subtitle {
    font-size: 13pt;
    font-weight: 400;
    opacity: 0.9;
    margin: 0 0 15px 0;
  }

  .meta-tags {
    display: flex;
    gap: 12px;
    font-size: 9pt;
  }

  .meta-tag {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: 500;
  }

  /* Headings */
  h2 {
    color: #0f172a;
    font-size: 15pt;
    font-weight: 700;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 6px;
    margin-top: 28px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    page-break-after: avoid;
  }

  h3 {
    color: #1e40af;
    font-size: 12pt;
    font-weight: 600;
    margin-top: 18px;
    margin-bottom: 8px;
    page-break-after: avoid;
  }

  p {
    margin: 0 0 10px 0;
    color: #334155;
  }

  /* Stage Badges */
  .stage-flow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 16px 0;
  }

  .stage-badge {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 9pt;
    font-weight: 600;
    color: #334155;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .stage-badge.active {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #1d4ed8;
  }

  /* Code Blocks */
  pre {
    background: #0f172a;
    color: #f8fafc;
    padding: 14px;
    border-radius: 8px;
    font-family: 'Fira Code', monospace;
    font-size: 8.5pt;
    line-height: 1.45;
    overflow-x: auto;
    margin: 12px 0;
    border: 1px solid #1e293b;
    page-break-inside: avoid;
  }

  code {
    font-family: 'Fira Code', monospace;
    font-size: 8.5pt;
    background: #f1f5f9;
    color: #0f172a;
    padding: 2px 5px;
    border-radius: 4px;
  }

  pre code {
    background: transparent;
    color: inherit;
    padding: 0;
  }

  .comment { color: #64748b; font-style: italic; }
  .keyword { color: #f472b6; font-weight: 600; }
  .function { color: #60a5fa; }
  .string { color: #34d399; }
  .number { color: #fbbf24; }

  /* Callout Boxes */
  .callout {
    background: #f8fafc;
    border-left: 4px solid #3b82f6;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 14px 0;
    font-size: 9.5pt;
  }

  .callout.security {
    border-left-color: #10b981;
    background: #f0fdf4;
  }

  .callout.warning {
    border-left-color: #f59e0b;
    background: #fffbeb;
  }

  .callout-title {
    font-weight: 700;
    margin-bottom: 4px;
    color: #0f172a;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }

  th, td {
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background: #f8fafc;
    color: #0f172a;
    font-weight: 600;
  }

  tr:nth-child(even) td {
    background: #fafafa;
  }

  .page-break {
    page-break-before: always;
  }
</style>
</head>
<body>

<div class="header-card">
  <h1>Payvit Video KYC System</h1>
  <div class="subtitle">Complete Backend Architecture, Operational Workflow & Code Guide</div>
  <div class="meta-tags">
    <span class="meta-tag">Stack: Node.js / Express</span>
    <span class="meta-tag">AI: Google Gemini 2.0 Flash</span>
    <span class="meta-tag">Realtime: Socket.io</span>
    <span class="meta-tag">Security: RSA-2048 & Bcrypt</span>
  </div>
</div>

<h2>1. Executive Summary & Architecture Overview</h2>
<p>
  The Video KYC module in Payvit is an AI-orchestrated identity verification pipeline designed to verify users seamlessly without requiring manual agent intervention. It combines computer vision (OCR & Liveness), dynamic security questions, cryptographic verification, and real-time streaming over REST and WebSockets.
</p>

<table>
  <thead>
    <tr>
      <th>Layer / Component</th>
      <th>File Path</th>
      <th>Core Role & Responsibilities</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Routes</strong></td>
      <td><code>src/modules/kyc/routes/kyc.routes.js</code></td>
      <td>Exposes REST endpoints for session initiation, chat, image upload, and OTP verification.</td>
    </tr>
    <tr>
      <td><strong>Controller</strong></td>
      <td><code>src/modules/kyc/controller/videoKyc.controller.js</code></td>
      <td>Handles HTTP request validation, input sanitization (base64 strip), and error dispatching.</td>
    </tr>
    <tr>
      <td><strong>Core Service</strong></td>
      <td><code>src/modules/kyc/service/videoKyc.service.js</code></td>
      <td>Manages the 6-stage finite state machine, question validation, OTP generation, and DB updates.</td>
    </tr>
    <tr>
      <td><strong>AI Agent Engine</strong></td>
      <td><code>src/modules/kyc/service/videoKycAgent.service.js</code></td>
      <td>Interfaces with Google Gemini 2.0 Flash for conversations and Gemini Vision for OCR/liveness.</td>
    </tr>
    <tr>
      <td><strong>Realtime Socket</strong></td>
      <td><code>src/modules/kyc/socket/videoKycSocket.handler.js</code></td>
      <td>Provides low-latency Socket.io namespace (<code>/video-kyc</code>) with token streaming & rate limiting.</td>
    </tr>
    <tr>
      <td><strong>Live Orchestrator</strong></td>
      <td><code>src/modules/kyc/service/videoKycLive.service.js</code></td>
      <td>Manages socket connections, token streaming, and rolling 30-minute session keepalive TTL.</td>
    </tr>
    <tr>
      <td><strong>Database Model</strong></td>
      <td><code>src/modules/kyc/model/VideoKycSession.model.js</code></td>
      <td>Mongoose schema storing stage progression, agent logs, masked PAN, and hashed OTPs.</td>
    </tr>
  </tbody>
</table>

<h2>2. The 6-Stage State Machine Lifecycle</h2>

<div class="stage-flow">
  <div class="stage-badge active">1. WELCOME</div>
  <div class="stage-badge active">➔ 2. PAN_CAPTURE</div>
  <div class="stage-badge active">➔ 3. LIVENESS_CHECK</div>
  <div class="stage-badge active">➔ 4. QUESTIONS</div>
  <div class="stage-badge active">➔ 5. OTP_SENT</div>
  <div class="stage-badge active">➔ 6. COMPLETE</div>
</div>

<div class="callout">
  <div class="callout-title">Finite State Machine Rule</div>
  A session can only transition forward upon strict validation. Each state only accepts its designated inputs: <code>PAN_CAPTURE</code> only accepts PAN card images, <code>LIVENESS_CHECK</code> only accepts selfies, and <code>QUESTIONS</code> enforces in-memory answer verification.
</div>

<div class="page-break"></div>

<h2>3. End-to-End Operational Workflow (How It Works)</h2>

<h3>Phase 1: Session Initiation (WELCOME)</h3>
<p>
  When a user starts Video KYC, the backend verifies they don't already have an active verified record, expires any previous incomplete sessions, generates a distributed Snowflake ID, and picks 2 distinct security questions randomly from the question pool.
</p>

<h3>Phase 2: Conversational Greeting & Confirmation</h3>
<p>
  The AI agent greets the user, explaining the 4 required steps. Once the user replies affirmatively (e.g. <em>"Yes, I am ready"</em>), the state advances to <code>PAN_CAPTURE</code>.
</p>

<h3>Phase 3: PAN Card OCR & RSA Encryption</h3>
<p>
  The user holds their PAN card to the camera. The frame is uploaded in base64. Gemini Vision extracts the 10-character PAN number and full name. The backend:
</p>
<ul>
  <li>Validates format using the standard PAN regex (<code>[A-Z]{5}[0-9]{4}[A-Z]{1}</code>).</li>
  <li>Immediately encrypts the PAN using <strong>RSA-2048 public key encryption</strong>.</li>
  <li>Only stores the masked last 4 digits (<code>panLast4</code>) and cardholder name in plaintext.</li>
</ul>

<h3>Phase 4: Facial Liveness Verification</h3>
<p>
  The user captures a selfie. Gemini Vision inspects the image to confirm a live human face, checks for good lighting, and verifies anti-spoofing flags (ensuring it is not a photo of a screen or printed paper).
</p>

<h3>Phase 5: Dynamic In-Memory Security Questions</h3>
<p>
  The agent asks two security questions (e.g., date of birth, last 4 digits of phone). The user's answers are verified in-memory against their stored profile. If an incorrect answer is given, the session fails immediately for security. Answers are never stored in the database.
</p>

<h3>Phase 6: 2FA OTP & Verification Completion</h3>
<p>
  A cryptographically secure 6-digit OTP is generated (<code>crypto.randomInt</code>), hashed using <strong>Bcrypt (10 salt rounds)</strong>, and dispatched via email/SMS. Upon valid OTP entry:
</p>
<ul>
  <li>The session is marked as <code>COMPLETE</code>.</li>
  <li>The master KYC record in <code>kyc.model.js</code> is updated to <code>verified: true</code>.</li>
  <li>An internal event <code>KYC_VERIFIED</code> is emitted on the <code>eventBus</code>, upgrading wallet limits and enabling credit services.</li>
  <li>An immutable audit log is saved with IP, timestamps, and confidence scores.</li>
</ul>

<div class="page-break"></div>

<h2>4. Deep-Dive Code Walkthrough</h2>

<h3>A. Database Schema (<code>VideoKycSession.model.js</code>)</h3>
<pre><code><span class="keyword">const</span> STAGES = [<span class="string">"WELCOME"</span>, <span class="string">"PAN_CAPTURE"</span>, <span class="string">"LIVENESS_CHECK"</span>, <span class="string">"QUESTIONS"</span>, <span class="string">"OTP_SENT"</span>, <span class="string">"COMPLETE"</span>];

<span class="keyword">const</span> videoKycSessionSchema = <span class="keyword">new</span> mongoose.Schema({
    sessionId:  { <span class="keyword">type</span>: String, required: <span class="keyword">true</span>, unique: <span class="keyword">true</span>, index: <span class="keyword">true</span> },
    userId:     { <span class="keyword">type</span>: String, required: <span class="keyword">true</span>, index: <span class="keyword">true</span> },
    stage:      { <span class="keyword">type</span>: String, enum: STAGES, <span class="keyword">default</span>: <span class="string">"WELCOME"</span> },
    
    <span class="comment">// Cryptographic credentials & extracted identity</span>
    panEncrypted: { <span class="keyword">type</span>: String, <span class="keyword">default</span>: <span class="keyword">null</span> }, <span class="comment">// RSA-2048 encrypted</span>
    panLast4:     { <span class="keyword">type</span>: String, <span class="keyword">default</span>: <span class="keyword">null</span> },
    nameOnPAN:    { <span class="keyword">type</span>: String, <span class="keyword">default</span>: <span class="keyword">null</span> },
    livenessVerified: { <span class="keyword">type</span>: Boolean, <span class="keyword">default</span>: <span class="keyword">false</span> },

    <span class="comment">// Dynamic security questions (answers are NEVER stored)</span>
    questions:    [questionSchema],
    answersLog:   [answerLogSchema],
    questionsAnswered: { <span class="keyword">type</span>: Number, <span class="keyword">default</span>: <span class="number">0</span> },

    <span class="comment">// 2FA OTP state</span>
    otpHash:      { <span class="keyword">type</span>: String, <span class="keyword">default</span>: <span class="keyword">null</span> }, <span class="comment">// Bcrypt hash</span>
    otpExpiresAt: { <span class="keyword">type</span>: Date,   <span class="keyword">default</span>: <span class="keyword">null</span> },
    
    <span class="comment">// Audit transcript</span>
    agentLog:     [agentLogEntrySchema]
});</code></pre>

<h3>B. Core State Orchestrator (<code>videoKyc.service.js</code>)</h3>
<pre><code><span class="comment">// 1. Starting Session & picking random questions</span>
<span class="keyword">async</span> <span class="function">startSession</span>(userId) {
    <span class="keyword">const</span> existingKyc = <span class="keyword">await</span> kycRepo.findByUserId(userId);
    <span class="keyword">if</span> (existingKyc?.panVerified) {
        <span class="keyword">throw</span> <span class="keyword">new</span> AppError(<span class="string">"PAN KYC is already verified for this account."</span>, <span class="number">400</span>);
    }

    <span class="keyword">await</span> VideoKycSession.updateMany({ userId, status: <span class="string">"active"</span> }, { $set: { status: <span class="string">"expired"</span> } });

    <span class="keyword">const</span> shuffled = [...QUESTION_BANK].sort(() =&gt; Math.random() - <span class="number">0.5</span>);
    <span class="keyword">const</span> questions = shuffled.slice(<span class="number">0</span>, <span class="number">2</span>).map(q =&gt; ({ id: q.id, question: q.question }));

    <span class="keyword">const</span> sessionId = snowflake.nextId();
    <span class="keyword">const</span> agentGreeting = agent.getStageGreeting(<span class="string">"WELCOME"</span>);

    <span class="keyword">await</span> VideoKycSession.create({
        sessionId,
        userId,
        stage: <span class="string">"WELCOME"</span>,
        questions,
        agentLog: [{ role: <span class="string">"agent"</span>, message: agentGreeting, stage: <span class="string">"WELCOME"</span>, timestamp: <span class="keyword">new</span> Date() }]
    });

    <span class="keyword">return</span> { sessionId, stage: <span class="string">"WELCOME"</span>, agentMessage: agentGreeting };
}</code></pre>

<div class="page-break"></div>

<h3>C. AI Vision OCR & Liveness (<code>videoKyc.service.js</code> & <code>videoKycAgent.service.js</code>)</h3>
<pre><code><span class="comment">// Upload image handler: delegates to Gemini Vision and handles encryption</span>
<span class="keyword">async</span> <span class="function">uploadImage</span>(sessionId, userId, base64Image, mimeType, task, ipAddress) {
    <span class="keyword">const</span> session = <span class="keyword">await</span> <span class="keyword">this</span>._getActiveSession(sessionId, userId);

    <span class="comment">// Execute Gemini 2.0 Vision analysis</span>
    <span class="keyword">const</span> visionResult = <span class="keyword">await</span> agent.analyseImage(base64Image, mimeType, task);
    <span class="keyword">if</span> (!visionResult.success) {
        <span class="keyword">return</span> { agentMessage: <span class="string">"Image scan failed. Please try again with good lighting."</span>, stage: session.stage };
    }

    <span class="keyword">if</span> (task === <span class="string">"pan_ocr"</span>) {
        <span class="comment">// RSA Encrypt PAN before persisting to database</span>
        session.panEncrypted = Kyc.encryptPAN(visionResult.panNumber);
        session.panLast4     = visionResult.panNumber?.slice(-<span class="number">4</span>);
        session.nameOnPAN    = visionResult.nameOnPAN;
        session.stage        = <span class="string">"LIVENESS_CHECK"</span>;
    } <span class="keyword">else</span> <span class="keyword">if</span> (task === <span class="string">"liveness"</span>) {
        session.livenessVerified = <span class="keyword">true</span>;
        session.stage            = <span class="string">"QUESTIONS"</span>;
    }

    <span class="keyword">await</span> session.save();
    <span class="keyword">return</span> { stage: session.stage, extractedData: { panLast4: session.panLast4, nameOnPAN: session.nameOnPAN } };
}</code></pre>

<h3>D. Final OTP Verification & Downstream Trigger (<code>videoKyc.service.js</code>)</h3>
<pre><code><span class="keyword">async</span> <span class="function">verifyOtp</span>(sessionId, userId, otp, ipAddress) {
    <span class="keyword">const</span> session = <span class="keyword">await</span> <span class="keyword">this</span>._getActiveSession(sessionId, userId, [<span class="string">"active"</span>, <span class="string">"otp_sent"</span>]);

    <span class="comment">// Compare submitted OTP with Bcrypt Hash</span>
    <span class="keyword">const</span> isValid = <span class="keyword">await</span> bcrypt.compare(otp.trim(), session.otpHash);
    <span class="keyword">if</span> (!isValid) <span class="keyword">throw</span> <span class="keyword">new</span> AppError(<span class="string">"Invalid OTP entered."</span>, <span class="number">400</span>);

    session.stage  = <span class="string">"COMPLETE"</span>;
    session.status = <span class="string">"completed"</span>;
    <span class="keyword">await</span> session.save();

    <span class="comment">// Update Master KYC Model</span>
    <span class="keyword">await</span> Kyc.findOneAndUpdate(
        { userId },
        {
            panVerified:  <span class="keyword">true</span>,
            panEncrypted: session.panEncrypted,
            panLast4:     session.panLast4,
            nameOnPAN:    session.nameOnPAN,
            kycType:      <span class="string">"VIDEO_KYC"</span>,
            status:       <span class="string">"verified"</span>,
            verifiedAt:   <span class="keyword">new</span> Date()
        },
        { upsert: <span class="keyword">true</span> }
    );

    <span class="comment">// Emit platform event to upgrade wallet limits</span>
    eventBus.emit(<span class="string">"KYC_VERIFIED"</span>, { userId, type: <span class="string">"VIDEO_KYC"</span> });

    <span class="keyword">return</span> { agentMessage: <span class="string">"Video KYC verified successfully!"</span>, stage: <span class="string">"COMPLETE"</span>, done: <span class="keyword">true</span> };
}</code></pre>

<div class="callout security">
  <div class="callout-title">Security Guarantees Summary</div>
  <ul>
    <li><strong>Zero Plaintext Storage:</strong> PAN is RSA-2048 encrypted; OTP is Bcrypt-hashed.</li>
    <li><strong>In-Memory Question Validation:</strong> Security answers are checked on the fly and never stored.</li>
    <li><strong>Session Keepalive:</strong> Rolling 30-minute keepalive extends TTL on user activity.</li>
    <li><strong>Full Regulatory Audit Trail:</strong> Every state change and AI confidence score is logged in <code>auditService</code>.</li>
  </ul>
</div>

</body>
</html>
`;

const htmlPath = path.join(__dirname, "video_kyc_guide.html");
const pdfPath  = path.join("c:\\payvit", "Video_KYC_Backend_Architecture_and_Code_Guide.pdf");

fs.writeFileSync(htmlPath, htmlContent, "utf8");
console.log("HTML generated at: " + htmlPath);

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

let browserPath = fs.existsSync(edgePath) ? edgePath : (fs.existsSync(chromePath) ? chromePath : null);

if (!browserPath) {
    console.error("No browser found to render PDF.");
    process.exit(1);
}

const cmd = `"${browserPath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
console.log("Running command: " + cmd);
execSync(cmd);

console.log("PDF generated successfully at: " + pdfPath);
