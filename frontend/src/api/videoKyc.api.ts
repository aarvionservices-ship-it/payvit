import api from "./axios";

export interface VideoKycQuestion {
  id: string;
  question: string;
}

export interface VideoKycStep {
  status: "pending" | "completed" | "failed";
  completedAt?: string | null;
}

export interface VideoKycData {
  sessionId?: string;

  stage?: string;

  status?: string;

  agentMessage?: string;

  nextAction?: string | null;

  done?: boolean;

  extractedData?: any;

  videoData?: any;

  questions?: VideoKycQuestion[];

  questionsAnswered?: number;

  panLast4?: string;

  nameOnPAN?: string;

  livenessVerified?: boolean;

  steps?: {
    welcome?: VideoKycStep;

    panCapture?: VideoKycStep;

    liveness?: VideoKycStep;

    videoRecording?: VideoKycStep;

    questions?: VideoKycStep;
  };

  startedAt?: string;

  expiresAt?: string;

  completedAt?: string | null;
}

export interface VideoKycResponse {
  success: boolean;

  data: VideoKycData;

  message?: string;
}

export interface UploadVideoKycImagePayload {
  sessionId: string;

  image: string;

  mimeType: string;

  task: "pan_ocr" | "liveness";
}

export interface UploadVideoKycVideoPayload {
  sessionId: string;

  video: string;

  mimeType: string;

  durationSeconds: number;
}

/**
 * Start Video KYC
 */
export async function startVideoKycRequest(): Promise<VideoKycResponse> {
  const response = await api.post(
    "/kyc/video/start-session"
  );

  return response.data;
}

/**
 * Backend uses this endpoint for:
 *
 * 1. WELCOME -> PAN_CAPTURE
 * 2. Security question answers
 *
 * No chatbot UI is used.
 */
export async function sendVideoKycMessageRequest(
  sessionId: string,
  message: string
): Promise<VideoKycResponse> {
  const response = await api.post(
    "/kyc/video/chat",
    {
      sessionId,
      message,
    }
  );

  return response.data;
}

/**
 * PAN / Liveness image upload
 */
export async function uploadVideoKycImageRequest(
  payload: UploadVideoKycImagePayload
): Promise<VideoKycResponse> {
  const response = await api.post(
    "/kyc/video/upload-image",
    payload
  );

  return response.data;
}

/**
 * Video recording upload
 */
export async function uploadVideoKycRecordingRequest(
  payload: UploadVideoKycVideoPayload
): Promise<VideoKycResponse> {
  const response = await api.post(
    "/kyc/video/upload-video",
    payload
  );

  return response.data;
}

/**
 * Get current Video KYC session
 */
export async function getVideoKycSessionRequest(
  sessionId: string
): Promise<VideoKycResponse> {
  const response = await api.get(
    `/kyc/video/session/${sessionId}`
  );

  return response.data;
}