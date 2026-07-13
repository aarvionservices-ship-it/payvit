import { useState } from "react";
import { Shield, FileText, Lock, ExternalLink } from "lucide-react";

const ConsentForm = ({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) => {
  const [agreements, setAgreements] = useState({
    terms: false,
    kyc: false,
    tax: false,
  });

  const allChecked = agreements.terms && agreements.kyc && agreements.tax;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Final Agreements</h1>

        <p className="mt-3 text-slate-600">
          Please review the legal documents below and confirm your details to
          finish setting up your account.
        </p>
      </div>

      {/* Terms Card */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <FileText size={18} className="text-blue-600" />

          <h3 className="font-semibold uppercase text-slate-800">
            Terms & Conditions
          </h3>
        </div>

        <p className="mb-2 text-sm text-slate-600">
          By accessing or using our financial services, you agree to be bound by
          these Terms and Conditions.
        </p>

        <p className="mb-2 text-sm text-slate-600">
          1. Account Security: You are responsible for maintaining the
          confidentiality of your credentials.
        </p>

        <p className="mb-3 text-sm text-slate-600">
          2. Fees: Standard transaction fees may apply according to current
          schedules.
        </p>

        <button className="flex items-center gap-2 text-sm font-medium text-blue-600">
          Read full document
          <ExternalLink size={14} />
        </button>
      </div>

      {/* Privacy Card */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Shield size={18} className="text-blue-600" />

          <h3 className="font-semibold uppercase text-slate-800">
            Privacy Policy
          </h3>
        </div>

        <p className="mb-2 text-sm text-slate-600">
          We take your privacy seriously. This policy explains how we collect
          and protect personal information.
        </p>

        <p className="mb-2 text-sm text-slate-600">
          1. Data Collection: KYC information may be collected for compliance
          purposes.
        </p>

        <p className="mb-3 text-sm text-slate-600">
          2. Data Sharing: Information is shared only when required for
          verification and regulatory compliance.
        </p>

        <button className="flex items-center gap-2 text-sm font-medium text-blue-600">
          Read full document
          <ExternalLink size={14} />
        </button>
      </div>

      {/* Checkboxes */}
      <div className="mb-8 space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={agreements.terms}
            onChange={(e) =>
              setAgreements((prev) => ({
                ...prev,
                terms: e.target.checked,
              }))
            }
          />

          <span>I agree to the Terms & Conditions and Privacy Policy.</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={agreements.kyc}
            onChange={(e) =>
              setAgreements((prev) => ({
                ...prev,
                kyc: e.target.checked,
              }))
            }
          />

          <span>
            I consent to KYC verification via secure government portals.
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={agreements.tax}
            onChange={(e) =>
              setAgreements((prev) => ({
                ...prev,
                tax: e.target.checked,
              }))
            }
          />

          <span>
            I confirm that I'm a tax resident of India and no other country.
          </span>
        </label>
      </div>

      {/* Submit */}
      <button
        disabled={!allChecked}
        onClick={onComplete}
        className={`
          w-full rounded-2xl py-4 text-lg font-semibold
          ${
            allChecked
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "cursor-not-allowed bg-slate-200 text-slate-500"
          }
        `}
      >
        Accept & Complete
      </button>

      {/* Security */}
      <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Lock size={14} />
        <span>256-bit Secure Encryption</span>
      </div>

      {/* Back */}
      <div className="mt-8">
        <button
          onClick={onBack}
          className="rounded-xl border border-slate-300 px-6 py-3"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default ConsentForm;
