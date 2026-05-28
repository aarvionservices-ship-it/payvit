import { useState, useEffect } from 'react';
import { useCompareStore } from '../../../store/compare.store';
import { getLoanById } from '../../../api/loan.api';
import { SEO } from '../../../components/shared/SEO';
import { Landmark, ArrowLeft, X, Plus, Check, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function LoanComparePage() {
  const { loanIds, removeLoan, clearLoans } = useCompareStore();
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchComparedLoans() {
      if (loanIds.length === 0) {
        setLoans([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const promises = loanIds.map(id => getLoanById(id));
        const results = await Promise.all(promises);
        setLoans(results.map(r => r.data).filter(Boolean));
      } catch (error) {
        toast.error("Failed to fetch some loan details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchComparedLoans();
  }, [loanIds]);

  const handleRemove = (id: string) => {
    removeLoan(id);
    setLoans(prev => prev.filter(l => l._id !== id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Calibrating Comparisons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-display selection:bg-primary/10">
      <SEO 
        title="Compare Personal & Business Loans Side-by-Side"
        description="Compare up to 5 loans instantly. View interest rates, processing fees, and features in a professional comparison matrix designed for clarity."
      />

      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-white border-b border-slate-200 z-[60] px-4 md:px-6 lg:px-20">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <Link to="/loans" className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:text-primary transition-colors">
            <ArrowLeft className="size-4" /> <span className="hidden md:inline">Back to Catalog</span><span className="md:hidden">Back</span>
          </Link>
          <div className="flex items-center gap-4">
             {loans.length > 0 && (
               <button 
                 onClick={clearLoans}
                 className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors"
               >
                 Clear Selection ({loans.length})
               </button>
             )}
          </div>
        </div>
      </nav>

      <main className="pt-24 md:pt-32 pb-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10">
             <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-wide">Compare <span className="text-primary italic">Loans</span></h1>
             <p className="text-slate-500 font-bold text-xs uppercase tracking-widest opacity-60">Professional Comparison Matrix</p>
          </div>

          {loans.length === 0 ? (
             <div className="bg-white rounded-3xl p-12 md:p-20 text-center border border-slate-200">
                <div className="size-16 md:size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Plus className="size-8 text-slate-300" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-wide mb-4">No Selection</h3>
                <p className="text-slate-500 font-bold text-sm mb-10 max-w-sm mx-auto">Please add loans to compare from the marketplace.</p>
                <Link to="/loans" className="inline-flex py-4 px-10 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:scale-105 transition-transform">
                   Browse Products
                </Link>
             </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank / Loan</th>
                      <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Interest</th>
                      <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Amount</th>
                      <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tenure</th>
                      <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Features</th>
                      <th className="p-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((loan) => (
                      <tr key={loan._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="size-10 bg-primary/5 rounded-xl flex items-center justify-center shrink-0">
                               <Landmark className="size-5 text-primary" />
                            </div>
                            <div>
                               <h3 className="text-sm font-black text-slate-900 uppercase italic leading-none">{loan.loanName}</h3>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{loan.provider}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="text-lg font-black text-slate-900 tracking-tighter italic">{loan.interestRate.min}% <span className="text-[9px] text-slate-400 uppercase tracking-widest not-italic">p.a</span></span>
                        </td>
                        <td className="p-6">
                          <span className="text-lg font-black text-slate-900 tracking-tighter italic">{(loan.loanAmount.max / 100000).toFixed(1)} <span className="text-primary tracking-normal font-black">L</span></span>
                        </td>
                        <td className="p-6">
                          <span className="text-lg font-black text-slate-900 tracking-tighter italic">{loan.tenure.maxMonths / 12} <span className="text-[9px] text-slate-400 uppercase tracking-widest not-italic">Yrs</span></span>
                        </td>
                        <td className="p-6 max-w-[300px]">
                           <div className="flex flex-wrap gap-2">
                              {loan.features?.slice(0, 3).map((f: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg border border-emerald-100 flex items-center gap-1">
                                  <Check className="size-2.5" strokeWidth={4} />
                                  {f}
                                </span>
                              ))}
                           </div>
                        </td>
                        <td className="p-6 text-right">
                           <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={() => handleRemove(loan._id)}
                                className="size-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X className="size-4" />
                              </button>
                              <Link 
                                to={`/loan/${loan._id}`}
                                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest items-center justify-center gap-2 hover:bg-primary transition-all shadow-lg shadow-slate-900/10 flex"
                              >
                                Apply Now <ChevronRight className="size-3" />
                              </Link>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {/* Add More Row */}
                    {loans.length < 5 && (
                       <tr>
                         <td colSpan={6} className="p-0 border-t border-slate-100">
                           <Link to="/loans" className="flex items-center justify-center w-full py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-primary hover:bg-slate-50 transition-all gap-2 group">
                              <Plus className="size-4 group-hover:scale-110 transition-transform" /> Add another loan to compare
                           </Link>
                         </td>
                       </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

