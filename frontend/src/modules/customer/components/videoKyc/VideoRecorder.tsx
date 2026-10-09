import {
  Camera,
  CircleStop,
  Loader2,
  Mic,
  Play,
  RefreshCcw,
  Video,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";

interface VideoRecorderResult {
  video: string;
  mimeType: string;
  durationSeconds: number;
}

interface VideoRecorderProps {
  onSubmit: (
    data: VideoRecorderResult
  ) => void | Promise<void>;

  loading?: boolean;
}

const MIN_DURATION = 20;
const MAX_DURATION = 120;

export default function VideoRecorder({
  onSubmit,
  loading = false,
}: VideoRecorderProps) {
  const liveVideoRef =
    useRef<HTMLVideoElement | null>(null);

  const previewVideoRef =
    useRef<HTMLVideoElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const recorderRef =
    useRef<MediaRecorder | null>(null);

  const chunksRef =
    useRef<Blob[]>([]);

  const timerRef =
    useRef<number | null>(null);

  const recordingStartRef =
    useRef<number | null>(null);

  const [cameraReady, setCameraReady] =
    useState(false);

  const [recording, setRecording] =
    useState(false);

  const [duration, setDuration] =
    useState(0);

  const [videoBlob, setVideoBlob] =
    useState<Blob | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [mimeType, setMimeType] =
    useState("video/webm");

  const [error, setError] =
    useState("");

  const getSupportedMimeType = () => {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];

    for (const type of types) {
      if (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(type)
      ) {
        return type;
      }
    }

    return "";
  };

  const startCamera = async () => {
    try {
      setError("");

      if (
        !navigator.mediaDevices?.getUserMedia
      ) {
        throw new Error(
          "Camera and microphone are not supported in this browser."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              facingMode: "user",

              width: {
                ideal: 1280,
              },

              height: {
                ideal: 720,
              },
            },

            audio: true,
          }
        );

      streamRef.current = stream;

      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject =
          stream;
      }

      setCameraReady(true);
    } catch (err: any) {
      console.error(
        "Video camera error:",
        err
      );

      if (
        err?.name ===
        "NotAllowedError"
      ) {
        setError(
          "Camera or microphone permission was denied. Please allow both permissions."
        );
      } else {
        setError(
          err?.message ||
            "Unable to access camera and microphone."
        );
      }
    }
  };

  const stopCamera = () => {
    streamRef.current
      ?.getTracks()
      .forEach((track) =>
        track.stop()
      );

    streamRef.current = null;

    setCameraReady(false);
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (timerRef.current) {
        window.clearInterval(
          timerRef.current
        );
      }

      streamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, []);

  const startRecording = () => {
    const stream =
      streamRef.current;

    if (!stream) {
      toast.error(
        "Camera is not ready"
      );

      return;
    }

    if (
      typeof MediaRecorder ===
      "undefined"
    ) {
      toast.error(
        "Video recording is not supported in this browser"
      );

      return;
    }

    try {
      chunksRef.current = [];

      setVideoBlob(null);

      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );
      }

      setPreviewUrl("");
      setDuration(0);

      const supportedMime =
        getSupportedMimeType();

      const recorder =
        supportedMime
          ? new MediaRecorder(
              stream,
              {
                mimeType:
                  supportedMime,
              }
            )
          : new MediaRecorder(
              stream
            );

      setMimeType(
        recorder.mimeType ||
          supportedMime ||
          "video/webm"
      );

      recorderRef.current =
        recorder;

      recorder.ondataavailable = (
        event
      ) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          chunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = () => {
        const actualMime =
          recorder.mimeType ||
          supportedMime ||
          "video/webm";

        const blob = new Blob(
          chunksRef.current,
          {
            type: actualMime,
          }
        );

        const url =
          URL.createObjectURL(
            blob
          );

        setMimeType(actualMime);
        setVideoBlob(blob);
        setPreviewUrl(url);

        setRecording(false);
      };

      recorder.start(1000);

      recordingStartRef.current =
        Date.now();

      setRecording(true);

      timerRef.current =
        window.setInterval(() => {
          if (
            !recordingStartRef.current
          ) {
            return;
          }

          const seconds =
            Math.floor(
              (Date.now() -
                recordingStartRef.current) /
                1000
            );

          setDuration(seconds);

          if (
            seconds >=
            MAX_DURATION
          ) {
            stopRecording();
          }
        }, 500);
    } catch (err) {
      console.error(
        "Recording error:",
        err
      );

      toast.error(
        "Unable to start video recording"
      );
    }
  };

  const stopRecording = () => {
    if (
      recorderRef.current &&
      recorderRef.current.state !==
        "inactive"
    ) {
      recorderRef.current.stop();
    }

    if (timerRef.current) {
      window.clearInterval(
        timerRef.current
      );

      timerRef.current = null;
    }

    if (
      recordingStartRef.current
    ) {
      const seconds =
        (Date.now() -
          recordingStartRef.current) /
        1000;

      setDuration(
        Math.round(
          seconds * 10
        ) / 10
      );
    }

    setRecording(false);
  };

  const blobToBase64 = (
    blob: Blob
  ): Promise<string> => {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onloadend = () => {
          if (
            typeof reader.result !==
            "string"
          ) {
            reject(
              new Error(
                "Unable to process video"
              )
            );

            return;
          }

          const base64 =
            reader.result.split(
              ","
            )[1];

          if (!base64) {
            reject(
              new Error(
                "Invalid video data"
              )
            );

            return;
          }

          resolve(base64);
        };

        reader.onerror =
          () =>
            reject(
              new Error(
                "Unable to read video"
              )
            );

        reader.readAsDataURL(
          blob
        );
      }
    );
  };

  const submitVideo =
    async () => {
      if (!videoBlob) {
        toast.error(
          "Please record your video first"
        );

        return;
      }

      if (
        duration <
        MIN_DURATION
      ) {
        toast.error(
          `Please record for at least ${MIN_DURATION} seconds`
        );

        return;
      }

      try {
        const base64 =
          await blobToBase64(
            videoBlob
          );

        await onSubmit({
          video: base64,
          mimeType:
            mimeType.split(";")[0],
          durationSeconds:
            duration,
        });
      } catch (err: any) {
        toast.error(
          err?.message ||
            "Unable to process video"
        );
      }
    };

  const retakeVideo = () => {
    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setPreviewUrl("");
    setVideoBlob(null);
    setDuration(0);

    chunksRef.current = [];
  };

  const formatDuration = (
    seconds: number
  ) => {
    const minutes =
      Math.floor(seconds / 60);

    const remainingSeconds =
      Math.floor(
        seconds % 60
      );

    return `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="size-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Video className="size-8" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mt-4">
          Live Video Verification
        </h3>

        <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
          Record a minimum
          20-second video while
          looking directly at the
          camera.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm font-bold text-blue-800">
          During the recording
          clearly state:
        </p>

        <ul className="mt-2 ml-5 list-disc text-sm text-blue-700 space-y-1">
          <li>
            Your full name
          </li>

          <li>
            Your date of birth
          </li>

          <li>
            Last 4 digits of
            your registered
            mobile number
          </li>
        </ul>
      </div>

      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950">
        {!previewUrl ? (
          <video
            ref={liveVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <video
            ref={
              previewVideoRef
            }
            src={previewUrl}
            controls
            playsInline
            className="w-full h-full object-contain bg-black"
          />
        )}

        {recording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold">
            <span className="size-2 rounded-full bg-white animate-pulse" />

            REC{" "}
            {formatDuration(
              duration
            )}
          </div>
        )}

        {!recording &&
          !previewUrl &&
          cameraReady && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg text-xs">
              Camera and
              microphone ready
            </div>
          )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!cameraReady &&
        !previewUrl && (
          <button
            type="button"
            onClick={
              startCamera
            }
            className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          >
            <Camera className="size-4" />

            Enable Camera
          </button>
        )}

      {cameraReady &&
        !recording &&
        !previewUrl && (
          <button
            type="button"
            onClick={
              startRecording
            }
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="size-3 bg-red-500 rounded-full" />

            Start Recording
          </button>
        )}

      {recording && (
        <div>
          <button
            type="button"
            onClick={
              stopRecording
            }
            className="w-full py-3.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <CircleStop className="size-5" />

            Stop Recording
          </button>

          {duration <
            MIN_DURATION && (
            <p className="text-xs text-center text-amber-600 mt-2 font-medium">
              Keep recording
              for{" "}
              {Math.ceil(
                MIN_DURATION -
                  duration
              )}{" "}
              more seconds.
            </p>
          )}
        </div>
      )}

      {previewUrl && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            {duration >=
            MIN_DURATION ? (
              <span className="text-emerald-600">
                ✓ Recording
                duration:{" "}
                {duration.toFixed(
                  1
                )}{" "}
                seconds
              </span>
            ) : (
              <span className="text-red-600">
                Recording is
                only{" "}
                {duration.toFixed(
                  1
                )}{" "}
                seconds
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={
                retakeVideo
              }
              disabled={loading}
              className="py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <RefreshCcw className="size-4" />

              Record Again
            </button>

            <button
              type="button"
              onClick={
                submitVideo
              }
              disabled={
                loading ||
                duration <
                  MIN_DURATION
              }
              className="py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}

              {loading
                ? "Verifying..."
                : "Submit Video"}
            </button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="border border-slate-200 rounded-xl p-4">
          <Camera className="size-5 text-blue-600" />

          <p className="font-semibold text-sm text-slate-800 mt-2">
            Face visible
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Keep your face
            inside the camera
            throughout the
            recording.
          </p>
        </div>

        <div className="border border-slate-200 rounded-xl p-4">
          <Mic className="size-5 text-blue-600" />

          <p className="font-semibold text-sm text-slate-800 mt-2">
            Speak clearly
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Ensure your voice
            can be heard clearly.
          </p>
        </div>
      </div>
    </div>
  );
}