import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import type { CardModel, CardScore } from "../../types";
import { getFeatureColor } from "../../lib/iconMap";
import { useCompareStore } from "../../store/compare.store";
import { toast } from "react-hot-toast";

interface CreditCardItemProps {
  card: CardModel;
  index: number;
  categoryId: string;
}

export function CreditCardItem({ card, index, categoryId }: CreditCardItemProps) {
  const currentScore = card.score[categoryId as keyof CardScore] || 0;
  const { addCard, removeCard, isComparingCard } = useCompareStore();
  const isCompared = isComparingCard(card._id);

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompared) {
      removeCard(card._id);
      toast.success("Removed from comparison");
    } else {
      if (addCard(card._id)) {
        toast.success("Added to comparison (up to 5)");
      } else {
        toast.error("You can compare up to 5 cards at a time");
      }
    }
  };

  return (
    <Link to={`/card/${card._id}`} className="block w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ y: -8 }}
        className="relative bg-[#fdf2f8]/30 md:bg-white dark:bg-slate-900 rounded-[2rem] p-3 flex flex-col h-full min-h-[400px] md:min-h-[450px] shadow-lg md:shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-slate-100 dark:border-slate-800 overflow-hidden group"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-rose-400" />

        {/* Card Visual Header */}
        <div className="relative h-36 md:h-44 rounded-[1.5rem] overflow-hidden mb-3 md:mb-4">
          {card.imageUrl ? (
            <img 
              src={card.imageUrl} 
              alt={card.cardName} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-1000 group-hover:scale-110", card.gradient || "from-slate-700 to-slate-900")} />
          )}
          {/* Glassmorphism Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/20" />
          <div className="absolute inset-0 backdrop-blur-[1px]" />
          
          <div className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 flex justify-between items-start z-20">
            <span className="px-2 py-0.5 md:px-3 md:py-1 bg-white/20 backdrop-blur-md rounded-full text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
              {card.bank}
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
              {card.cardName}
            </h3>
            <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1">
              <span className="text-white/70 text-[8px] md:text-[10px] uppercase font-bold tracking-widest">{card.network[0]}</span>
              <div className="size-1 bg-white/40 rounded-full" />
              <span className="text-white/70 text-[8px] md:text-[10px] uppercase font-bold tracking-widest">{card.type}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-1 md:px-2 flex-1 flex flex-col">
          {/* Key Stats Row */}
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Annual Fee</span>
              <span className="text-base md:text-lg font-black text-slate-900 dark:text-white">
                {card.fees.annualFee === 0 || card.fees.annualFee === "0" ? "Free" : `₹${card.fees.annualFee}`}
              </span>
            </div>
            <div className="flex items-center gap-1 md:gap-1.5 bg-primary/5 text-primary px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-primary/10">
              <span className="material-symbols-outlined text-xs md:text-sm font-bold">star</span>
              <span className="font-black text-xs md:text-sm">{currentScore.toFixed(1)}</span>
            </div>
          </div>

          {/* Features */}
          <div className="flex-1 space-y-1.5 md:space-y-2">
            {card.features.slice(0, 2).map((feature: string, i: number) => (
              <div key={i} className="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
                <div className={cn("size-6 md:size-8 rounded-lg flex items-center justify-center shrink-0 border", getFeatureColor(feature))}>
                   <span className="material-symbols-outlined text-sm md:text-lg font-medium">
                      {feature.toLowerCase().includes('lounge') ? 'flight' : 
                       feature.toLowerCase().includes('cashback') ? 'payments' : 
                       feature.toLowerCase().includes('reward') ? 'military_tech' : 
                       feature.toLowerCase().includes('fuel') ? 'local_gas_station' : 'auto_awesome'}
                   </span>
                </div>
                <span className="text-slate-600 dark:text-slate-400 text-[10px] md:text-xs font-bold leading-tight line-clamp-1">{feature}</span>
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-2 md:gap-3">
             <button 
               onClick={toggleCompare}
               className={cn(
                 "flex-1 px-3 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border",
                 isCompared 
                   ? "bg-rose-500 text-white border-rose-400" 
                   : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
               )}
             >
               <span className="material-symbols-outlined text-sm md:text-lg">
                 {isCompared ? 'check_circle' : 'compare_arrows'}
               </span>
               {isCompared ? 'In List' : 'Compare'}
             </button>
             <div className="px-4 py-2.5 bg-slate-900 text-white font-black text-[9px] md:text-[10px] uppercase tracking-widest rounded-xl flex items-center gap-1 hover:bg-primary transition-colors">
               Details
               <span className="material-symbols-outlined text-sm">arrow_forward</span>
             </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

