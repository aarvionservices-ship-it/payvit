import { useState, useMemo, useEffect } from 'react';
import { CalculatorLayout } from '../../components/calculators/CalculatorLayout';
import { InputField } from '../../components/calculators/InputField';
import { ResultCard, InfoRow } from '../../components/calculators/ResultCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { SEO } from '../../../../components/shared/SEO';
import { formatCurrency, formatCompactNumber } from '../../../../utils/formatters';

export default function SipCalculator() {
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(5000);
  const [expectedReturn, setExpectedReturn] = useState<number>(12);
  const [timePeriod, setTimePeriod] = useState<number>(10);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('calc_sip');
    if (saved) {
      try {
        const { m, r, t } = JSON.parse(saved);
        setMonthlyInvestment(m); setExpectedReturn(r); setTimePeriod(t);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('calc_sip', JSON.stringify({
      m: monthlyInvestment, r: expectedReturn, t: timePeriod
    }));
  }, [monthlyInvestment, expectedReturn, timePeriod]);

  const results = useMemo(() => {
    const P = monthlyInvestment;
    const n = timePeriod * 12;
    const i = expectedReturn / 12 / 100;

    let M = 0;
    if (i === 0) {
      M = P * n;
    } else {
      M = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    }

    const investedAmount = P * n;
    const estimatedReturns = M - investedAmount;

    return {
      investedAmount: Math.round(investedAmount),
      estimatedReturns: Math.round(estimatedReturns),
      totalValue: Math.round(M)
    };
  }, [monthlyInvestment, expectedReturn, timePeriod]);

  const chartData = [
    { name: 'Invested Amount', value: results.investedAmount, color: '#94a3b8' }, // slate
    { name: 'Est. Returns', value: results.estimatedReturns, color: '#10b981' } // emerald
  ];

  const handleReset = () => {
    setMonthlyInvestment(5000);
    setExpectedReturn(12);
    setTimePeriod(10);
  };

  return (
    <>
      <SEO 
        title="SIP Calculator - Mutual Fund Returns"
        description="Estimate your mutual fund returns based on your monthly investment and expected growth rate. Discover the power of compounding with our SIP calculator."
      />
      <CalculatorLayout 
        title="SIP Calculator" 
        description="Estimate your mutual fund returns based on your monthly investment and expected growth rate. Discover the power of compounding."
        onReset={handleReset}
      >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl shadow-primary/5 border border-slate-100 dark:border-slate-800">
          <InputField 
            label="Monthly Investment"
            value={monthlyInvestment} min={500} max={1000000} step={500}
            symbol="₹" symbolPosition="left"
            onChange={setMonthlyInvestment}
          />
          <InputField 
            label="Expected Return rate (p.a)"
            value={expectedReturn} min={1} max={30} step={0.5}
            symbol="%" symbolPosition="right"
            onChange={setExpectedReturn}
          />
          <InputField 
            label="Time Period"
            value={timePeriod} min={1} max={40} step={1}
            symbol="Yr" symbolPosition="right"
            onChange={setTimePeriod}
          />
        </div>

        <div className="lg:col-span-5 relative">
          <ResultCard title="Investment Summary">
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
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Value</span>
                <span className="text-xl font-black text-emerald-500">{formatCompactNumber(results.totalValue)}</span>
              </div>
            </div>

            <InfoRow label="Invested Amount" value={formatCurrency(results.investedAmount)} />
            <InfoRow label="Estimated Returns" value={formatCurrency(results.estimatedReturns)} />
            <InfoRow label="Total Value" value={formatCurrency(results.totalValue)} isTotal />
            
            <button className="w-full mt-8 py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2">
              Start Investing Now
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </ResultCard>
        </div>
      </div>
    </CalculatorLayout>
    </>
  );
}

