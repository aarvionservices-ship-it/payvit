import type { ElementType } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";

interface CategoryCardProps {
  key?: string | number;
  id: string;
  name: string;
  icon: ElementType | string;
  color: string;
  imageUrl: string;
  quote: string;
  index: number;
}

export function CategoryCard({ id, name, icon, color, imageUrl, quote, index }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link to={`/cards/${id}`} className="block group">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-slate-100 dark:border-slate-800 flex flex-col h-[350px]">
          {/* Image Section */}
          <div className="w-full h-[180px] relative overflow-hidden shrink-0">
            <img
              src={imageUrl}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

            <div className="absolute bottom-4 left-4 flex flex-col gap-1">
              <div className={cn("size-10 rounded-xl backdrop-blur-md bg-white/20 flex items-center justify-center text-white shadow-xl border border-white/30", color.replace('text-', 'bg-').replace('500', '500/40'))}>
                {typeof icon === 'string' ? (
                  <span className="material-symbols-outlined text-xl">{icon}</span>
                ) : (
                  <span className="material-symbols-outlined text-xl">credit_card</span>
                )}
              </div>
              <h3 className="text-xl font-black text-white tracking-tight drop-shadow-2xl">{name}</h3>
            </div>
          </div>

          {/* Content Section */}
          <div className="w-full flex-1 p-5 pb-6 flex flex-col relative bg-white dark:bg-slate-900">
            <div className="absolute top-4 right-6 text-slate-100 dark:text-slate-800/50 pointer-events-none">
              <span className="material-symbols-outlined text-5xl opacity-10 font-thin rotate-12">format_quote</span>
            </div>

            <div className="relative z-10 mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium italic leading-relaxed line-clamp-3">
                "{quote}"
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-between gap-2 pt-4 border-t border-slate-50 dark:border-slate-800 mt-auto">
              <div className="flex items-center gap-1.5 text-primary font-black text-[10px] uppercase tracking-widest">
                Explore {name}
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">trending_flat</span>
              </div>
              <div className="size-8 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover:border-primary group-hover:text-primary transition-all">
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

