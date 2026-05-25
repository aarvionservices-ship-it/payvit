import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import type { LoanModel } from "../../types";
import { useCompareStore } from "../../store/compare.store";
import { toast } from "react-hot-toast";

interface LoanItemProps {
  loan: LoanModel;
  index: number;
}

export function LoanItem({ loan, index }: LoanItemProps) {
  const { addLoan, removeLoan, isComparingLoan } = useCompareStore();
  const isCompared = isComparingLoan(loan._id);

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompared) {
      removeLoan(loan._id);
      toast.success("Removed from comparison");
    } else {
      if (addLoan(loan._id)) {
        toast.success("Added to comparison (up to 5)");
      } else {
        toast.error("You can compare up to 5 loans at a time");
      }
    }
  };

  return (
    <Link to={`/loan/${loan._id}`} className="block w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ y: -8 }}
        className="relative bg-[#f8fafc] md:bg-white dark:bg-slate-900 rounded-[2.5rem] p-3 md:p-4 flex flex-col h-full min-h-[440px] md:min-h-[500px] shadow-lg md:shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border-l-4 border-l-primary md:border-l border-slate-100 dark:border-slate-800 group"
      >
        {/* Loan Visual Header */}
        <div className="relative h-40 md:h-48 rounded-[1.8rem] md:rounded-[2rem] overflow-hidden mb-4 md:mb-6">
          {loan.imageUrl ? (
            <img 
              src={loan.imageUrl} 
              alt={loan.loanName} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-1000 group-hover:scale-110", loan.gradient || "from-slate-700 to-slate-900")} />
          )}
          {/* Glassmorphism Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/20" />
          <div className="absolute inset-0 backdrop-blur-[1px]" />
          
          <div className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 flex justify-between items-start z-20">
            <span className="px-2 py-0.5 md:px-3 md:py-1 bg-white/20 backdrop-blur-md rounded-full text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
              {loan.provider}
            </span>
            <div className="relative group/toggle">
              <button 
                onClick={toggleCompare}
                className={cn(
                  "size-7 md:size-8 rounded-lg flex items-center justify-center border transition-all duration-300",
                  isCompared 
                    ? "bg-emerald-500 text-white border-emerald-400 rotate-12 scale-110" 
                    : "bg-white/20 backdrop-blur-md text-white border-white/20 hover:bg-white hover:text-slate-900"
                )}
              >
                <span className="material-symbols-outlined text-base md:text-lg leading-none">
                  {isCompared ? 'check_circle' : 'compare_arrows'}
                </span>
              </button>
              {/* Tooltip Label */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded transition-all opacity-0 invisible group-hover/toggle:opacity-100 group-hover/toggle:visible whitespace-nowrap z-30">
                {isCompared ? 'In Matrix' : 'Add to Matrix'}
              </div>
            </div>
          </div>

          <div className="absolute bottom-3 left-4 right-4 md:bottom-4 md:left-6 md:right-6">
            <h3 className="text-white text-lg md:text-xl font-black tracking-tight drop-shadow-lg leading-tight">
              {loan.loanName}
            </h3>
            <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1">
              <span className="text-white/70 text-[8px] md:text-[10px] uppercase font-bold tracking-widest">{loan.loanType}</span>
              <div className="size-1 bg-white/40 rounded-full" />
              <span className="text-white/70 text-[8px] md:text-[10px] uppercase font-bold tracking-widest">{loan.interestRate.type.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-1 md:px-2 flex-1 flex flex-col">
          {/* Key Stats Row */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Rate</span>
              <span className="text-base md:text-lg font-black text-slate-900 dark:text-white">
                {loan.interestRate.min}%
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Amount</span>
              <div className="flex items-center gap-1 bg-primary/5 text-primary px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-primary/10">
                <span className="font-black text-xs md:text-sm">₹{(loan.loanAmount.max / 100000).toFixed(1)}L</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="flex-1 space-y-2 md:space-y-3">
            {loan.features.slice(0, 2).map((feature, i) => (
              <div key={i} className="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
                <div className="size-6 md:size-8 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100 bg-emerald-50 text-emerald-600">
                   <span className="material-symbols-outlined text-sm md:text-lg font-medium">
                      {feature.toLowerCase().includes('quick') || feature.toLowerCase().includes('fast') ? 'speed' : 
                       feature.toLowerCase().includes('documentation') ? 'description' : 
                       feature.toLowerCase().includes('collateral') ? 'shield' : 'check_circle'}
                   </span>
                </div>
                <span className="text-slate-600 dark:text-slate-400 text-[10px] md:text-xs font-bold leading-tight line-clamp-1">{feature}</span>
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-2">
            <button 
              onClick={toggleCompare}
              className={cn(
                "flex-1 px-3 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border",
                isCompared 
                  ? "bg-emerald-500 text-white border-emerald-400" 
                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              )}
            >
              <span className="material-symbols-outlined text-sm md:text-lg">
                {isCompared ? 'check_circle' : 'compare_arrows'}
              </span>
              {isCompared ? 'In List' : 'Compare'}
            </button>
            <div className="px-4 py-2 bg-slate-900 text-white font-black text-[9px] md:text-[10px] uppercase tracking-widest rounded-xl flex items-center gap-1 hover:bg-primary transition-colors">
              Apply
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

