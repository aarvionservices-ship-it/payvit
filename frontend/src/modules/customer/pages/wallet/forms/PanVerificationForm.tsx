import { Shield, Lock } from "lucide-react";

const PanVerificationForm = ({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) => {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">
          Verify your Identity
        </h1>

        <p className="mt-3 text-lg text-slate-600">
          We need your PAN details to securely verify your financial profile.
        </p>
      </div>

      {/* PAN Card Preview */}
      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="flex h-40 flex-col justify-between">
          <div className="flex items-start justify-between">
            <Shield size={20} />

            <div className="text-right">
              <p className="text-xs uppercase opacity-80">
                Permanent Account Number
              </p>

              <h3 className="text-xl font-bold tracking-wider">INDIA CARD</h3>
            </div>
          </div>

          <div>
            <div className="mb-3 h-10 w-10 rounded-full bg-white/20" />

            <div className="h-3 w-32 rounded bg-white/30" />
            <div className="mt-2 h-2 w-20 rounded bg-white/20" />
          </div>
        </div>
      </div>

      {/* PAN Input */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Enter 10-digit PAN Number
        </label>

        <input
          type="text"
          placeholder="ABCDE1234F"
          maxLength={10}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-lg outline-none transition focus:border-blue-500"
        />
      </div>

      {/* Security Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <Lock size={16} className="text-blue-600" />

          <span className="text-sm text-slate-700">256-bit SSL Encrypted</span>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <Shield size={16} className="text-blue-600" />

          <span className="text-sm text-slate-700">RBI Regulated Partner</span>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex items-center justify-between">
        <button
          className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700"
          onClick={onBack}
        >
          Back
        </button>

        <button
          onClick={onNext}
          className="w-70 rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
        >
          Continue →
        </button>
      </div>
    </div>
  );
};

export default PanVerificationForm;
