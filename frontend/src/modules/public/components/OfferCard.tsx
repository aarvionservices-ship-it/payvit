import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

interface OfferCardProps {
  badgeText: string;
  badgeColor: string;
  headerBg: string;
  tagText?: string;
  title: string;
  subtitle: string;
  interestRate: string;
  feeLabel: string;
  feeValue: string;
  delay?: number;
}

export default function OfferCard({
  badgeText,
  badgeColor,
  headerBg,
  tagText,
  title,
  subtitle,
  interestRate,
  feeLabel,
  feeValue,
  delay = 0
}: OfferCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -10 }}
      className="bg-white rounded-[2.5rem] p-1 border border-slate-100 shadow-sm hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
    >
      <div className={`${headerBg} p-6 md:p-8 rounded-t-[2.2rem] flex justify-between items-center transition-colors`}>
        <div className={`size-10 md:size-12 bg-white rounded-xl flex items-center justify-center font-black ${badgeColor} text-lg md:text-xl shadow-sm italic`}>
          {badgeText}
        </div>
        {tagText && (
          <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[9px] md:text-xs font-black uppercase tracking-widest">
            {tagText}
          </span>
        )}
      </div>
      <div className="p-6 md:p-8">
        <h4 className="text-lg md:text-xl font-black mb-1 text-slate-900 uppercase italic leading-none">{title}</h4>
        <p className="text-slate-400 text-[10px] mb-6 uppercase tracking-widest font-black opacity-60">{subtitle}</p>
        <div className="grid grid-cols-2 gap-4 mb-6 md:mb-8 border-y border-slate-50 py-4">
          <div>
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Interest Protocol</p>
            <p className="text-base md:text-lg font-black text-primary tracking-tighter">{interestRate}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">{feeLabel}</p>
            <p className="text-base md:text-lg font-black text-slate-900 tracking-tighter">{feeValue}</p>
          </div>
        </div>
        <Link
          to="/login"
          className="block w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all text-center shadow-xl shadow-slate-900/10"
        >
          Secure Offer
        </Link>
      </div>
    </motion.div>
  );
}

