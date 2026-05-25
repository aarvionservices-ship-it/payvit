import { useState, useMemo, useEffect } from 'react';
import { CalculatorLayout } from '../../components/calculators/CalculatorLayout';
import { InputField } from '../../components/calculators/InputField';
import { ResultCard, InfoRow } from '../../components/calculators/ResultCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { SEO } from '../../../../components/shared/SEO';
import { formatCurrency, formatCompactNumber } from '../../../../utils/formatters';

export default function CreditCardCalculator() {
  const [outstandingAmount, setOutstandingAmount] = useState<number>(50000);
  const [monthlyInterestRate, setMonthlyInterestRate] = useState<number>(3.5);
  const [minimumPayment, setMinimumPayment] = useState<number>(5);
  const [isPaymentPercentage, setIsPaymentPercentage] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem('calc_cc');
    if (saved) {
      try {
        const { a, r, p, pP } = JSON.parse(saved);
        setOutstandingAmount(a); setMonthlyInterestRate(r); setMinimumPayment(p); setIsPaymentPercentage(pP);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('calc_cc', JSON.stringify({
      a: outstandingAmount, r: monthlyInterestRate, p: minimumPayment, pP: isPaymentPercentage
    }));
  }, [outstandingAmount, monthlyInterestRate, minimumPayment, isPaymentPercentage]);

  const results = useMemo(() => {
    let balance = outstandingAmount;
    let totalInterest = 0;
    let monthsToPayOff = 0;
    const chartData = [];

    // Safety checks
    if (balance <= 0) return { months: 0, totalInterest: 0, totalPayable: 0, chartData: [] };
    
    let paymentAmount = isPaymentPercentage ? (balance * minimumPayment / 100) : minimumPayment;
    
    // Check if payment covers interest
    const initialInterest = balance * (monthlyInterestRate / 100);
    if (paymentAmount <= initialInterest && balance > 0) {
      return { 
        months: Infinity, 
        totalInterest: Infinity, 
        totalPayable: Infinity,
        chartData: []
      };
    }

    while (balance > 0 && monthsToPayOff < 600) { // Limit to 50 years to avoid infinite loops
      const interest = balance * (monthlyInterestRate / 100);
      totalInterest += interest;
      balance += interest;
      
      const currentPayment = isPaymentPercentage ? Math.max(balance * minimumPayment / 100, 100) : minimumPayment; // min 100 payment assumption if percentage
      let payment = Math.min(balance, currentPayment);
      
      balance -= payment;
      monthsToPayOff++;

      if (monthsToPayOff % 6 === 0 || balance <= 0) {
        chartData.push({ month: monthsToPayOff, balance: Math.round(balance > 0 ? balance : 0) });
      }
    }

    return {
      months: monthsToPayOff,
      totalInterest: Math.round(totalInterest),
      totalPayable: Math.round(outstandingAmount + totalInterest),
      chartData
    };
  }, [outstandingAmount, monthlyInterestRate, minimumPayment, isPaymentPercentage]);

  const handleReset = () => {
    setOutstandingAmount(50000);
    setMonthlyInterestRate(3.5);
    setMinimumPayment(5);
    setIsPaymentPercentage(true);
  };

  return (
    <>
      <SEO 
        title="Credit Card Interest Calculator"
        description="Calculate the true cost of your credit card debt, see how long it takes to pay off, and discover how much you can save by paying more."
      />
      <CalculatorLayout 
        title="Credit Card Calculator" 
        description="Calculate the true cost of your credit card debt, see how long it takes to pay off, and discover how much you can save by paying more."
        onReset={handleReset}
      >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl shadow-primary/5 border border-slate-100 dark:border-slate-800">
          <InputField 
            label="Outstanding Balance"
            value={outstandingAmount} min={1000} max={1000000} step={1000}
            symbol="₹" symbolPosition="left"
            onChange={setOutstandingAmount}
          />
          <InputField 
            label="Monthly Interest Rate"
            value={monthlyInterestRate} min={0.5} max={5} step={0.1}
            symbol="%" symbolPosition="right"
            onChange={setMonthlyInterestRate}
          />
          
          <div className="flex items-center justify-between mb-2 mt-8">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Payment Strategy</span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setIsPaymentPercentage(true)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${isPaymentPercentage ? 'bg-white dark:bg-slate-600 shadow-sm text-rose-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Percentage (%)
              </button>
              <button 
                onClick={() => setIsPaymentPercentage(false)}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!isPaymentPercentage ? 'bg-white dark:bg-slate-600 shadow-sm text-rose-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Fixed Amt (₹)
              </button>
            </div>
          </div>
          
          <InputField 
            label=""
            value={minimumPayment} min={isPaymentPercentage ? 1 : 1000} max={isPaymentPercentage ? 100 : outstandingAmount} step={isPaymentPercentage ? 1 : 500}
            symbol={isPaymentPercentage ? "%" : "₹"} symbolPosition={isPaymentPercentage ? "right" : "left"}
            onChange={setMinimumPayment}
          />

          {results.months === Infinity && (
            <div className="mt-8 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-bold flex items-start gap-2">
              <span className="material-symbols-outlined shrink-0 text-base">warning</span>
              Your monthly payment does not cover the interest. You will never pay off this debt. Please increase your payment.
            </div>
          )}
        </div>

        <div className="lg:col-span-5 relative">
          <ResultCard title="Payoff Timeline">
            {results.months !== Infinity && results.chartData.length > 0 && (
              <div className="h-48 mb-6 relative">
                 <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={results.chartData}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(val) => formatCompactNumber(val)} />
                    <RechartsTooltip 
                      formatter={(val: any) => formatCurrency(val)} 
                      labelFormatter={(m) => `Month ${m}`}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                    />
                    <Area type="monotone" dataKey="balance" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <InfoRow label="Time to Pay Off" value={results.months === Infinity ? "Never" : `${Math.floor(results.months / 12)} Yrs ${results.months % 12} Mo`} />
            <InfoRow label="Total Interest Paid" value={results.totalInterest === Infinity ? "Infinite" : formatCurrency(results.totalInterest)} />
            <InfoRow label="Total Amount Payable" value={results.totalPayable === Infinity ? "Infinite" : formatCurrency(results.totalPayable)} isTotal />
            
            <button className="w-full mt-8 py-4 bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2">
              Explore Balance Transfer Cards
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </ResultCard>
        </div>
      </div>
    </CalculatorLayout>
    </>
  );
}

