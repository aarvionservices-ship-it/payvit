import { useState } from "react";

import KYCLayout from "./components/KYCLayout";

import AadhaarVerificationForm from "./forms/AadhaarVerificationForm";
import PANVerificationForm from "./forms/PanVerificationForm";
import BankDetailsForm from "./forms/BankDetailsForm";
import ConsentForm from "./forms/ConsentForm";

const CreateWalletPage = () => {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = () => {
    console.log("Wallet Created Successfully");
    // navigate("/dashboard");
  };

  const renderCurrentForm = () => {
    switch (step) {
      case 1:
        return (
          <AadhaarVerificationForm onNext={handleNext} onBack={handleBack} />
        );

      case 2:
        return <PANVerificationForm onNext={handleNext} onBack={handleBack} />;

      case 3:
        return <BankDetailsForm onNext={handleNext} onBack={handleBack} />;

      case 4:
        return <ConsentForm onBack={handleBack} onComplete={handleComplete} />;

      default:
        return null;
    }
  };

  return (
    <KYCLayout currentStep={step} totalSteps={4}>
      {renderCurrentForm()}
    </KYCLayout>
  );
};

export default CreateWalletPage;
