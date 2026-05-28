import { useState, useEffect, useCallback } from 'react';
import { LoanItem } from "../modules/loan/LoanItem";
import { getLoans } from "../api/loan.api";
import { SkeletonCard } from "../components/SkeletonCard";
import type { LoanModel } from "../types";
import { SEO } from '../components/shared/SEO';
import { motion, AnimatePresence } from "motion/react";

const CATEGORIES = [
  { id: 'all', label: 'All Projects', icon: 'apps' },
  { id: 'Personal Loan', label: 'Personal', icon: 'person' },
  { id: 'Business Loan', label: 'Business', icon: 'business_center' },
  { id: 'Home Loan', label: 'Home', icon: 'home' },
  { id: 'Car Loan', label: 'Car', icon: 'directions_car' },
  { id: 'Education Loan', label: 'Education', icon: 'school' },
  { id: 'Gold Loan', label: 'Gold', icon: 'savings' },
];

export default function LoanPage() {
  const [loans, setLoans] = useState<LoanModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchLoans = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = {
        category: activeCategory !== 'all' ? activeCategory : undefined,
        search: debouncedSearch || undefined,
      };
      const response = await getLoans(params);
      if (response.success) {
        const loansData = response.data?.data || (Array.isArray(response.data) ? response.data : []);
        setLoans(loansData);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, debouncedSearch]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-display">
      <SEO 
        title="Compare & Apply for Loans | PayVit"
        description="Compare personal loans, business loans, and home loans from top Indian banks. Get instant approval, low interest rates, and minimal documentation."
      />
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 lg:px-20 overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#0055ff]/5 blur-[120px] -mr-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-emerald-500/5 blur-[100px] -ml-32 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center"
          >
            <div className="inline-flex items-center gap-2 bg-[#0055ff]/10 text-[#0055ff] px-4 py-2 rounded-full mb-8">
              <span className="material-symbols-outlined text-sm">payments</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Financial Freedom</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight leading-[1.05]">
              Empower Your <span className="text-[#0055ff]">Dreams</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-3xl leading-relaxed font-medium mb-12">
              Discover a wide range of loan options tailored to your financial needs. From personal aspirations to business expansions, we help you find the best rates.
            </p>

            {/* Search Bar */}
            <div className="w-full max-w-2xl relative group">
              <div className="absolute inset-0 bg-[#0055ff]/20 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative flex items-center bg-white border-2 border-slate-100 focus-within:border-[#0055ff] rounded-3xl p-2 pl-6 transition-all shadow-xl shadow-slate-200/50">
                <span className="material-symbols-outlined text-slate-400">search</span>
                <input 
                  type="text" 
                  placeholder="Search by loan name, bank or provider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none px-4 font-bold text-slate-900 placeholder:text-slate-400"
                />
                <button className="bg-[#0055ff] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0044dd] transition-colors shadow-lg shadow-[#0055ff]/20">
                  Search
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter Section */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all duration-300 ${
                  activeCategory === cat.id 
                    ? 'bg-[#0055ff] text-white shadow-lg shadow-[#0055ff]/25 scale-105' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                <span className="text-xs font-black uppercase tracking-widest leading-none">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-16 min-h-[60vh]">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="inline-flex items-baseline gap-2 text-3xl uppercase  font-black">
              <h2 className=" text-slate-900 tracking-wide  leading-none ">
                Available
              </h2>
              <span className="text-[#0055ff] italic">Capitals</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Marketplace Registry</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-black text-slate-500 uppercase tracking-widest">
            <span>Results: <span className="text-[#0055ff]">{loans.length}</span></span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {loans.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[4rem] p-24 text-center border-2 border-dashed border-slate-200"
              >
                <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">NO MATCHING ASSETS</h3>
                <p className="text-slate-500 mb-10 max-w-md mx-auto font-medium leading-relaxed">
                  We couldn't find any loan products matching your current filters. Try adjusting your parameters or search query.
                </p>
                <button 
                  onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                >
                  Reset Discovery
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loans.map((loan, index) => (
                  <motion.div
                    key={loan._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <LoanItem loan={loan} index={index} />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

