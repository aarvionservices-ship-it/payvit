import { useState } from "react";
import { Search, ShieldCheck, Check, Lock } from "lucide-react";

const banks = ["Chase", "HSBC", "Amex", "Citi", "Wells Fargo", "Others"];

const BankDetailsForm = ({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) => {
  const [selectedBank, setSelectedBank] = useState("HSBC");

  const [accountNumber, setAccountNumber] = useState("");

  const [ifscCode, setIfscCode] = useState("");

  return (
    <div className="mx-auto max-w-4xl">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Link your Bank</h1>

        <p className="mt-3 text-slate-600">
          Securely connect your primary account for seamless transactions and
          instant verification.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          placeholder="Search your bank"
          className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-12 pr-4 outline-none focus:border-blue-500"
        />
      </div>

      {/* Banks */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {banks.map((bank) => (
          <button
            key={bank}
            onClick={() => setSelectedBank(bank)}
            className={`rounded-2xl border p-5 transition ${
              selectedBank === bank
                ? "border-blue-600 bg-blue-50"
                : "border-slate-200 bg-white hover:border-blue-300"
            }`}
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <ShieldCheck size={20} className="text-slate-400" />
            </div>

            <p className="text-sm font-medium">{bank}</p>
          </button>
        ))}
      </div>

      {/* Account Number */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Account Number
        </label>

        <input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="4422 1190 2234"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* IFSC */}
      <div className="mb-8">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          IFSC Code
        </label>

        <input
          type="text"
          value={ifscCode}
          onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
          placeholder="HSBC0000001"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Verification Card */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
            <Check size={18} />
          </div>

          <div>
            <h4 className="font-semibold text-slate-900">Account Verified</h4>

            <p className="mt-1 text-sm text-slate-600">
              A micro-deposit verification was successfully completed to confirm
              ownership of this account.
            </p>
          </div>
        </div>

        <ShieldCheck size={40} className="text-blue-200" />
      </div>

      {/* Security Text */}
      <div className="mb-8 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Lock size={14} />
        <span>256-bit AES Encryption • SOC2 Compliant</span>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="rounded-xl border border-slate-300 px-6 py-3 font-medium"
        >
          Back
        </button>

        <button
          onClick={onNext}
          className="flex-1 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Link Bank Account
        </button>
      </div>
    </div>
  );
};

export default BankDetailsForm;
