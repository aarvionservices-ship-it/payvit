import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { CreditCardItem } from "../modules/card/CreditCardItem";
import { SkeletonCard } from "../components/SkeletonCard";
import { getCards } from "../api/card.api";
import { getSettings } from "../api/settings.api";
import type { CardModel } from "../types";
import { SEO } from "../components/shared/SEO";
import { cn } from "../lib/utils";

export function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [cards, setCards] = useState<CardModel[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<any>(null);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter States
  const [filters, setFilters] = useState({
    bank: '',
    maxAnnualFee: 10000,
    minIncome: 0,
    network: ''
  });

  const banks = Array.from(new Set(cards.map(c => c.bank)));
  const networks = Array.from(new Set(cards.flatMap(c => c.network)));

  useEffect(() => {
    async function fetchCategory() {
      if (!categoryId) return;
      try {
        setIsCategoryLoading(true);
        const response = await getSettings();
        if (response.success && response.data.ui) {
          const cat = response.data.ui.categories?.find((c: any) => c.id === categoryId);
          setCategory(cat);
        }
      } catch (error) {
        console.error("Error fetching category:", error);
      } finally {
        setIsCategoryLoading(false);
      }
    }
    fetchCategory();
  }, [categoryId]);

  useEffect(() => {
    async function fetchCards() {
      if (!categoryId) return;
      try {
        setIsLoading(true);
        const response = await getCards({ category: categoryId });
        if (response.success) {
          const cardsData = response.data?.data || (Array.isArray(response.data) ? response.data : []);
          setCards(cardsData);
          setFilteredCards(cardsData);
        }
      } catch (error) {
        console.error("Error fetching cards:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCards();
    window.scrollTo(0, 0);
  }, [categoryId]);

  useEffect(() => {
    let result = cards;

    if (filters.bank) {
      result = result.filter(c => c.bank === filters.bank);
    }

    if (filters.network) {
      result = result.filter(c => c.network.includes(filters.network));
    }

    if (filters.maxAnnualFee < 10000) {
      result = result.filter(c => {
        const fee = typeof c.fees.annualFee === 'number' ? c.fees.annualFee : parseInt(String(c.fees.annualFee)) || 0;
        return fee <= filters.maxAnnualFee;
      });
    }

    if (filters.minIncome > 0) {
      result = result.filter(c => (c.eligibility.minIncomeMonthly || 0) >= filters.minIncome);
    }

    setFilteredCards(result);
  }, [filters, cards]);

  if (isCategoryLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8] font-black uppercase tracking-widest text-slate-300 animate-pulse">Synchronizing Category Data...</div>;
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8]">
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Category not found</h2>
          <Link to="/cards" className="text-[#0055ff] font-bold hover:underline flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-display">
      <SEO 
        title={`Best ${category.name} Cards`}
        description={category.quote || `Compare and apply for top-rated ${category.name} credit cards with exclusive rewards and benefits.`}
      />
      {/* Hero Header */}
      <section className="relative pt-12 pb-20 px-6 lg:px-20 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#0055ff]/5 blur-[120px] -mr-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/4 h-full bg-blue-400/5 blur-[100px] -ml-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">
            <Link to="/" className="hover:text-[#0055ff] transition-colors">Home</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <Link to="/cards" className="hover:text-[#0055ff] transition-colors">Cards</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-[#0055ff]">{category.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-[#0055ff]/10 text-[#0055ff] px-3 py-1 rounded-full mb-6">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Handpicked for you</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
                Best <span className="text-[#0055ff]">{category.name}</span> Cards
              </h1>
              <p className="text-lg text-slate-500 font-medium leading-relaxed italic border-l-4 border-[#0055ff]/20 pl-6">
                "{category.quote}"
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 text-right">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Offers</div>
              <div className="text-4xl font-black text-slate-900">{isLoading ? "..." : cards.length}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="px-6 lg:px-20 pb-32">
        <div className="max-w-7xl mx-auto">
          {/* Filters Area */}
          <div className="flex items-center justify-between mb-12 py-4 border-b border-slate-200">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 text-sm font-black transition-colors",
                  showFilters || filters.bank || filters.network || filters.minIncome > 0 || filters.maxAnnualFee < 10000 
                    ? "text-[#0055ff]" : "text-slate-900 hover:text-[#0055ff]"
                )}
              >
                <span className="material-symbols-outlined text-xl">tune</span>
                Filters {(filters.bank || filters.network || filters.minIncome > 0 || filters.maxAnnualFee < 10000) && "â€¢"}
              </button>
              <div className="h-4 w-[1px] bg-slate-200" />
              <p className="text-sm font-bold text-slate-500">
                Found <span className="text-[#0055ff]">{filteredCards.length}</span> {filteredCards.length === 1 ? "Card" : "Cards"}
              </p>
            </div>

            {(filters.bank || filters.network || filters.minIncome > 0 || filters.maxAnnualFee < 10000) && (
              <button 
                onClick={() => setFilters({ bank: '', maxAnnualFee: 10000, minIncome: 0, network: '' })}
                className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-12"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                  {/* Bank Filter */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Bank</label>
                    <select 
                      value={filters.bank}
                      onChange={(e) => setFilters(f => ({ ...f, bank: e.target.value }))}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0055ff]/20"
                    >
                      <option value="">All Banks</option>
                      {banks.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>

                  {/* Network Filter */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Card Network</label>
                    <select 
                      value={filters.network}
                      onChange={(e) => setFilters(f => ({ ...f, network: e.target.value }))}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0055ff]/20"
                    >
                      <option value="">All Networks</option>
                      {networks.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  {/* Annual Fee Filter */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max Annual Fee</label>
                      <span className="text-xs font-black text-[#0055ff]">₹{filters.maxAnnualFee}</span>
                    </div>
                    <input 
                      type="range" min="0" max="10000" step="500"
                      value={filters.maxAnnualFee}
                      onChange={(e) => setFilters(f => ({ ...f, maxAnnualFee: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0055ff]"
                    />
                  </div>

                  {/* Income Filter */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min Income (Monthly)</label>
                      <span className="text-xs font-black text-[#0055ff]">₹{(filters.minIncome/1000).toFixed(0)}k+</span>
                    </div>
                    <input 
                      type="range" min="0" max="200000" step="10000"
                      value={filters.minIncome}
                      onChange={(e) => setFilters(f => ({ ...f, minIncome: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0055ff]"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-sm">
              <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-slate-300">credit_card_off</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">No cards found</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">We couldn't find any cards in this category right now. Please check back later or explore other categories.</p>
              <Link to="/cards" className="px-8 py-3 bg-[#0055ff] text-white font-black rounded-xl shadow-lg shadow-[#0055ff]/20 hover:bg-blue-600 transition-all">
                Explore Categories
              </Link>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8"
            >
              {filteredCards.map((card, index) => (
                <CreditCardItem key={card._id} card={card} index={index} categoryId={category.id} />
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

