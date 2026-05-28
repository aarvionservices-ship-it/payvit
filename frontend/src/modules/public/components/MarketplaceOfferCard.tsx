import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../../../store/auth.store';
import { useCompareStore } from '../../../store/compare.store';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';

interface MarketplaceOfferCardProps {
  id: string | number;
  bankName: string;
  bankColor: string;
  title: string;
  badgeText?: string;
  badgeColor?: string;
  description: string;
  stat1Label: string;
  stat1Value: string;
  stat2Label: string;
  stat2Value: string;
  stat3Label: string;
  stat3Value: string;
  isEditorChoice?: boolean;
  delay?: number;
  type: 'loan' | 'card';
}

export default function MarketplaceOfferCard({
  id,
  bankName,
  bankColor,
  title,
  badgeText,
  badgeColor,
  description,
  stat1Label,
  stat1Value,
  stat2Label,
  stat2Value,
  stat3Label,
  stat3Value,
  isEditorChoice,
  delay = 0,
  type
}: MarketplaceOfferCardProps) {
  const detailsPath = type === 'loan' ? `/loan/${id}` : `/card/${id}`;
  const { user } = useAuthStore();
  const { addLoan, removeLoan, isComparingLoan, addCard, removeCard, isComparingCard } = useCompareStore();
  
  const isCompared = type === 'loan' ? isComparingLoan(String(id)) : isComparingCard(String(id));

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const itemId = String(id);
    
    if (type === 'loan') {
      if (isCompared) {
        removeLoan(itemId);
        toast.success("Removed from comparison");
      } else if (addLoan(itemId)) {
        toast.success("Added to loan comparison");
      } else {
        toast.error("You can compare up to 5 items");
      }
    } else {
      if (isCompared) {
        removeCard(itemId);
        toast.success("Removed from comparison");
      } else if (addCard(itemId)) {
        toast.success("Added to card comparison");
      } else {
        toast.error("You can compare up to 5 items");
      }
    }
  };

  const applyPath = user 
    ? (type === 'loan' ? `/customer/apply/${id}` : `/card/${id}`) 
    : `/login?redirect=${type === 'loan' ? `/customer/apply/${id}` : `/card/${id}`}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "relative group bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-3xl p-4 md:p-7 flex flex-col gap-4 md:gap-6 shadow-sm hover:shadow-xl transition-all duration-300 border overflow-hidden",
        isEditorChoice ? 'border-primary/30 ring-1 ring-primary/5' : 'border-slate-100 dark:border-slate-800'
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1.5", bankColor)} />

      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={toggleCompare}
          className={cn(
            "size-8 md:size-10 rounded-xl flex items-center justify-center border transition-all duration-300 shadow-sm",
            isCompared 
              ? (type === 'loan' ? "bg-emerald-500 text-white border-emerald-400" : "bg-rose-500 text-white border-rose-400")
              : "bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-800 hover:text-primary hover:border-primary/20"
          )}
        >
          <span className="material-symbols-outlined text-base md:text-xl">
            {isCompared ? 'check_circle' : 'compare_arrows'}
          </span>
        </button>
      </div>

      {/* Top Section: Brand & Title */}
      <div className="flex items-start justify-between gap-3 md:gap-4 pr-10">
        <div className="flex items-center gap-3 md:gap-5 min-w-0">
          <div className={`shrink-0 size-10 md:size-14 rounded-xl flex items-center justify-center text-white font-black text-xl md:text-2xl tracking-tighter shadow-md ring-2 ring-white dark:ring-slate-800 text-center p-1 md:p-1.5 leading-tight overflow-hidden ${bankColor} `}>
            {bankName.charAt(0)}
          </div>
          <div className="min-w-0">
             {badgeText && (
               <div className="hidden md:block mb-2">
                 <span className={cn(`text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-[0.2em] shadow-sm`, badgeColor)}>
                   {badgeText}
                 </span>
               </div>
             )}
             <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white leading-tight tracking-wide break-words uppercase  mb-1">{title}</h3>
             <p className="text-[10px] md:text-sm text-slate-500 font-bold line-clamp-1 opacity-60">{description}</p>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end shrink-0">
           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bank</span>
           <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase italic">{bankName}</span>
        </div>
      </div>

      {/* Middle Section: Detailed Stats Grid (Fees & Prices) */}
      <div className="grid grid-cols-3 gap-2 md:gap-12 bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 md:p-5 border border-slate-100 dark:border-slate-800/50">
        <div className="min-w-0">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 md:mb-2 truncate">{stat1Label}</p>
          <p className="text-sm md:text-xl font-black text-primary truncate leading-none tracking-tighter">{stat1Value}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 md:mb-2 truncate">{stat2Label}</p>
          <p className="text-sm md:text-xl font-black text-slate-900 dark:text-white truncate leading-none tracking-tighter">{stat2Value}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 md:mb-2 truncate">{stat3Label}</p>
          <p className="text-[9px] md:text-sm font-black text-slate-700 dark:text-slate-300 line-clamp-1 leading-tight uppercase tracking-tight italic">
            {stat3Value}
          </p>
        </div>
      </div>

      {/* Bottom Section: Quick Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4 pt-1 md:pt-2">
        <div className="flex items-center gap-4 md:gap-6">
           <div className="flex items-center gap-1.5 md:gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-base md:text-lg fill-1">check_circle</span>
              <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Approval</span>
           </div>
           <div className="flex items-center gap-1.5 md:gap-2">
              <span className="material-symbols-outlined text-blue-500 text-base md:text-lg fill-1">verified_user</span>
              <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider">Safe & Secure</span>
           </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
          <Link 
            to={detailsPath} 
            className="flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[9px] md:text-[10px] font-black rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center uppercase tracking-widest"
          >
            View Details
          </Link>
          <Link
            to={applyPath}
            className="flex-1 sm:flex-none px-6 md:px-8 py-2.5 md:py-3 bg-slate-900 text-white text-[9px] md:text-[10px] font-black rounded-xl shadow-lg shadow-slate-900/10 hover:bg-primary transition-all text-center uppercase tracking-[0.2em] flex items-center justify-center gap-2"
          >
            Apply <span className="hidden md:inline">Now</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

