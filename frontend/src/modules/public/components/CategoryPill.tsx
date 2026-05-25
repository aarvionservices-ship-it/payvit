import { motion } from 'motion/react';

interface CategoryPillProps {
  icon: string;
  label: string;
  isActive?: boolean;
  colorTheme?: 'blue' | 'purple' | 'orange' | 'emerald' | 'rose';
  onClick?: () => void;
}

const themeStyles = {
  blue: 'text-blue-600 dark:text-blue-400',
  purple: 'text-purple-600 dark:text-purple-400',
  orange: 'text-orange-500 dark:text-orange-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  rose: 'text-rose-600 dark:text-rose-400',
};

export default function CategoryPill({ icon, label, isActive, colorTheme = 'blue', onClick }: CategoryPillProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm border whitespace-nowrap ${
        isActive 
          ? 'bg-slate-900 dark:bg-primary text-white border-slate-900 dark:border-primary shadow-2xl shadow-primary/40 scale-105' 
          : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-primary/40 hover:text-primary transition-all'
      }`}
    >
      <span className={`material-symbols-outlined text-lg ${isActive ? 'text-white fill-1' : themeStyles[colorTheme]}`}>
        {icon}
      </span>
      {label}
    </motion.button>
  );
}

