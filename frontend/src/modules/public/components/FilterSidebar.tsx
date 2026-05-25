import { motion } from 'motion/react';
import { formatCompactNumber } from '../../../utils/formatters';

interface FilterSidebarProps {
  amount: number;
  setAmount: (val: number) => void;
  rateType: 'Fixed' | 'Variable';
  setRateType: (val: 'Fixed' | 'Variable') => void;
  selectedBanks: string[];
  setSelectedBanks: (banks: string[]) => void;
  activeCategory: 'Loans' | 'Cards';
  subCategory: string;
  setSubCategory: (val: string) => void;
  onReset: () => void;
}

export default function FilterSidebar({
  amount,
  setAmount,
  rateType,
  setRateType,
  selectedBanks,
  setSelectedBanks,
  activeCategory,
  subCategory,
  setSubCategory,
  onReset
}: FilterSidebarProps) {
  const toggleBank = (bank: string) => {
    if (selectedBanks.includes(bank)) {
      setSelectedBanks(selectedBanks.filter(b => b !== bank));
    } else {
      setSelectedBanks([...selectedBanks, bank]);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(Number(e.target.value));
  };

  return (
    <div className="w-full lg:w-72 shrink-0 space-y-4">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl font-bold">tune</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Refine</h3>
          </div>
          <button 
            onClick={onReset} 
            className="text-[9px] font-bold text-slate-400 hover:text-primary uppercase tracking-widest transition-colors"
          >
            Reset
          </button>
        </div>
        
        {/* Sub-category Filter (Loan Type or Card Category) */}
        <div className="mb-8">
          <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
            {activeCategory === 'Loans' ? 'Loan Type' : 'Card Category'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              'all',
              ...(activeCategory === 'Loans' 
                ? ['Personal Loan', 'Business Loan', 'Home Loan', 'Car Loan', 'Education Loan', 'Gold Loan'] 
                : ['Shopping', 'Travel', 'Fuel', 'Lifestyle', 'Dining', 'Forex', 'Business'])
            ].map((cat) => (
              <button
                key={cat}
                onClick={() => setSubCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  subCategory === cat 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loan-specific Filters */}
        {activeCategory === 'Loans' && (
          <>
            {/* Loan Amount */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Amount</h4>
                <div className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                  ₹ {formatCompactNumber(amount)}
                </div>
              </div>
              <div className="relative group px-1">
                <input 
                  type="range"
                  min="50000"
                  max="10000000"
                  step="50000"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary transition-all"
                />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-2 px-1 uppercase tracking-widest">
                <span>{formatCompactNumber(50000)}</span>
                <span>{formatCompactNumber(10000000)}</span>
              </div>
            </div>

            {/* Interest Rate Type */}
            <div className="mb-8">
              <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Structure</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'Fixed', icon: 'lock_open', label: 'Fixed' },
                  { id: 'Variable', icon: 'show_chart', label: 'Floating' }
                ].map((type) => (
                  <button 
                    key={type.id}
                    onClick={() => setRateType(type.id as any)}
                    className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition-all duration-300 ${rateType === type.id ? 'border-primary bg-primary/5 text-primary' : 'border-slate-50 dark:border-slate-800 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'}`}
                  >
                    <span className={`material-symbols-outlined text-lg ${rateType === type.id ? 'fill-1' : ''}`}>{type.icon}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Preferred Banks */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Provider</h4>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-100">
            {['Axis Bank', 'SBI', 'HDFC Bank', 'ICICI Bank', 'Bajaj Finance', 'Kotak Mahindra', 'IDFC FIRST', 'IndusInd', 'Bank of Baroda', 'PNB'].map((bank) => (
              <button 
                key={bank} 
                onClick={() => toggleBank(bank)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${selectedBanks.includes(bank) ? 'border-primary/30 bg-primary/5 text-primary' : 'border-slate-50 dark:border-slate-800 text-slate-500 hover:bg-slate-50'}`}
              >
                <span className="text-[10px] font-bold tracking-tight">{bank}</span>
                <div className={`size-3.5 rounded-full border flex items-center justify-center transition-colors ${selectedBanks.includes(bank) ? 'border-primary bg-primary' : 'border-slate-200 dark:border-slate-700'}`}>
                  {selectedBanks.includes(bank) && <span className="material-symbols-outlined text-white text-[8px] font-black">check</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Expert Advice Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900 rounded-[1.5rem] p-6 text-white relative overflow-hidden shadow-xl"
      >
        <div className="relative z-10">
          <h4 className="font-bold text-base mb-2 leading-tight uppercase tracking-tight">Need Expert Advice?</h4>
          <p className="text-[10px] text-white/60 mb-4 leading-relaxed font-medium">Narrow down the perfect choice for your profile.</p>
          <a href="tel:1800123456" className="w-full py-2.5 bg-white text-slate-900 text-[10px] font-bold rounded-lg hover:bg-blue-50 transition-colors uppercase tracking-widest inline-block text-center whitespace-nowrap">
            Talk to Consultant
          </a>
        </div>
        <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-7xl text-white/5 pointer-events-none">
          support_agent
        </span>
      </motion.div>
    </div>
  );
}

