import { ShieldCheck, Lock } from "lucide-react";

const AadhaarVerificationForm = ({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) => {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Title Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Aadhaar Verification
        </h1>

        <p className="mt-2 text-slate-600">
          Securely verify your identity using your Aadhaar number.
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Security Badge */}
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-green-700">
          <ShieldCheck size={18} />
          <span className="text-sm font-medium">
            Your information is encrypted and secure
          </span>
        </div>

        {/* Aadhaar Input */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Aadhaar Number
          </label>

          <input
            type="text"
            placeholder="XXXX XXXX XXXX"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
          />
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            OTP Verification
          </label>

          <div className="flex gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <input
                key={index}
                maxLength={1}
                className="h-12 w-12 rounded-xl border border-slate-300 text-center text-lg font-semibold outline-none focus:border-blue-500"
              />
            ))}
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Enter the OTP sent to your Aadhaar-linked mobile number.
          </p>
        </div>

        {/* Security Note */}
        <div className="mb-8 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
          <Lock size={18} className="mt-0.5 text-slate-500" />

          <p className="text-sm text-slate-600">
            We use industry-standard encryption to protect your personal
            information and comply with regulatory requirements.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700"
            onClick={onBack}
          >
            Back
          </button>

          <button
            className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            onClick={onNext}
          >
            Verify & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default AadhaarVerificationForm;
