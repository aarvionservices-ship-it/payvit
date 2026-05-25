import { CalculatorCard } from '../../components/calculators/CalculatorCard';
import { SEO } from '../../../../components/shared/SEO';

const calculators = [
  {
    id: 'emi',
    title: 'EMI Calculator',
    description: 'Calculate your monthly EMI, total interest, and total payment for any loan.',
    icon: 'account_balance',
    path: '/calculators/emi',
    color: 'bg-emerald-500'
  },
  {
    id: 'credit-card',
    title: 'Credit Card Interest',
    description: 'Understand how long it takes to pay off your balance and total interest paid.',
    icon: 'credit_card',
    path: '/calculators/credit-card',
    color: 'bg-rose-500'
  },
  {
    id: 'sip',
    title: 'SIP Calculator',
    description: 'Estimate mutual fund returns over time via monthly compounding.',
    icon: 'trending_up',
    path: '/calculators/sip',
    color: 'bg-[#0055ff]'
  },
  {
    id: 'loan-eligibility',
    title: 'Loan Eligibility',
    description: 'Check how much loan you qualify for based on your income and existing EMIs.',
    icon: 'verified_user',
    path: '/calculators/loan-eligibility',
    color: 'bg-amber-500'
  }
];

export default function CalculatorsPage() {
  return (
    <div className="min-h-screen bg-[#f5f6f8] dark:bg-background-dark font-display pt-6 pb-32">
      <SEO 
        title="Financial Calculators & Tools"
        description="Plan your financial future with our smart EMI, SIP, and Loan Eligibility calculators. Make informed decisions about loans and investments with PayVit."
      />
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full mb-6">
             <span className="material-symbols-outlined text-sm">calculate</span>
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Financial Tools</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6">
            Smart <span className="text-primary">Calculators</span>
          </h1>
          <p className="text-lg md:text-xl font-medium text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Plan your financial future with our suite of powerful, easy-to-use calculators. Make informed decisions about loans, investments, and credit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {calculators.map((calc, idx) => (
            <CalculatorCard 
              key={calc.id}
              id={calc.id}
              title={calc.title}
              description={calc.description}
              icon={calc.icon}
              path={calc.path}
              color={calc.color}
              index={idx}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

