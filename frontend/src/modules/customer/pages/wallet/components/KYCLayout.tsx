import { ArrowLeft, CircleHelp } from "lucide-react";
import KYCStepper from "./KYCStepper";

const KYCLayout = ({
  children,
  currentStep,
  totalSteps,
}: {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
}) => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button className="text-blue-600">
            <ArrowLeft size={22} />
          </button>

          <h1 className="text-sm font-semibold text-blue-600">Onboarding</h1>

          <button className="text-blue-600">
            <CircleHelp size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <KYCStepper currentStep={currentStep} totalSteps={totalSteps} />

        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
};

export default KYCLayout;
