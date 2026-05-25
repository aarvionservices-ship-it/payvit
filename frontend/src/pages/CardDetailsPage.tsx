import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { getCardById } from "../api/card.api";
import { getFeatureColor } from "../lib/iconMap";
import { cn } from "../lib/utils";
import type { CardModel, CardScore } from "../types";
import { useAuthStore } from "../store/auth.store";
import { SEO } from "../components/shared/SEO";

export function CardDetailsPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const [card, setCard] = useState<CardModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  
  const applyPath = user 
    ? `/customer/apply/${cardId}` 
    : `/login?redirect=/customer/apply/${cardId}`;

  useEffect(() => {
    async function fetchCard() {
      if (!cardId) return;
      try {
        setIsLoading(true);
        const response = await getCardById(cardId);
        if (response.success) {
          setCard(response.data);
        }
      } catch (error) {
        console.error("Error fetching card details:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCard();
    window.scrollTo(0, 0);
  }, [cardId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 border-4 border-[#0055ff]/20 border-t-[#0055ff] rounded-full animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Card Portfolio...</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8]">
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Card details not found</h2>
          <Link to="/cards" className="text-[#0055ff] font-bold hover:underline flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-display">
      <SEO 
        title={`${card.cardName} | ${card.bank}`}
        description={card.description || `Apply for the ${card.cardName} credit card from ${card.bank}. Enjoy exclusive benefits, rewards, and seamless financial management with PayVit.`}
      />
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 right-0 w-[50%] h-[50%] blur-[120px] opacity-10`} style={{ background: 'linear-gradient(to bottom right, #0055ff, transparent)' }} />
        <div className={`absolute bottom-0 left-0 w-[50%] h-[50%] blur-[120px] opacity-10`} style={{ background: 'linear-gradient(to top left, #0055ff, transparent)' }} />
      </div>

      <main className="max-w-7xl mx-auto px-6 lg:px-20 py-12 relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-12">
          <Link to="/" className="hover:text-[#0055ff] transition-colors">Home</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <Link to="/cards" className="hover:text-[#0055ff] transition-colors">Cards</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#0055ff]">{card.cardName}</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* LEFT COLUMN: Visual & Main Info */}
          <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-10">
            {/* Main Visual Header */}
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative group">
               {/* Background Decorative Element */}
               <div className="absolute top-0 right-0 w-1/2 h-full bg-[#0055ff]/5 -mr-20 blur-[80px] group-hover:bg-[#0055ff]/10 transition-colors" />
               
               <motion.div 
                 initial={{ opacity: 0, x: -50 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="relative z-10 w-full md:w-1/2"
               >
                 <div className="relative aspect-[1.6/1] rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 group-hover:shadow-primary/20 transition-all duration-500">
                   {card.imageUrl ? (
                     <img 
                       src={card.imageUrl} 
                       alt={card.cardName} 
                       className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                       referrerPolicy="no-referrer"
                     />
                   ) : (
                     <div className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-1000 group-hover:scale-110", card.gradient || "from-slate-700 to-slate-900")} />
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60" />
                   <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="size-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20">
                           <span className="material-symbols-outlined text-white text-xl">contactless</span>
                        </div>
                        <span className="text-white/70 font-black text-[10px] uppercase tracking-[0.2em]">{card.network[0]}</span>
                      </div>
                      <div className="font-mono text-white/50 text-xs tracking-widest px-1 py-0.5">#### #### #### ####</div>
                   </div>
                 </div>
               </motion.div>

               <div className="flex-1 relative z-10">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {card.category.map((cat: string) => (
                      <span key={cat} className="px-3 py-1 bg-[#0055ff]/10 text-[#0055ff] rounded-full text-[10px] font-black uppercase tracking-widest">
                        {cat}
                      </span>
                    ))}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 leading-tight tracking-tight">
                    {card.cardName}
                  </h1>
                  <p className="text-lg text-slate-500 font-bold mb-8">{card.bank}</p>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Annual Fee</span>
                      <span className="text-2xl font-black text-slate-900">
                         {card.fees.annualFee === 0 || card.fees.annualFee === "0" ? "Free" : `₹${card.fees.annualFee}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Joining Fee</span>
                      <span className="text-2xl font-black text-slate-900">
                         {card.fees.joiningFee === 0 || card.fees.joiningFee === "0" ? "Free" : `₹${card.fees.joiningFee}`}
                      </span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Key Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm col-span-1 md:col-span-2">
                  <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Premium Privileges</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {card.features.map((feature: string, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all group">
                        <div className={cn("size-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 shadow-sm bg-white", getFeatureColor(feature))}>
                           <span className="material-symbols-outlined text-2xl font-medium">
                              {feature.toLowerCase().includes('lounge') ? 'flight' : 
                               feature.toLowerCase().includes('cashback') ? 'payments' : 
                               feature.toLowerCase().includes('reward') ? 'military_tech' : 
                               feature.toLowerCase().includes('fuel') ? 'local_gas_station' : 
                               feature.toLowerCase().includes('insurance') ? 'security' : 'auto_awesome'}
                           </span>
                        </div>
                        <span className="text-slate-800 font-bold text-sm leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* Tags Section */}
            <div className="flex flex-wrap gap-3">
               {card.tags.map((tag: string) => (
                 <span key={tag} className="px-5 py-2.5 bg-white text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-100 shadow-sm hover:border-[#0055ff]/30 transition-colors">
                    #{tag}
                 </span>
               ))}
            </div>
          </div>

          {/* RIGHT COLUMN: CTA & Detailed Stats */}
          <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6">
            {/* Apply Now Sidebar */}
            <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl shadow-slate-900/30 sticky top-28 overflow-hidden">
               {/* Decorative Gradient Overlay */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#0055ff]/30 blur-[60px]" />
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 blur-[60px]" />

               <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-[#0055ff] text-white px-3 py-1 rounded-full mb-6">
                    <span className="material-symbols-outlined text-xs">bolt</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Instant Approval</span>
                  </div>
                  <h3 className="text-2xl font-black mb-6 leading-tight">Ready to upgrade your wallet?</h3>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">Join 5M+ users who trust PayVit for the best-in-class financial products. Digital application takes less than 3 minutes.</p>
                  
                  <Link 
                    to={applyPath}
                    className="w-full py-5 bg-[#0055ff] hover:bg-blue-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-[#0055ff]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mb-6 group"
                  >
                     Apply Now
                     <span className="material-symbols-outlined font-black group-hover:translate-x-1 transition-transform">trending_flat</span>
                  </Link>
                  
                  <div className="flex flex-col gap-4 py-6 border-t border-white/10">
                     <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                        <span className="text-sm font-bold text-slate-300">Min. Income: ₹{card.eligibility.minIncomeMonthly?.toLocaleString() || "N/A"} pm</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                        <span className="text-sm font-bold text-slate-300">Min. Credit Score: {card.eligibility.creditScore}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                        <span className="text-sm font-bold text-slate-300">Age: {card.eligibility.age}</span>
                     </div>
                  </div>
                  
                  <div className="pt-6 flex flex-col gap-2">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Best Suited For</p>
                     <div className="flex flex-wrap gap-2">
                        {card.bestFor.map((tag: string) => (
                           <span key={tag} className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest border border-white/5">
                              {tag}
                           </span>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
            
            {/* Share & Info Box */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col gap-6">
               <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">About this Card</h4>
               <p className="text-xs text-slate-500 leading-relaxed italic">
                 "Our analysis suggests this card is highly competitive in the {card.category[0]} sector, offering a category rating of {card.score[card.category[0] as keyof CardScore]?.toFixed(1)}/10.0 based on current market trends."
               </p>
               <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <button className="flex items-center gap-2 text-xs font-black text-primary hover:underline">
                    <span className="material-symbols-outlined text-lg">share</span>
                    Share Details
                  </button>
                  <button className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-900 transition-colors">
                    <span className="material-symbols-outlined text-lg">info</span>
                    Compare
                  </button>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

