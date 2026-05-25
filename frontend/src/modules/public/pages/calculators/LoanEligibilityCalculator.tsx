import { useState, useMemo, useEffect } from 'react';
import { CalculatorLayout } from '../../components/calculators/CalculatorLayout';
import { InputField } from '../../components/calculators/InputField';
import { ResultCard, InfoRow } from '../../components/calculators/ResultCard';
import { SEO } from '../../../../components/shared/SEO';
import { formatCurrency } from '../../../../utils/formatters';

export default function LoanEligibilityCalculator() {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(100000);
  const [existingEMI, setExistingEMI] = useState<number>(15000);
  const [interestRate, setInterestRate] = useState<number>(10.5);
  const [tenure, setTenure] = useState<number>(5);

  useEffect(() => {
    const saved = localStorage.getItem('calc_eligibility');
    if (saved) {
      try {
        const { m, e, i, t } = JSON.parse(saved);
        setMonthlyIncome(m); setExistingEMI(e); setInterestRate(i); setTenure(t);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('calc_eligibility', JSON.stringify({
      m: monthlyIncome, e: existingEMI, i: interestRate, t: tenure
    }));
  }, [monthlyIncome, existingEMI, interestRate, tenure]);

  const results = useMemo(() => {
    // Basic standard logic: Max EMI allowed is 50% of monthly income minus existing EMIs
    const maxEmiAllowed = Math.max((monthlyIncome * 0.5) - existingEMI, 0);
    
    // Reverse EMI calculation to find Principal (Loan Amount)
    // EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
    // => P = EMI * [(1+R)^N-1] / [R * (1+R)^N]

    const r = interestRate / 12 / 100;
    const n = tenure * 12;

    let eligibleAmount = 0;
    if (r > 0 && maxEmiAllowed > 0 && n > 0) {
      eligibleAmount = maxEmiAllowed * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
    } else if (r === 0 && maxEmiAllowed > 0) {
      eligibleAmount = maxEmiAllowed * n;
    }

    // Rough max limits based on income just for some reality check
    const maxPossibleLoan = monthlyIncome * 60; // Max 60 times monthly income
    eligibleAmount = Math.min(eligibleAmount, maxPossibleLoan);

    return {
      eligibleAmount: Math.round(eligibleAmount),
      maxEmiAllowed: Math.round(maxEmiAllowed)
    };
  }, [monthlyIncome, existingEMI, interestRate, tenure]);

  const handleReset = () => {
    setMonthlyIncome(100000);
    setExistingEMI(15000);
    setInterestRate(10.5);
    setTenure(5);
  };

  return (
    <>
      <SEO 
        title="Loan Eligibility Calculator"
        description="Check how much loan you can qualify for based on your net monthly income and existing financial commitments. Get instant loan eligibility report with PayVit."
      />
      <CalculatorLayout 
        title="Loan Eligibility Calculator" 
        description="Check how much loan you can qualify for based on your net monthly income and existing financial commitments."
        onReset={handleReset}
      >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl shadow-primary/5 border border-slate-100 dark:border-slate-800">
          <InputField 
            label="Net Monthly Income"
            value={monthlyIncome} min={20000} max={1000000} step={5000}
            symbol="₹" symbolPosition="left"
            onChange={setMonthlyIncome}
          />
          <InputField 
            label="Existing Monthly EMIs"
            value={existingEMI} min={0} max={monthlyIncome} step={1000}
            symbol="₹" symbolPosition="left"
            onChange={setExistingEMI}
          />
          <InputField 
            label="Expected Interest Rate (p.a)"
            value={interestRate} min={5} max={25} step={0.1}
            symbol="%" symbolPosition="right"
            onChange={setInterestRate}
          />
          <InputField 
            label="Loan Tenure"
            value={tenure} min={1} max={30} step={1}
            symbol="Yr" symbolPosition="right"
            onChange={setTenure}
          />
        </div>

        <div className="lg:col-span-5 relative">
          <ResultCard title="Eligibility Summary">
            <div className="p-8 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl mb-8 flex flex-col items-center justify-center text-center">
               <span className="text-xs font-black uppercase tracking-widest text-amber-600/70 dark:text-amber-400">Max Eligible Loan</span>
               {results.eligibleAmount > 0 ? (
                 <span className="text-4xl font-black text-amber-600 dark:text-amber-500 mt-2">
                   {formatCurrency(results.eligibleAmount)}
                 </span>
               ) : (
                 <span className="text-xl font-bold text-amber-600 dark:text-amber-500 mt-2">
                   Not Eligible
                 </span>
               )}
            </div>

            <InfoRow label="Net Monthly Income" value={formatCurrency(monthlyIncome)} />
            <InfoRow label="Existing EMIs" value={formatCurrency(existingEMI)} />
            <InfoRow label="Max Affordable EMI" value={formatCurrency(results.maxEmiAllowed)} isTotal />
            
            {results.eligibleAmount === 0 && existingEMI > 0 && (
               <div className="mt-4 text-xs font-bold text-rose-500 text-center">
                 Your existing commitments exceed the maximum standard threshold (50% of income). 
                 Consider reducing existing debts before applying.
               </div>
            )}

            <button 
              disabled={results.eligibleAmount === 0}
              className={`w-full mt-8 py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${results.eligibleAmount > 0 ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 active:scale-95' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
            >
              Check Offers
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </ResultCard>
        </div>
      </div>
    </CalculatorLayout>
    </>
  );
}

