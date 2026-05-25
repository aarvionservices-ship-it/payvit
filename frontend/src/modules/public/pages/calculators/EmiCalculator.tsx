import { useState, useMemo, useEffect } from 'react';
import { CalculatorLayout } from '../../components/calculators/CalculatorLayout';
import { InputField } from '../../components/calculators/InputField';
import { ResultCard, InfoRow } from '../../components/calculators/ResultCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { SEO } from '../../../../components/shared/SEO';
import { formatCurrency } from '../../../../utils/formatters';

export default function EmiCalculator() {
  const [loanAmount, setLoanAmount] = useState<number>(1000000);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenure, setTenure] = useState<number>(5);
  const [isYearly, setIsYearly] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('calc_emi');
    if (saved) {
      try {
        const { l, i, t, y } = JSON.parse(saved);
        setLoanAmount(l); setInterestRate(i); setTenure(t); setIsYearly(y);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('calc_emi', JSON.stringify({
      l: loanAmount, i: interestRate, t: tenure, y: isYearly
    }));
  }, [loanAmount, interestRate, tenure, isYearly]);

  const results = useMemo(() => {
    const p = loanAmount;
    const r = interestRate / 12 / 100;
    const n = isYearly ? tenure * 12 : tenure;
    
    if (r === 0) {
      const emi = p / n;
      return {
        emi: isFinite(emi) ? emi : 0,
        totalInterest: 0,
        totalPayment: p
      };
    }

    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - p;

    return {
      emi: isFinite(emi) ? Math.round(emi) : 0,
      totalInterest: isFinite(totalInterest) ? Math.round(totalInterest) : 0,
      totalPayment: isFinite(totalPayment) ? Math.round(totalPayment) : 0
    };
  }, [loanAmount, interestRate, tenure, isYearly]);

  const chartData = [
    { name: 'Principal', value: loanAmount, color: '#3b82f6' }, // primary
    { name: 'Interest', value: results.totalInterest, color: '#f59e0b' } // amber
  ];

  const handleReset = () => {
    setLoanAmount(1000000);
    setInterestRate(8.5);
    setTenure(5);
    setIsYearly(true);
  };

  return (
    <>
      <SEO 
        title="EMI Calculator"
        description="Calculate your monthly EMI, total interest, and total payment for any loan. Plan your finances with our accurate EMI calculator."
      />
      <CalculatorLayout 
        title="EMI Calculator" 
        description="Plan your loan accurately. Find out your monthly payments, interest cost, and total payable amount instantly."
        onReset={handleReset}
      >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl shadow-primary/5 border border-slate-100 dark:border-slate-800">
          <InputField 
            label="Loan Amount"
            value={loanAmount} min={100000} max={50000000} step={50000}
            symbol="₹" symbolPosition="left"
            onChange={setLoanAmount}
          />
          <InputField 
            label="Interest Rate (p.a)"
            value={interestRate} min={5} max={30} step={0.1}
            symbol="%" symbolPosition="right"
            onChange={setInterestRate}
          />
          
          <div className="flex items-center justify-between mb-2 mt-8">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Loan Tenure</span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setIsYearly(true)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${isYearly ? 'bg-white dark:bg-slate-600 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Years
              </button>
              <button 
                onClick={() => setIsYearly(false)}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!isYearly ? 'bg-white dark:bg-slate-600 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Months
              </button>
            </div>
          </div>
          
          <InputField 
            label=""
            value={tenure} min={1} max={isYearly ? 30 : 360} step={1}
            symbol={isYearly ? "Yrs" : "Mo"} symbolPosition="right"
            onChange={setTenure}
          />
        </div>

        <div className="lg:col-span-5 relative">
          <ResultCard title="Calculation Summary">
            <div className="h-48 mb-8 relative flex items-center justify-center">
               {isMounted && (
                 <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                    <Pie
                      data={chartData}
                      cx="50%" cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
               )}
              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Monthly EMI</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(results.emi)}</span>
              </div>
            </div>

            <InfoRow label="Principal Amount" value={formatCurrency(loanAmount)} />
            <InfoRow label="Total Interest" value={formatCurrency(results.totalInterest)} />
            <InfoRow label="Total Value" value={formatCurrency(results.totalPayment)} isTotal />
            
            <button className="w-full mt-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2">
              Apply for Loan
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </ResultCard>
        </div>
      </div>
    </CalculatorLayout>
    </>
  );
}

