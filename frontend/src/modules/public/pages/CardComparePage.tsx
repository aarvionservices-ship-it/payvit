import { useState, useEffect } from 'react';
import { useCompareStore } from '../../../store/compare.store';
import { getCardById } from '../../../api/card.api';
import { SEO } from '../../../components/shared/SEO';
import { CreditCard, ArrowLeft, X, Check, ChevronRight, Star, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function CardComparePage() {
  const { cardIds, removeCard, clearCards } = useCompareStore();
  const [cards, setCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchComparedCards() {
      if (cardIds.length === 0) {
        setCards([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const promises = cardIds.map(id => getCardById(id));
        const results = await Promise.all(promises);
        setCards(results.map(r => r.data).filter(Boolean));
      } catch (error) {
        toast.error("Failed to cross-reference card specifications");
      } finally {
        setIsLoading(false);
      }
    }

    fetchComparedCards();
  }, [cardIds]);

  const handleRemove = (id: string) => {
    removeCard(id);
    setCards(prev => prev.filter(c => c._id !== id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8]">
        <div className="flex flex-col items-center gap-4 text-primary">
          <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Synchronizing Card Metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-display selection:bg-primary/10">
      <SEO 
        title="Compare Best Credit Cards Side-by-Side"
        description="Side-by-side comparison of India's top credit cards. Analyze rewards, annual fees, and welcome benefits with professional precision to find your perfect match."
      />

      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-white border-b border-slate-200 z-[60] px-4 md:px-6 lg:px-20">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <Link to="/cards" className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:text-primary transition-all">
            <ArrowLeft className="size-4" /> <span className="hidden md:inline">Back to Catalog</span><span className="md:hidden">Back</span>
          </Link>
          <div className="flex items-center gap-4">
             {cards.length > 0 && (
               <button 
                 onClick={clearCards}
                 className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors"
               >
                 Clear Selection ({cards.length})
               </button>
             )}
          </div>
        </div>
      </nav>

      <main className="pt-24 md:pt-32 pb-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10 text-center md:text-left">
             <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase italic">Compare <span className="text-rose-500 italic">Cards</span></h1>
             <p className="text-slate-500 font-bold text-xs uppercase tracking-widest opacity-60">Professional Card Comparison</p>
          </div>

          {cards.length === 0 ? (
             <div className="bg-white rounded-3xl p-12 md:p-24 text-center border border-slate-200">
                <div className="size-16 md:size-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner shadow-slate-900/5">
                   <Plus className="size-8 text-slate-300" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic mb-4">No Cards Selected</h3>
                <p className="text-slate-500 font-bold text-sm mb-10 max-w-sm mx-auto">Browse our card catalog and add your favorites to compare.</p>
                <Link to="/cards" className="inline-flex py-4 px-10 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:scale-105 transition-all">
                   Browse Cards
                </Link>
             </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank / Card</th>
                      <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">One-time Fee</th>
                      <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Yearly Fee</th>
                      <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating</th>
                      <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Best Features</th>
                      <th className="p-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map((card) => (
                      <tr key={card._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="p-6">
                           <div className="flex items-center gap-4">
                              <div className="size-10 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                                 <CreditCard className="size-5 text-rose-500" />
                              </div>
                              <div>
                                 <h3 className="text-sm font-black text-slate-900 uppercase italic leading-none">{card.cardName}</h3>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{card.bank}</span>
                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">{card.network[0]}</span>
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="p-6">
                           <span className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">
                             {card.fees.joiningFee === 0 || card.fees.joiningFee === "0" ? "FREE" : `₹${card.fees.joiningFee}`}
                           </span>
                        </td>
                        <td className="p-6">
                           <span className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">
                             {card.fees.annualFee === 0 || card.fees.annualFee === "0" ? "FREE" : `₹${card.fees.annualFee}`}
                           </span>
                        </td>
                        <td className="p-6">
                           <div className="flex items-center gap-2">
                              <div className="size-6 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500">
                                 <Star className="size-3.5" fill="currentColor" />
                              </div>
                              <span className="text-xl font-black text-slate-900 tracking-tighter italic">4.8</span>
                           </div>
                        </td>
                        <td className="p-6 max-w-[300px]">
                            <div className="flex flex-wrap gap-2">
                               {card.features?.slice(0, 2).map((f: string, i: number) => (
                                 <span key={i} className="px-2 py-1 bg-rose-50 text-rose-600 text-[8px] font-black uppercase rounded-lg border border-rose-100 flex items-center gap-1">
                                   <Check className="size-2.5" strokeWidth={4} />
                                   {f}
                                 </span>
                               ))}
                            </div>
                        </td>
                        <td className="p-6 text-right">
                           <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={() => handleRemove(card._id)}
                                className="size-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X className="size-4" />
                              </button>
                              <Link 
                                to={`/card/${card._id}`}
                                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest items-center justify-center gap-2 hover:bg-primary transition-all shadow-lg shadow-slate-900/10 flex"
                              >
                                See Details <ChevronRight className="size-3" />
                              </Link>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {cards.length < 5 && (
                       <tr>
                          <td colSpan={6} className="p-0 border-t border-slate-100">
                             <Link to="/cards" className="flex items-center justify-center w-full py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-primary hover:bg-slate-50 transition-all gap-2 group">
                                <Plus className="size-4 group-hover:scale-110 transition-transform" /> Add another card to compare
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

