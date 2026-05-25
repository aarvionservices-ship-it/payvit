import type { ReactNode } from 'react';

interface InfoRowProps {
  label: string;
  value: string;
  isTotal?: boolean;
}

export function ResultCard({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-primary/5 border border-slate-100 dark:border-slate-800 flex flex-col justify-center sticky top-24">
      {title && <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">{title}</h3>}
      {children}
    </div>
  );
}

export function InfoRow({ label, value, isTotal = false }: InfoRowProps) {
  return (
    <div className={`flex justify-between items-center py-4 ${isTotal ? 'border-t border-slate-200 dark:border-slate-800 mt-4 pt-6' : 'border-b border-slate-100 dark:border-slate-800/50'}`}>
      <span className={`text-sm ${isTotal ? 'font-black text-slate-800 dark:text-slate-100' : 'font-medium text-slate-500'}`}>{label}</span>
      <span className={`text-right ${isTotal ? 'text-2xl font-black text-primary' : 'text-lg font-bold text-slate-800 dark:text-slate-200'}`}>
        {value}
      </span>
    </div>
  );
}

