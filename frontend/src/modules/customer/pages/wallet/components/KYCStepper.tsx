const KYCStepper = ({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-10 w-full">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">
          Step {currentStep} of {totalSteps}
        </p>

        <p className="text-sm font-semibold text-blue-600">
          {Math.round(progress)}% Complete
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-in-out"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
};

export default KYCStepper;
