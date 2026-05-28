import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';

interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
  colorTheme: 'blue' | 'purple' | 'rose' | 'emerald' | 'amber' | 'indigo';
  delay?: number;
  to?: string;
}

const themeStyles = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', hover: 'hover:border-blue-300' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', hover: 'hover:border-purple-300' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-600', hover: 'hover:border-rose-300' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', hover: 'hover:border-emerald-300' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', hover: 'hover:border-amber-300' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', hover: 'hover:border-indigo-300' },
};

export default function ServiceCard({ icon, title, description, colorTheme, delay = 0, to = "/offers" }: ServiceCardProps) {
  const theme = themeStyles[colorTheme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.03, translateY: -5 }}
      className={`p-5 md:p-8 rounded-[2rem] ${theme.bg} border border-transparent ${theme.hover} transition-colors group cursor-pointer shadow-sm hover:shadow-md flex flex-col items-center text-center md:items-start md:text-left`}
    >
      <div className={cn(`size-12 md:size-16 rounded-2xl md:rounded-3xl bg-white flex items-center justify-center mb-4 md:mb-6 shadow-sm transition-transform group-hover:rotate-12`, theme.icon)}>
        <span className="material-symbols-outlined text-3xl md:text-4xl">
          {icon}
        </span>
      </div>
      <h3 className="text-lg md:text-xl font-black mb-2 text-slate-900 uppercase tracking-wide">{title}</h3>
      <p className="text-slate-500 text-xs md:text-sm mb-6 font-bold leading-relaxed">{description}</p>
      <Link className={`${theme.icon} font-black text-[10px] uppercase tracking-widest inline-flex items-center gap-1 group-hover:gap-2 transition-all mt-auto`} to={to}>
        Learn More <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </Link>
    </motion.div>
  );
}

