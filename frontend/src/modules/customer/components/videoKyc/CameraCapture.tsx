import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Loader2,
  RefreshCcw,
  ScanFace,
} from "lucide-react";

export interface CameraCaptureResult {
  image: string;
  mimeType: string;
  preview: string;
}

interface CameraCaptureProps {
  onCapture: (data: CameraCaptureResult) => void | Promise<void>;
  loading?: boolean;
}

export default function CameraCapture({
  onCapture,
  loading = false,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraStarted, setCameraStarted] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setCameraError("");
      setPreview(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 720,
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraStarted(true);
    } catch (error: any) {
      console.error("Camera error:", error);

      if (error?.name === "NotAllowedError") {
        setCameraError(
          "Camera permission denied. Please allow camera access."
        );
      } else {
        setCameraError("Unable to access camera.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    setCameraStarted(false);
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  const captureImage = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    /*
     Backend wants raw base64.

     data:image/jpeg;base64,ABC123...
                          ↓
                     ABC123...
    */
    const base64 = dataUrl.split(",")[1];

    setPreview(dataUrl);

    await onCapture({
      image: base64,
      mimeType: "image/jpeg",
      preview: dataUrl,
    });
  };

  const retakeImage = () => {
    setPreview(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
          <ScanFace className="size-5" />
        </div>

        <div>
          <h3 className="font-bold text-slate-900">
            Face Verification
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Keep your face clearly visible inside the camera.
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden bg-slate-950 rounded-2xl aspect-video border border-slate-800">
        {!preview ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <img
            src={preview}
            alt="Captured selfie"
            className="w-full h-full object-cover"
          />
        )}

        {!cameraStarted && !preview && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <CameraOff className="size-10 text-slate-400 mb-3" />

            <p className="text-sm font-bold">
              Camera unavailable
            </p>
          </div>
        )}

        {cameraStarted && !preview && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-44 h-56 sm:w-52 sm:h-64 rounded-[45%] border-2 border-white/70" />
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {cameraError && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
          <p className="text-xs font-bold text-rose-600">
            {cameraError}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        {!cameraStarted && !preview && (
          <button
            type="button"
            onClick={startCamera}
            className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800"
          >
            Start Camera
          </button>
        )}

        {cameraStarted && !preview && (
          <button
            type="button"
            onClick={captureImage}
            disabled={loading}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Camera className="size-4" />
                Capture Face
              </>
            )}
          </button>
        )}

        {preview && (
          <button
            type="button"
            onClick={retakeImage}
            disabled={loading}
            className="flex-1 py-3 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-50"
          >
            <RefreshCcw className="size-4" />
            Retake
          </button>
        )}

        {cameraStarted && (
          <button
            type="button"
            onClick={stopCamera}
            className="px-5 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}