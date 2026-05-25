import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface CalculatorLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  onReset?: () => void;
}

export function CalculatorLayout({ title, description, children, onReset }: CalculatorLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5f6f8] dark:bg-background-dark font-display pt-6 pb-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <Link to="/calculators" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm mb-12">
          <ArrowLeft className="size-4" />
          Back to Calculators
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
              {title}
            </h1>
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
          
          {onReset && (
            <button 
              onClick={onReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw className="size-4" />
              Reset Values
            </button>
          )}
        </div>
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

