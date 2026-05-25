import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { getLoanById } from "../api/loan.api";
import type { LoanModel } from "../types";
import { cn } from "../lib/utils";
import { useAuthStore } from "../store/auth.store";
import { SEO } from "../components/shared/SEO";

export default function LoanDetailsPage() {
  const navigate = useNavigate();
  const { loanId } = useParams<{ loanId: string }>();
  const [loan, setLoan] = useState<LoanModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  
  const applyPath = user 
    ? `/customer/apply/${loanId}` 
    : `/login?redirect=/customer/apply/${loanId}`;

  useEffect(() => {
    async function fetchLoan() {
      if (!loanId) return;
      try {
        setIsLoading(true);
        const response = await getLoanById(loanId);
        if (response.success) {
          setLoan(response.data);
        }
      } catch (error) {
        console.error("Error fetching loan details:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLoan();
    window.scrollTo(0, 0);
  }, [loanId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f6f8] gap-6">
        <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center animate-bounce">
          <span className="material-symbols-outlined text-4xl text-primary font-black">payments</span>
        </div>
        <div className="text-xl font-black uppercase tracking-[0.3em] text-slate-300 animate-pulse">Loading Loan Info...</div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8] px-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-sm border border-slate-100">
           <div className="size-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-red-500">error</span>
           </div>
           <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Loan Not Found</h2>
           <p className="text-slate-500 mb-8 leading-relaxed font-medium">We couldn't find the loan offer you're looking for. It might have been removed or the link is invalid.</p>
           <Link 
            to="/loans" 
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0055ff] text-white font-black rounded-2xl shadow-xl shadow-[#0055ff]/20 hover:bg-blue-600 transition-all group"
           >
              <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
              Explore All Loans
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-display pb-32">
      <SEO 
        title={`${loan.loanName} from ${loan.provider}`}
        description={`Get ${loan.loanName} with interest rates starting from ${loan.interestRate.min}%. ${loan.features[0] || 'Apply online for quick money and easy monthly payments.'}`}
      />
      
      {/* Header Section */}
      <section className="relative pt-8 md:pt-12 pb-24 md:pb-32 px-4 md:px-6 lg:px-20 overflow-hidden">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5 dark:opacity-20", loan.gradient || "from-blue-600 to-blue-900")} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors mb-6 md:mb-12"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Go Back
          </button>

          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 md:gap-12">
            <div className="max-w-3xl w-full">
              <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
                <div className={cn("size-14 md:size-20 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-2xl border border-white/20 backdrop-blur-md shrink-0", loan.gradient || "bg-primary")}>
                   <span className="material-symbols-outlined text-2xl md:text-4xl font-black">payments</span>
                </div>
                <div className="min-w-0">
                   <h2 className="text-[10px] md:text-sm font-black text-[#0055ff] uppercase tracking-[0.2em] md:tracking-[0.3em] mb-0.5 md:mb-1 truncate italic leading-none">{loan.provider}</h2>
                   <h1 className="text-2xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight uppercase italic">{loan.loanName}</h1>
                </div>
              </div>
              <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-4">
                 <div className="px-3 md:px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500 text-base md:text-lg">percent</span>
                    <span className="text-[9px] md:text-xs font-black text-slate-900 uppercase tracking-widest leading-none">{loan.interestRate.min}% <span className="text-slate-400 font-bold">Interest</span></span>
                 </div>
                 <div className="px-3 md:px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500 text-base md:text-lg">calendar_today</span>
                    <span className="text-[9px] md:text-xs font-black text-slate-900 uppercase tracking-widest leading-none">{loan.tenure.maxMonths} <span className="text-slate-400 font-bold">Months</span></span>
                 </div>
                 <div className="col-span-2 md:col-auto px-3 md:px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center md:justify-start gap-2">
                    <span className="material-symbols-outlined text-purple-500 text-base md:text-lg">payments</span>
                    <span className="text-[9px] md:text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Max ₹{(loan.loanAmount.max / 100000).toFixed(1)}L <span className="text-slate-400 font-bold ml-0.5">Loan</span></span>
                 </div>
              </div>
            </div>
            
            <Link to={applyPath} className="w-full lg:w-auto">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full md:w-auto px-8 md:px-10 py-4 md:py-5 bg-slate-900 text-white font-black text-[10px] md:text-sm uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-900/10 hover:bg-primary transition-all flex items-center justify-center gap-3 italic"
              >
                Start My Application
                <span className="material-symbols-outlined text-lg">trending_flat</span>
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Details Sections */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-20 -mt-12 md:-mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
          
          <div className="lg:col-span-2 space-y-6 md:space-y-10">
            {/* Features Section */}
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-sm border border-slate-100">
               <h3 className="text-lg md:text-2xl font-black text-slate-900 mb-6 md:mb-10 flex items-center gap-3 uppercase italic leading-none">
                  <span className="material-symbols-outlined text-primary text-xl md:text-2xl">auto_awesome</span>
                  How this Loan helps you
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                 {loan.features.map((feature, i) => (
                   <div key={i} className="flex gap-4 p-4 md:p-5 rounded-2xl md:rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-[#0055ff]/20 hover:shadow-xl hover:shadow-[#0055ff]/5 transition-all">
                      <div className="size-8 md:size-10 bg-white rounded-lg md:rounded-xl shadow-sm flex items-center justify-center shrink-0 border border-slate-100 group-hover:border-primary/20 transition-colors">
                         <span className="material-symbols-outlined text-emerald-500 text-lg md:text-xl font-bold">check</span>
                      </div>
                      <p className="text-slate-600 font-bold text-xs md:text-sm leading-relaxed uppercase tracking-tight">{feature}</p>
                   </div>
                 ))}
               </div>
            </div>

            {/* Who can apply? Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 border border-slate-100 dark:border-slate-800/30">
                <div className="flex items-center gap-4 mb-8">
                  <div className="size-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <span className="material-symbols-outlined font-black">verified_user</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Can you apply?</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Are you?</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">{loan.eligibility.employmentType.join(" or ").replace(/_/g, " ")}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Monthly Income</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">₹{loan.eligibility.minimumIncomeMonthly.salaried.toLocaleString()} Minimum</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Your Age</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">{loan.eligibility.age.min} to {loan.eligibility.age.max} Years</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Credit Score</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">{loan.eligibility.creditScore.minimum}+ Needed</p>
                  </div>
                </div>
            </div>
          </div>

          <div className="space-y-6 md:space-y-10">
            {/* Payment Info Section */}
            <div className="bg-slate-900 text-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full" />
                <h3 className="text-base md:text-xl font-black mb-8 md:mb-10 flex items-center gap-3 relative z-10 uppercase italic">
                   <span className="material-symbols-outlined text-primary">history_edu</span>
                   Payment Info
                </h3>
                <div className="space-y-6 md:space-y-8 relative z-10">
                   <div className="flex justify-between items-center text-[10px] md:text-sm">
                      <span className="font-bold text-slate-500 uppercase tracking-widest">Type</span>
                      <span className="font-black text-white uppercase italic">{loan.interestRate.type.replace('_', ' ')}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] md:text-sm">
                      <span className="font-bold text-slate-500 uppercase tracking-widest">Pay Early?</span>
                      <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest", loan.repayment.foreclosureAllowed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                         {loan.repayment.foreclosureAllowed ? "Allowed" : "Not Allowed"}
                      </span>
                   </div>
                   <div className="pt-6 border-t border-slate-800">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">You get money in</span>
                      <div className="flex flex-col">
                        <span className="text-3xl font-black text-white italic tracking-tighter uppercase">{loan.disbursal.time}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Directly to your {loan.disbursal.mode}</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Fees Section */}
             <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-sm border border-slate-100">
                <h3 className="text-base md:text-xl font-black text-slate-900 mb-6 md:mb-8 flex items-center gap-3 uppercase italic">
                   <span className="material-symbols-outlined text-primary">receipt_long</span>
                   Fees you pay
                </h3>
                <div className="space-y-6">
                   <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Processing Fee</span>
                      <div className="flex items-end gap-1">
                         <span className="text-2xl font-black text-slate-900 tracking-tighter italic">{loan.feesAndCharges.processingFee.percentage}%</span>
                         <span className="text-[10px] font-black text-slate-400 mb-1 uppercase opacity-60">Max ₹{loan.feesAndCharges.processingFee.maxAmount.toLocaleString()}</span>
                      </div>
                   </div>
                   <div className="space-y-3 px-1">
                      <div className="flex justify-between items-center text-[10px] md:text-sm">
                         <span className="font-bold text-slate-400 uppercase tracking-widest">Bounce Charge</span>
                         <span className="font-black text-slate-900 italic">₹{loan.feesAndCharges.bounceCharges}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] md:text-sm text-primary">
                         <span className="font-bold uppercase tracking-widest">Platform Fee</span>
                         <span className="font-black italic">FREE</span>
                      </div>
                   </div>
                   <a 
                    href={`tel:${loan.contact.customerCare}`}
                    className="w-full mt-4 py-4 bg-slate-50 text-slate-600 font-black rounded-2xl border border-slate-200 hover:bg-white hover:border-primary transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest"
                   >
                     Still Confused? Call Us
                     <span className="material-symbols-outlined text-lg">support_agent</span>
                   </a>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

