export interface CardFees {
  joiningFee?: number | string;
  annualFee?: number | string;
  reloadFee?: string;
  joiningFeeNote?: string;
}

export interface CardEligibility {
  age?: string;
  minIncomeMonthly?: number;
  creditScore?: number;
  note?: string;
  businessType?: string;
  companyType?: string;
  minBusinessTurnoverYearly?: number;
  documentsRequired?: string[];
  fdRequired?: boolean;
  minFD?: number;
}

export interface CardScore {
  travel: number;
  shopping: number;
  fuel: number;
  lifestyle: number;
  dining: number;
  premium: number;
  forex: number;
  business: number;
  beginner: number;
  secured: number;
}

export interface CardModel {
  _id: string;
  cardName: string;
  bank: string;
  type: "credit" | "debit" | "prepaid";
  category: string[];
  network: string[];
  fees: CardFees;
  eligibility: CardEligibility;
  features: string[];
  tags: string[];
  score: CardScore;
  bestFor: string[];
  description: string;
  imageUrl?: string;
  gradient?: string;
}

export interface LoanModel {
  _id: string;
  loanName: string;
  provider: string;
  bankName: string;
  loanType: string;
  category: string;
  interestRate: {
    min: number;
    max: number;
    type: string;
    notes?: string;
  };
  loanAmount: {
    min: number;
    max: number;
    recommendedRange?: string;
  };
  tenure: {
    minMonths: number;
    maxMonths: number;
    flexibility?: string;
  };
  feesAndCharges: {
    processingFee: {
      percentage: number;
      maxAmount: number;
      notes?: string;
    };
    foreclosureCharges?: {
      percentage: number;
      allowedAfterMonths: number;
    };
    partPaymentCharges?: {
      percentage: number;
      allowedAfterMonths: number;
      conditions?: string;
    };
    latePaymentFee: {
      percentage: number;
      type: string;
      description?: string;
    };
    bounceCharges: number;
  };
  eligibility: {
    employmentType: string[];
    age: {
      min: number;
      max: number;
    };
    minimumIncomeMonthly: {
      salaried: number;
      selfEmployed?: number;
      pensioners?: number;
    };
    creditScore: {
      minimum: number;
      preferred: number;
    };
    workExperience?: {
      totalYears: number;
      currentJobMonths: number;
    };
    residency?: string;
    cityRequirement?: string;
  };
  documentsRequired: {
    identityProof: string[];
    addressProof: string[];
    incomeProof: {
      salaried: string[];
      selfEmployed?: string[];
      pensioners?: string[];
    };
    photographs?: string;
  };
  features: string[];
  repayment: {
    emiCalculation: string;
    modes: string[];
    partPaymentAllowed: boolean;
    foreclosureAllowed: boolean;
  };
  disbursal: {
    time: string;
    mode: string;
  };
  specialOffers?: string[];
  pros: string[];
  cons: string[];
  contact: {
    website: string;
    customerCare: string;
  };
  imageUrl?: string;
  gradient?: string;
  lastUpdated?: string;
}

