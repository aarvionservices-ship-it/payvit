import {
  AlertCircle,
  CheckCircle2,
  CircleHelp,
  FileText,
  Loader2,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  Video,
} from "lucide-react";

import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import toast from "react-hot-toast";

import {
  getVideoKycSessionRequest,
  sendVideoKycMessageRequest,
  startVideoKycRequest,
  uploadVideoKycImageRequest,
  uploadVideoKycRecordingRequest,
  type VideoKycData,
  type VideoKycQuestion,
} from "../../../api/videoKyc.api";

import CameraCapture from "../components/videoKyc/CameraCapture";

import PanCapture from "../components/videoKyc/PanCapture";

import VideoRecorder from "../components/videoKyc/VideoRecorder";

type KycScreen =
  | "welcome"
  | "pan"
  | "liveness"
  | "video"
  | "questions"
  | "completed"
  | "failed";

const SESSION_KEY =
  "payvit_video_kyc_session";

export default function VideoKycPage() {
  const [
    sessionId,
    setSessionId,
  ] = useState<string | null>(
    null
  );

  const [
    stage,
    setStage,
  ] = useState("");

  const [
    screen,
    setScreen,
  ] = useState<KycScreen>(
    "welcome"
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    restoring,
    setRestoring,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    questions,
    setQuestions,
  ] =
    useState<VideoKycQuestion[]>(
      []
    );

  const [
    questionsAnswered,
    setQuestionsAnswered,
  ] = useState(0);

  const [
    questionAnswer,
    setQuestionAnswer,
  ] = useState("");

  const [
    extractedData,
    setExtractedData,
  ] = useState<any>(null);

  /**
   * Convert backend stage
   * to frontend screen.
   *
   * There is NO OTP screen.
   */
  const getScreenFromData = (
    data: VideoKycData
  ): KycScreen => {
    const backendStage = (
      data.stage || ""
    ).toUpperCase();

    const backendStatus = (
      data.status || ""
    ).toLowerCase();

    if (
      backendStatus ===
        "failed" ||
      backendStatus ===
        "expired" ||
      backendStage ===
        "FAILED"
    ) {
      return "failed";
    }

    switch (backendStage) {
      case "WELCOME":
        return "welcome";

      case "PAN_CAPTURE":
        return "pan";

      case "LIVENESS_CHECK":
        return "liveness";

      case "VIDEO_RECORDING":
        return "video";

      case "QUESTIONS":
        return "questions";

      case "COMPLETE":
        return "completed";

      default:
        break;
    }

    if (data.done) {
      return "completed";
    }

    return "welcome";
  };

  /**
   * Update frontend state from
   * backend response.
   */
  const applyKycData = (
    data: VideoKycData
  ) => {
    if (data.sessionId) {
      setSessionId(
        data.sessionId
      );

      sessionStorage.setItem(
        SESSION_KEY,
        data.sessionId
      );
    }

    if (data.stage) {
      setStage(
        data.stage
      );
    }

    if (
      Array.isArray(
        data.questions
      )
    ) {
      setQuestions(
        data.questions
      );
    }

    if (
      typeof data.questionsAnswered ===
      "number"
    ) {
      setQuestionsAnswered(
        data.questionsAnswered
      );
    }

    if (
      data.extractedData
    ) {
      setExtractedData(
        data.extractedData
      );
    }

    const nextScreen =
      getScreenFromData(data);

    setScreen(
      nextScreen
    );

    if (
      nextScreen ===
      "completed"
    ) {
      sessionStorage.removeItem(
        SESSION_KEY
      );
    }
  };

  /**
   * Load latest Video KYC
   * session.
   */
  const refreshSession =
    async (
      id: string
    ): Promise<VideoKycData | null> => {
      const response =
        await getVideoKycSessionRequest(
          id
        );

      if (
        response.success &&
        response.data
      ) {
        applyKycData(
          response.data
        );

        return response.data;
      }

      return null;
    };

  /**
   * Restore KYC after browser
   * refresh.
   */
  useEffect(() => {
    const restoreSession =
      async () => {
        const savedId =
          sessionStorage.getItem(
            SESSION_KEY
          );

        if (!savedId) {
          setRestoring(
            false
          );

          return;
        }

        try {
          setSessionId(
            savedId
          );

          const data =
            await refreshSession(
              savedId
            );

          /**
           * If the page was refreshed
           * at WELCOME stage, advance it.
           */
          if (
            data?.stage ===
            "WELCOME"
          ) {
            const readyResponse =
              await sendVideoKycMessageRequest(
                savedId,
                "ready"
              );

            if (
              readyResponse.success
            ) {
              applyKycData({
                ...readyResponse.data,

                sessionId:
                  savedId,
              });
            }
          }
        } catch (err) {
          console.error(
            "Unable to restore Video KYC:",
            err
          );

          sessionStorage.removeItem(
            SESSION_KEY
          );

          setSessionId(
            null
          );

          setStage("");

          setScreen(
            "welcome"
          );
        } finally {
          setRestoring(
            false
          );
        }
      };

    restoreSession();
  }, []);

  /**
   * Start Video KYC.
   */
  const startKyc =
    async () => {
      try {
        setLoading(true);

        setError("");

        const response =
          await startVideoKycRequest();

        if (
          !response.success ||
          !response.data
            ?.sessionId
        ) {
          throw new Error(
            response.message ||
              "Unable to start Video KYC."
          );
        }

        const id =
          response.data
            .sessionId;

        setSessionId(
          id
        );

        sessionStorage.setItem(
          SESSION_KEY,
          id
        );

        /**
         * Existing backend starts
         * at WELCOME.
         *
         * We silently send "ready"
         * to move to PAN_CAPTURE.
         */
        const readyResponse =
          await sendVideoKycMessageRequest(
            id,
            "ready"
          );

        if (
          !readyResponse.success
        ) {
          throw new Error(
            readyResponse.message ||
              "Unable to continue Video KYC."
          );
        }

        applyKycData({
          ...readyResponse.data,

          sessionId:
            id,
        });

        toast.success(
          "Video KYC started"
        );
      } catch (err: any) {
        handleError(
          err,
          "Unable to start Video KYC."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /**
   * PAN upload.
   */
  const handlePanUpload =
    async (data: {
      image: string;

      mimeType: string;

      preview?: string;
    }) => {
      if (!sessionId) {
        toast.error(
          "KYC session not found"
        );

        return;
      }

      try {
        setLoading(
          true
        );

        setError("");

        const response =
          await uploadVideoKycImageRequest(
            {
              sessionId,

              image:
                data.image,

              mimeType:
                data.mimeType,

              task:
                "pan_ocr",
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "PAN verification failed."
          );
        }

        applyKycData(
          response.data
        );

        if (
          response.data
            .stage ===
          "LIVENESS_CHECK"
        ) {
          toast.success(
            "PAN verified successfully"
          );
        } else {
          toast.error(
            response.data
              .agentMessage ||
              "Unable to verify PAN."
          );
        }
      } catch (err: any) {
        handleError(
          err,
          "PAN verification failed."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /**
   * Liveness selfie.
   */
  const handleFaceCapture =
    async (data: {
      image: string;

      mimeType: string;

      preview?: string;
    }) => {
      if (!sessionId) {
        toast.error(
          "KYC session not found"
        );

        return;
      }

      try {
        setLoading(
          true
        );

        setError("");

        const response =
          await uploadVideoKycImageRequest(
            {
              sessionId,

              image:
                data.image,

              mimeType:
                data.mimeType,

              task:
                "liveness",
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Liveness verification failed."
          );
        }

        applyKycData(
          response.data
        );

        if (
          response.data
            .stage ===
          "VIDEO_RECORDING"
        ) {
          toast.success(
            "Liveness verified successfully"
          );
        } else {
          toast.error(
            response.data
              .agentMessage ||
              "Liveness verification failed."
          );
        }
      } catch (err: any) {
        handleError(
          err,
          "Liveness verification failed."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /**
   * Upload recorded video.
   */
  const handleVideoUpload =
    async (data: {
      video: string;

      mimeType: string;

      durationSeconds: number;
    }) => {
      if (!sessionId) {
        toast.error(
          "KYC session not found"
        );

        return;
      }

      try {
        setLoading(
          true
        );

        setError("");

        const response =
          await uploadVideoKycRecordingRequest(
            {
              sessionId,

              video:
                data.video,

              mimeType:
                data.mimeType,

              durationSeconds:
                data.durationSeconds,
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Video verification failed."
          );
        }

        applyKycData(
          response.data
        );

        /**
         * Video endpoint advances
         * to QUESTIONS.
         *
         * Load session to get actual
         * question list.
         */
        if (
          response.data
            .stage ===
          "QUESTIONS"
        ) {
          await refreshSession(
            sessionId
          );

          toast.success(
            "Video verified successfully"
          );

          return;
        }

        if (
          response.data
            .stage ===
          "VIDEO_RECORDING"
        ) {
          toast.error(
            response.data
              .agentMessage ||
              "Please record the video again."
          );
        }
      } catch (err: any) {
        handleError(
          err,
          "Video verification failed."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /**
   * Submit security answer.
   *
   * IMPORTANT:
   *
   * Backend should return:
   *
   * Question 1:
   * stage = QUESTIONS
   *
   * Final question:
   * stage = COMPLETE
   *
   * It should NOT return OTP_SENT.
   */
  const submitSecurityAnswer =
    async () => {
      if (!sessionId) {
        toast.error(
          "KYC session not found"
        );

        return;
      }

      const answer =
        questionAnswer.trim();

      if (!answer) {
        toast.error(
          "Please enter your answer"
        );

        return;
      }

      try {
        setLoading(
          true
        );

        setError("");

        const response =
          await sendVideoKycMessageRequest(
            sessionId,
            answer
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Unable to verify answer."
          );
        }

        setQuestionAnswer(
          ""
        );

        applyKycData(
          response.data
        );

        /**
         * Wrong answer.
         */
        if (
          response.data
            .stage
            ?.toLowerCase() ===
          "failed"
        ) {
          setScreen(
            "failed"
          );

          sessionStorage.removeItem(
            SESSION_KEY
          );

          toast.error(
            "Security verification failed"
          );

          return;
        }

        /**
         * Another question remains.
         */
        if (
          response.data
            .stage ===
          "QUESTIONS"
        ) {
          await refreshSession(
            sessionId
          );

          toast.success(
            "Answer verified"
          );

          return;
        }

        /**
         * KYC finished.
         */
        if (
          response.data
            .stage ===
            "COMPLETE" ||
          response.data.done ===
            true
        ) {
          setStage(
            "COMPLETE"
          );

          setScreen(
            "completed"
          );

          sessionStorage.removeItem(
            SESSION_KEY
          );

          toast.success(
            "Video KYC completed successfully"
          );

          return;
        }

        /**
         * Protection against old backend.
         *
         * The frontend will NEVER show an
         * OTP screen.
         */
        if (
          response.data
            .stage ===
          "OTP_SENT"
        ) {
          throw new Error(
            "The backend is still configured to send OTP. Video KYC must return COMPLETE after the final security question."
          );
        }
      } catch (err: any) {
        handleError(
          err,
          "Security verification failed."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /**
   * Reset current frontend state.
   */
  const restartKyc =
    () => {
      sessionStorage.removeItem(
        SESSION_KEY
      );

      setSessionId(
        null
      );

      setStage("");

      setScreen(
        "welcome"
      );

      setQuestions(
        []
      );

      setQuestionsAnswered(
        0
      );

      setQuestionAnswer(
        ""
      );

      setExtractedData(
        null
      );

      setError("");
    };

  /**
   * Common API error handler.
   */
  const handleError = (
    err: any,
    fallback: string
  ) => {
    console.error(
      err
    );

    const message =
      err?.response?.data
        ?.message ||
      err?.message ||
      fallback;

    setError(
      message
    );

    toast.error(
      message
    );
  };

  /**
   * Current question according
   * to backend counter.
   */
  const currentQuestion =
    useMemo(() => {
      return questions[
        questionsAnswered
      ];
    }, [
      questions,
      questionsAnswered,
    ]);

  /**
   * Restore loader.
   */
  if (restoring) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-9 animate-spin text-blue-600" />

        <p className="text-sm text-slate-500 font-medium">
          Restoring secure KYC session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">

        {/* ==============================
            HEADER
        ============================== */}

        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

            <div className="flex items-center gap-4">

              <div className="size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <ShieldCheck className="size-6" />
              </div>

              <div>

                <h1 className="text-2xl font-bold text-slate-900">
                  e-Video KYC
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  Secure digital identity verification
                </p>

              </div>

            </div>

            {sessionId && (
              <div className="flex gap-2 flex-wrap">

                {stage && (
                  <span className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold uppercase">
                    {stage.replaceAll(
                      "_",
                      " "
                    )}
                  </span>
                )}

                <span className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1">

                  <LockKeyhole className="size-3" />

                  Secure Session

                </span>

              </div>
            )}

          </div>

        </section>

        {/* ==============================
            PROGRESS
        ============================== */}

        {sessionId &&
          screen !== "completed" &&
          screen !== "failed" && (
            <ProgressSteps
              stage={stage}
            />
          )}

        {/* ==============================
            ERROR
        ============================== */}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">

            <AlertCircle className="size-5 text-red-600 shrink-0" />

            <div>

              <p className="font-bold text-sm text-red-700">
                Verification error
              </p>

              <p className="text-xs text-red-600 mt-1">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* ==============================
            WELCOME
        ============================== */}

        {screen ===
          "welcome" && (
          <WelcomeScreen
            loading={loading}
            startKyc={startKyc}
          />
        )}

        {/* ==============================
            PAN
        ============================== */}

        {screen ===
          "pan" && (
          <VerificationCard
            title="PAN Card Verification"
            description="Upload a clear image of your PAN card."
          >
            <PanCapture
              loading={
                loading
              }
              onUpload={
                handlePanUpload
              }
            />
          </VerificationCard>
        )}

        {/* ==============================
            LIVENESS
        ============================== */}

        {screen ===
          "liveness" && (
          <VerificationCard
            title="Face & Liveness Verification"
            description="Take a live selfie to confirm your presence."
          >
            <CameraCapture
              loading={
                loading
              }
              onCapture={
                handleFaceCapture
              }
            />
          </VerificationCard>
        )}

        {/* ==============================
            VIDEO
        ============================== */}

        {screen ===
          "video" && (
          <VerificationCard
            title="Live Video Verification"
            description="Record your identity verification video for at least 20 seconds."
          >
            <VideoRecorder
              loading={
                loading
              }
              onSubmit={
                handleVideoUpload
              }
            />
          </VerificationCard>
        )}

        {/* ==============================
            SECURITY QUESTIONS
        ============================== */}

        {screen ===
          "questions" && (
          <VerificationCard
            title="Security Questions"
            description="Answer the questions below to confirm your identity."
          >
            <SecurityQuestionSection
              question={
                currentQuestion
              }
              current={
                questionsAnswered
              }
              total={
                questions.length
              }
              answer={
                questionAnswer
              }
              setAnswer={
                setQuestionAnswer
              }
              loading={
                loading
              }
              submit={
                submitSecurityAnswer
              }
            />
          </VerificationCard>
        )}

        {/* ==============================
            VERIFIED DATA
        ============================== */}

        {extractedData &&
          screen !==
            "completed" && (
            <section className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">

              <div className="flex items-center gap-2">

                <CheckCircle2 className="size-4 text-emerald-600" />

                <p className="text-xs font-bold text-emerald-700 uppercase">
                  Verification data processed
                </p>

              </div>

            </section>
          )}

        {/* ==============================
            COMPLETED
        ============================== */}

        {screen ===
          "completed" && (
          <CompletedScreen
            restartKyc={
              restartKyc
            }
          />
        )}

        {/* ==============================
            FAILED
        ============================== */}

        {screen ===
          "failed" && (
          <FailedScreen
            restartKyc={
              restartKyc
            }
          />
        )}

      </main>

    </div>
  );
}


/* =========================================================
   WELCOME SCREEN
========================================================= */

function WelcomeScreen({
  loading,
  startKyc,
}: {
  loading: boolean;

  startKyc: () => void;
}) {
  const steps = [
    {
      icon:
        FileText,

      title:
        "PAN Card",

      description:
        "Upload PAN card for verification",
    },

    {
      icon:
        ShieldCheck,

      title:
        "Liveness",

      description:
        "Take a live selfie",
    },

    {
      icon:
        Video,

      title:
        "Video",

      description:
        "Record a 20-second video",
    },

    {
      icon:
        CircleHelp,

      title:
        "Security",

      description:
        "Answer security questions",
    },
  ];

  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 md:p-12">

      <div className="text-center">

        <div className="size-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">

          <ShieldCheck className="size-10" />

        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-6">
          Complete your e-Video KYC
        </h2>

        <p className="text-sm text-slate-500 max-w-xl mx-auto mt-3">
          Complete identity verification using your PAN card,
          live face, video recording and security questions.
        </p>

      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">

        {steps.map(
          (
            item,
            index
          ) => {
            const Icon =
              item.icon;

            return (
              <div
                key={
                  item.title
                }
                className="border border-slate-200 rounded-xl p-4 text-center"
              >

                <div className="size-10 bg-blue-50 text-blue-600 rounded-xl mx-auto flex items-center justify-center">

                  <Icon className="size-5" />

                </div>

                <p className="text-sm font-bold text-slate-800 mt-3">

                  {index + 1}.{" "}
                  {item.title}

                </p>

                <p className="text-xs text-slate-500 mt-1">

                  {
                    item.description
                  }

                </p>

              </div>
            );
          }
        )}

      </div>

      <div className="text-center">

        <button
          type="button"
          onClick={
            startKyc
          }
          disabled={
            loading
          }
          className="mt-8 px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
        >

          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}

          {loading
            ? "Starting..."
            : "Start Video KYC"}

        </button>

      </div>

    </section>
  );
}


/* =========================================================
   VERIFICATION CARD
========================================================= */

function VerificationCard({
  title,
  description,
  children,
}: {
  title: string;

  description: string;

  children: ReactNode;
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

      <div className="p-5 md:p-6 border-b border-slate-100">

        <h2 className="text-xl font-bold text-slate-900">
          {title}
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          {description}
        </p>

      </div>

      <div className="p-5 md:p-8">
        {children}
      </div>

    </section>
  );
}


/* =========================================================
   SECURITY QUESTIONS
========================================================= */

function SecurityQuestionSection({
  question,
  current,
  total,
  answer,
  setAnswer,
  loading,
  submit,
}: {
  question:
    | VideoKycQuestion
    | undefined;

  current: number;

  total: number;

  answer: string;

  setAnswer: (
    value: string
  ) => void;

  loading: boolean;

  submit: () => void;
}) {
  if (!question) {
    return (
      <div className="py-12 text-center">

        <Loader2 className="size-7 animate-spin mx-auto text-blue-600" />

        <p className="text-sm text-slate-500 mt-3">
          Loading security question...
        </p>

      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-4">

      <div className="size-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">

        <CircleHelp className="size-8" />

      </div>

      <div className="text-center mt-5">

        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">

          Question{" "}
          {current + 1}
          {" "}of{" "}
          {total}

        </p>

        <h3 className="text-xl font-bold text-slate-900 mt-3">

          {
            question.question
          }

        </h3>

      </div>

      <input
        type="text"
        value={
          answer
        }
        onChange={(
          event
        ) =>
          setAnswer(
            event.target.value
          )
        }
        onKeyDown={(
          event
        ) => {
          if (
            event.key ===
              "Enter" &&
            !loading &&
            answer.trim()
          ) {
            submit();
          }
        }}
        disabled={
          loading
        }
        autoComplete="off"
        placeholder="Enter your answer"
        className="mt-7 w-full px-4 py-4 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60"
      />

      <button
        type="button"
        onClick={
          submit
        }
        disabled={
          loading ||
          !answer.trim()
        }
        className="mt-4 w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >

        {loading && (
          <Loader2 className="size-4 animate-spin" />
        )}

        Verify Answer

      </button>

      <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4">

        <p className="text-xs font-semibold text-amber-800">
          Security check
        </p>

        <p className="text-xs text-amber-700 mt-1">

          Please provide the information registered with your
          account. Incorrect answers may terminate this KYC session.

        </p>

      </div>

    </div>
  );
}


/* =========================================================
   COMPLETED
========================================================= */

function CompletedScreen({
  restartKyc,
}: {
  restartKyc: () => void;
}) {
  return (
    <section className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-10 text-center">

      <div className="size-20 bg-emerald-50 rounded-full text-emerald-600 flex items-center justify-center mx-auto">

        <CheckCircle2 className="size-10" />

      </div>

      <h2 className="text-2xl font-bold text-slate-900 mt-6">
        Video KYC Completed
      </h2>

      <p className="text-sm text-slate-500 mt-3">

        Your identity verification has been completed successfully.

      </p>

      <div className="mt-5 inline-flex bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-xs font-bold uppercase">

        Verified

      </div>

      <button
        type="button"
        onClick={
          restartKyc
        }
        className="mt-7 mx-auto px-5 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase flex items-center gap-2 hover:bg-slate-50"
      >

        <RefreshCcw className="size-4" />

        Start Again

      </button>

    </section>
  );
}


/* =========================================================
   FAILED
========================================================= */

function FailedScreen({
  restartKyc,
}: {
  restartKyc: () => void;
}) {
  return (
    <section className="max-w-xl mx-auto bg-white border border-red-100 rounded-2xl shadow-sm p-10 text-center">

      <div className="size-20 bg-red-50 rounded-full text-red-600 flex items-center justify-center mx-auto">

        <AlertCircle className="size-10" />

      </div>

      <h2 className="text-2xl font-bold text-slate-900 mt-6">
        Verification Failed
      </h2>

      <p className="text-sm text-slate-500 mt-3">

        This Video KYC session could not be completed.
        Please start a new verification session.

      </p>

      <button
        type="button"
        onClick={
          restartKyc
        }
        className="mt-7 mx-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700"
      >

        <RefreshCcw className="size-4" />

        Start New KYC

      </button>

    </section>
  );
}


/* =========================================================
   PROGRESS
========================================================= */

function ProgressSteps({
  stage,
}: {
  stage: string;
}) {
  const stages = [
    {
      backend:
        "PAN_CAPTURE",

      label:
        "PAN",
    },

    {
      backend:
        "LIVENESS_CHECK",

      label:
        "Face",
    },

    {
      backend:
        "VIDEO_RECORDING",

      label:
        "Video",
    },

    {
      backend:
        "QUESTIONS",

      label:
        "Security",
    },
  ];

  const currentIndex =
    stages.findIndex(
      (item) =>
        item.backend ===
        stage
    );

  return (
    <section className="bg-white border border-slate-200 rounded-2xl px-4 py-5 overflow-x-auto">

      <div className="min-w-[420px] flex items-center">

        {stages.map(
          (
            item,
            index
          ) => {
            const completed =
              index <
              currentIndex;

            const current =
              index ===
              currentIndex;

            return (
              <div
                key={
                  item.backend
                }
                className="flex items-center flex-1 last:flex-none"
              >

                <div className="flex flex-col items-center">

                  <div
                    className={`size-9 rounded-full flex items-center justify-center text-xs font-bold ${
                      completed
                        ? "bg-emerald-600 text-white"
                        : current
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >

                    {completed ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      index + 1
                    )}

                  </div>

                  <span
                    className={`text-[11px] font-semibold mt-2 ${
                      current
                        ? "text-blue-600"
                        : completed
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                  >

                    {
                      item.label
                    }

                  </span>

                </div>

                {index <
                  stages.length -
                    1 && (
                  <div
                    className={`h-0.5 flex-1 mx-3 ${
                      index <
                      currentIndex
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    }`}
                  />
                )}

              </div>
            );
          }
        )}

      </div>

    </section>
  );
}