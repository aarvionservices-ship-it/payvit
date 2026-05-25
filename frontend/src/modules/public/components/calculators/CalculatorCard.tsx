import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import type { ElementType } from 'react';

interface CalculatorCardProps {
  id: string;
  title: string;
  description: string;
  icon: ElementType | string;
  path: string;
  color: string;
  index: number;
}

export function CalculatorCard({ title, description, icon, path, color, index }: CalculatorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Link to={path} className="block h-full">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col items-start gap-4">
          <div className={`size-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${color}`}>
            {typeof icon === 'string' ? (
              <span className="material-symbols-outlined text-3xl">{icon}</span>
            ) : (
              <span className="material-symbols-outlined text-3xl">calculate</span>
            )}
          </div>
          
          <div className="flex-1 w-full">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">{description}</p>
          </div>

          <div className="mt-auto flex items-center gap-2 text-sm font-bold text-primary opacity-80 group-hover:opacity-100 transition-opacity">
            Use Calculator 
            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

