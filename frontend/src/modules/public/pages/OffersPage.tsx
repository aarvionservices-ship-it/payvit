import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, SlidersHorizontal } from 'lucide-react';
import CategoryPill from '../components/CategoryPill';
import FilterSidebar from '../components/FilterSidebar';
import MarketplaceOfferCard from '../components/MarketplaceOfferCard';
import { getLoans } from '../../../api/loan.api';
import { getCards } from '../../../api/card.api';
import type { LoanModel, CardModel } from '../../../types';
import { SEO } from '../../../components/shared/SEO';
import { formatCurrency, formatCompactNumber } from '../../../utils/formatters';

type MarketplaceCategory = 'Loans' | 'Cards';

export default function OffersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') as MarketplaceCategory;
  
  const [activeCategory, setActiveCategory] = useState<MarketplaceCategory>(
    (categoryParam === 'Loans' || categoryParam === 'Cards') ? categoryParam : 'Loans'
  );

   const [loans, setLoans] = useState<LoanModel[]>([]);
  const [cards, setCards] = useState<CardModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filter States
  const [maxAmount, setMaxAmount] = useState(10000000);
  const [rateType, setRateType] = useState<'Fixed' | 'Variable'>('Variable');
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [subCategory, setSubCategory] = useState<string>('all');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 6;

  const seoTitle = `${activeCategory} Offers | Marketplace`;
  const seoDescription = `Browse and compare the best ${activeCategory.toLowerCase()} from top banks. Get instant approval and competitive interest rates with PayVit.`;

  useEffect(() => {
    if (categoryParam && categoryParam !== activeCategory) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        if (activeCategory === 'Cards') {
          const params: any = {
            category: subCategory !== 'all' ? subCategory : undefined,
            page: currentPage,
            limit: itemsPerPage
          };
          const response = await getCards(params);
          if (response.success) {
            const cardsData = response.data?.data || (Array.isArray(response.data) ? response.data : []);
            const total = response.data?.total || (Array.isArray(response.data) ? cardsData.length : 0);
            setCards(cardsData);
            setTotalItems(total);
          }
        } else {
          const params: any = {
            category: subCategory !== 'all' ? subCategory : undefined,
            page: currentPage,
            limit: itemsPerPage
          };
          const response = await getLoans(params);
          if (response.success) {
            const loansData = response.data?.data || (Array.isArray(response.data) ? response.data : []);
            const total = response.data?.total || (Array.isArray(response.data) ? loansData.length : 0);
            setLoans(loansData);
            setTotalItems(total);
          }
        }
      } catch (error) {
        console.error('Error fetching marketplace data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [activeCategory, subCategory, currentPage]);

  const handleCategoryChange = (cat: MarketplaceCategory) => {
    setActiveCategory(cat);
    setSearchParams({ category: cat });
    setCurrentPage(1);
    onResetFilters();
  };

  const onResetFilters = () => {
    setMaxAmount(10000000);
    setRateType('Variable');
    setSelectedBanks([]);
    setSubCategory('all');
    setCurrentPage(1);
  };

  const bankColorMap: Record<string, string> = {
    'Axis Bank': 'bg-rose-700',
    'SBI': 'bg-blue-800',
    'HDFC Bank': 'bg-blue-600',
    'ICICI Bank': 'bg-orange-600',
    'Bajaj Finance': 'bg-blue-900',
    'Kotak Mahindra': 'bg-red-600',
    'IDFC FIRST': 'bg-red-800',
    'IndusInd': 'bg-rose-900',
    'Bank of Baroda': 'bg-orange-500',
    'PNB': 'bg-yellow-700'
  };

  const filteredItems = activeCategory === 'Cards' 
    ? cards.filter(card => {
        if (selectedBanks.length > 0) {
          const cardBank = (card.bank || '').toLowerCase();
          const bankMatches = selectedBanks.some(sb => {
             const searchBank = sb.toLowerCase();
             return cardBank.includes(searchBank) || 
                    searchBank.includes(cardBank);
          });
          if (!bankMatches) return false;
        }
        if (subCategory !== 'all') {
            const searchCat = subCategory.toLowerCase();
            return (card.category || []).some(cat => cat.toLowerCase().includes(searchCat)) || 
                   (card.bestFor || []).some(cat => cat.toLowerCase().includes(searchCat)) ||
                   (card.tags || []).some(tag => tag.toLowerCase().includes(searchCat));
        }
        return true;
      }).map(card => ({
        id: card._id,
        type: 'card' as const,
        bankName: (card.bank || 'Bank').split(' ')[0].toUpperCase(),
        bankColor: bankColorMap[card.bank] || 'bg-slate-900',
        title: card.cardName,
        description: card.description || 'Verified credit card offer',
        stat1Label: 'Joining Fee',
        stat1Value: formatCurrency(card.fees?.joiningFee || 0),
        stat2Label: 'Annual Fee',
        stat2Value: formatCurrency(card.fees?.annualFee || 0),
        stat3Label: 'Best For',
        stat3Value: card.bestFor?.[0] || 'Generic',
      }))
    : loans.filter(loan => {
        if (loan.loanAmount?.min && loan.loanAmount.min > maxAmount) return false;
        if (selectedBanks.length > 0) {
          const loanProvider = (loan.provider || '').toLowerCase();
          const bankMatches = selectedBanks.some(sb => {
             const searchBank = sb.toLowerCase();
             // Handle common abbreviations
             if (searchBank === 'sbi' && (loanProvider.includes('state bank') || loanProvider.includes('sbi'))) return true;
             if (searchBank === 'pnb' && (loanProvider.includes('punjab national') || loanProvider.includes('pnb'))) return true;
             
             return loanProvider.includes(searchBank) || 
                    searchBank.includes(loanProvider);
          });
          if (!bankMatches) return false;
        }
        if (subCategory !== 'all' && loan.category?.toLowerCase() !== subCategory.toLowerCase()) return false;
        
        // Rate Type Filter
        if (rateType) {
            const loanRateType = (loan.interestRate as any)?.type?.toLowerCase() || '';
            if (rateType === 'Fixed' && !loanRateType.includes('fixed')) return false;
            if (rateType === 'Variable' && (loanRateType.includes('floating') || loanRateType.includes('reducing') || loanRateType.includes('variable'))) {
                // matches
            } else if (rateType === 'Variable') {
                return false;
            }
        }
        return true;
      }).map(loan => ({
        id: loan._id,
        type: 'loan' as const,
        bankName: (loan.provider || 'Bank').split(' ')[0].toUpperCase(),
        bankColor: bankColorMap[loan.provider] || 'bg-blue-600',
        title: loan.loanName,
        description: loan.features?.[0] || 'Flexible loan with easy repayments.',
        stat1Label: 'Interest Rate',
        stat1Value: `${loan.interestRate?.min || (loan.interestRate as any)?.percentage || 0}%`,
        stat2Label: 'Max Amount',
        stat2Value: formatCompactNumber(loan.loanAmount?.max || 0),
        stat3Label: 'Processing Fee',
        stat3Value: `${(loan.feesAndCharges as any)?.processingFee?.percentage || 0}%`,
        badgeText: loan.specialOffers?.[0],
        badgeColor: 'bg-emerald-100 text-emerald-700',
      }));

  const categories: { label: MarketplaceCategory; icon: string; color: any }[] = [
    { label: 'Loans', icon: 'payments', color: 'blue' },
    { label: 'Cards', icon: 'credit_card', color: 'rose' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark font-display">
      <SEO title={seoTitle} description={seoDescription} />
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        {/* Simplified Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4">
            <span className="w-8 h-[2px] bg-primary" />
            Marketplace
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-none">
            Find your <span className="text-primary">financial fit.</span>
          </h1>
          
          <div className="flex items-center gap-4">
            {categories.map((cat) => (
              <CategoryPill
                key={cat.label}
                icon={cat.icon}
                label={cat.label}
                isActive={activeCategory === cat.label}
                colorTheme={cat.color}
                onClick={() => handleCategoryChange(cat.label)}
              />
            ))}
          </div>
        </div>

        {/* Results Info & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Available Offers</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              {isLoading ? 'Scanning global partners...' : (
                <>
                   Showing <span className="text-primary">{totalItems}</span> Verified products
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
             <button 
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:scale-105 active:scale-95 transition-all"
             >
                <SlidersHorizontal size={16} className="text-primary" />
                Filters
             </button>
             <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 lg:hidden" />
             <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort:</span>
                <button className="font-black text-slate-900 dark:text-white text-[10px] flex items-center gap-1 hover:text-primary transition-colors border-b-2 border-primary pb-1 uppercase tracking-widest">
                  Popular <span className="material-symbols-outlined text-lg">expand_more</span>
                </button>
             </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Mobile Filter Overlay */}
          <AnimatePresence>
            {isMobileFilterOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden"
                />
                <motion.div 
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 right-0 bottom-0 w-full max-w-[320px] bg-white dark:bg-slate-900 z-[110] shadow-2xl lg:hidden flex flex-col"
                >
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                     <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Market Filters</h3>
                     <button 
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="p-2 -mr-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                     >
                       <X size={24} />
                     </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 pb-20">
                    <FilterSidebar 
                      amount={maxAmount}
                      setAmount={setMaxAmount}
                      rateType={rateType}
                      setRateType={setRateType}
                      selectedBanks={selectedBanks}
                      setSelectedBanks={setSelectedBanks}
                      activeCategory={activeCategory}
                      subCategory={subCategory}
                      setSubCategory={setSubCategory}
                      onReset={() => {
                          onResetFilters();
                          setIsMobileFilterOpen(false);
                      }}
                    />
                    <div className="mt-8 space-y-4">
                      <button 
                        onClick={() => setIsMobileFilterOpen(false)}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        Show {filteredItems.length} Products
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          
          {/* Desktop Filter Sidebar - Sticky Wrapper */}
          <div className="hidden lg:block w-80 shrink-0 sticky top-28 z-20 self-start max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-hide pb-10">
            <FilterSidebar 
              amount={maxAmount}
              setAmount={setMaxAmount}
              rateType={rateType}
              setRateType={setRateType}
              selectedBanks={selectedBanks}
              setSelectedBanks={setSelectedBanks}
              activeCategory={activeCategory}
              subCategory={subCategory}
              setSubCategory={setSubCategory}
              onReset={onResetFilters}
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Offer List */}
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-white dark:bg-slate-900 animate-pulse rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-16 text-center flex flex-col items-center justify-center"
              >
                 <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-slate-300 font-light">search_off</span>
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">No Matches Found</h2>
                 <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium leading-relaxed">Adjust your filters to see more offers.</p>
                 <button onClick={onResetFilters} className="mt-6 text-xs font-black text-primary hover:text-blue-700 underline decoration-2 underline-offset-8 uppercase tracking-widest">
                    Reset filters
                 </button>
              </motion.div>
            ) : (
              <div className="space-y-6 mb-16">
                {filteredItems.map((item, idx) => (
                  <MarketplaceOfferCard
                    key={item.id}
                    {...item}
                    delay={idx * 0.05}
                  />
                ))}
              </div>
            )}

            {/* Premium Pagination */}
            {!isLoading && totalItems > itemsPerPage && (
              <div className="flex items-center justify-center gap-3 pt-8 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="size-11 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-all bg-white dark:bg-slate-900 hover:scale-105 active:scale-95 shadow-sm disabled:opacity-30 disabled:hover:scale-100"
                >
                  <span className="material-symbols-outlined text-lg">west</span>
                </button>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm font-black">
                  {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                    <button 
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`size-8 rounded-xl text-[10px] transition-all ${
                        currentPage === page 
                          ? "bg-primary text-white shadow-lg shadow-primary/30" 
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalItems / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}
                  className="size-11 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:border-primary hover:text-primary transition-all bg-white dark:bg-slate-900 hover:scale-105 active:scale-95 shadow-sm disabled:opacity-30 disabled:hover:scale-100"
                >
                  <span className="material-symbols-outlined text-lg">east</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

