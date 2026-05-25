import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, X, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';


// Components from Public (to maintain consistency)
import CategoryPill from '../../public/components/CategoryPill';
import FilterSidebar from '../../public/components/FilterSidebar';
import MarketplaceOfferCard from '../../public/components/MarketplaceOfferCard';

// API & Store
import { getLoans } from '../../../api/loan.api';
import { getCards } from '../../../api/card.api';
import { getProfileRequest } from '../../../api/user.api';
import { useAuthStore } from '../../../store/auth.store';
import type { LoanModel, CardModel } from '../../../types';
import { SEO } from '../../../components/shared/SEO';
import { cn } from '../../../lib/utils';

type MarketplaceCategory = 'Loans' | 'Cards';

export default function OffersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') as MarketplaceCategory;
  
  const { user: authUser, setUser } = useAuthStore();

  const [activeCategory, setActiveCategory] = useState<MarketplaceCategory>(
    (categoryParam === 'Loans' || categoryParam === 'Cards') ? categoryParam : 'Loans'
  );

  const [loans, setLoans] = useState<LoanModel[]>([]);
  const [cards, setCards] = useState<CardModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 6;

  // Filter States
  const [maxAmount, setMaxAmount] = useState(10000000);
  const [rateType, setRateType] = useState<'Fixed' | 'Variable'>('Variable');
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [subCategory, setSubCategory] = useState<string>('all');

  useEffect(() => {
    if (categoryParam && categoryParam !== activeCategory) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const queryParams = { 
          page: currentPage, 
          limit: itemsPerPage,
          category: activeCategory === 'Loans' && subCategory !== 'all' ? subCategory : undefined,
          // Support for card categories if backend allows in future
        };

        const [profileRes, productsRes] = await Promise.all([
          getProfileRequest().catch(() => ({ data: { favoriteOffers: [] } })),
          activeCategory === 'Cards' ? getCards(queryParams) : getLoans(queryParams)
        ]);

        // Handle profile/favorites
        const loadedFavs = profileRes.data?.favoriteOffers || profileRes.favoriteOffers || [];
        if(authUser && JSON.stringify(authUser.favoriteOffers) !== JSON.stringify(loadedFavs)) {
            setUser({ ...authUser, favoriteOffers: loadedFavs });
        }

        // Handle products
        if (productsRes.success) {
          const productsData = productsRes.data?.data || (Array.isArray(productsRes.data) ? productsRes.data : []);
          const total = productsRes.data?.total || (Array.isArray(productsRes.data) ? productsData.length : 0);
          
          setTotalItems(total);
          if (activeCategory === 'Cards') {
            setCards(productsData);
          } else {
            setLoans(productsData);
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
    setCurrentPage(1); // Reset page on category change
    onResetFilters();
  };

  const onResetFilters = () => {
    setMaxAmount(10000000);
    setRateType('Variable');
    setSelectedBanks([]);
    setSubCategory('all');
    setCurrentPage(1); // Reset page on filters reset
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

  const filteredItems = useMemo(() => {
    return activeCategory === 'Cards' 
      ? cards.filter(card => {
          if (selectedBanks.length > 0) {
            const cardBank = (card.bank || '').toLowerCase();
            const bankMatches = selectedBanks.some(sb => {
               const searchBank = sb.toLowerCase();
               return cardBank.includes(searchBank) || 
                      searchBank.includes(cardBank) ||
                      searchBank.split(' ').some(word => word.length > 2 && cardBank.includes(word));
            });
            if (!bankMatches) return false;
          }
          if (subCategory !== 'all') {
              return card.category?.some(cat => cat.toLowerCase().includes(subCategory.toLowerCase())) || 
                     card.bestFor?.some(cat => cat.toLowerCase().includes(subCategory.toLowerCase()));
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
          stat1Value: `₹${card.fees?.joiningFee || 0}`,
          stat2Label: 'Annual Fee',
          stat2Value: `₹${card.fees?.annualFee || 0}`,
          stat3Label: 'Best For',
          stat3Value: card.bestFor?.[0] || 'Generic',
        }))
      : loans.filter(loan => {
          if (loan.loanAmount?.min && loan.loanAmount.min > maxAmount) return false;
          if (selectedBanks.length > 0) {
            const loanProvider = (loan.provider || '').toLowerCase();
            const bankMatches = selectedBanks.some(sb => {
               const searchBank = sb.toLowerCase();
               return loanProvider.includes(searchBank) || 
                      searchBank.includes(loanProvider) ||
                      searchBank.split(' ').some(word => word.length > 2 && loanProvider.includes(word));
            });
            if (!bankMatches) return false;
          }
          if (subCategory !== 'all' && loan.category !== subCategory) return false;
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
          stat2Value: `₹${((loan.loanAmount?.max || 0) / 100000).toFixed(1)}L`,
          stat3Label: 'Processing Fee',
          stat3Value: `${(loan.feesAndCharges as any)?.processingFee?.percentage || 0}%`,
          badgeText: loan.specialOffers?.[0],
          badgeColor: 'bg-emerald-100 text-emerald-700',
        }));
  }, [activeCategory, cards, loans, selectedBanks, maxAmount, subCategory]);

  const categoryOptions: { label: MarketplaceCategory; icon: string; color: any }[] = [
    { label: 'Loans', icon: 'payments', color: 'blue' },
    { label: 'Cards', icon: 'credit_card', color: 'rose' },
  ];

  return (
    <div className="space-y-8">
      <SEO title={`${activeCategory} Marketplace`} description="Explore personalized financial offers." />
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-200 pb-12">
        <div>
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mb-4">
            <span className="w-8 h-[2px] bg-blue-600" />
            Discover
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-8">
            Tailored <span className="text-blue-600">Offers</span>
          </h1>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {categoryOptions.map((cat) => (
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
            
            {/* Mobile Filter Button */}
            <button 
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-slate-900"
            >
              <SlidersHorizontal size={14} className="text-blue-600" />
              Filters
            </button>
          </div>
        </div>

        <div className="text-right hidden md:block">
           <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Available Marketplace</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              Showing <span className="text-blue-600">{totalItems}</span> Verified products
           </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start pb-20">
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
                className="fixed top-0 right-0 bottom-0 w-full max-w-[320px] bg-white z-[110] shadow-2xl lg:hidden flex flex-col"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                   <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Refine Hub</h3>
                   <button 
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors"
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
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl"
                    >
                      Show {filteredItems.length} Results
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block w-80 shrink-0 sticky top-4 z-20 self-start max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-hide">
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

        <div className="flex-1 min-w-0 w-full space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-32 text-blue-600">
               <Loader2 size={48} className="animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center flex flex-col items-center justify-center"
            >
               <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No Matches Found</h2>
               <p className="text-slate-500 text-sm font-medium leading-relaxed">Try adjusting your filters.</p>
               <button onClick={onResetFilters} className="mt-6 text-xs font-black text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-8 uppercase tracking-widest">
                  Reset filters
               </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {filteredItems.map((item, idx) => (
                <MarketplaceOfferCard
                  key={item.id}
                  {...item}
                  delay={idx * 0.05}
                />
              ))}
            </div>
          )}

          {/* Premium Pagination Component */}
          {!isLoading && totalItems > itemsPerPage && (
            <div className="flex items-center justify-center gap-2 md:gap-3 py-12 border-t border-slate-100 mt-12 mb-20 md:mb-12">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="size-10 md:size-12 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-500 hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-all bg-white shadow-sm hover:scale-105 active:scale-95 group"
              >
                <span className="material-symbols-outlined text-base md:text-xl group-hover:-translate-x-0.5 transition-transform">west</span>
              </button>

              <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm font-black">
                {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "size-8 md:size-9 rounded-xl text-[10px] md:text-xs transition-all",
                      currentPage === page 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-black scale-110" 
                        : "hover:bg-slate-50 text-slate-500 font-bold"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalItems / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}
                className="size-10 md:size-12 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-500 hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-all bg-white shadow-sm hover:scale-105 active:scale-95 group"
              >
                <span className="material-symbols-outlined text-base md:text-xl group-hover:translate-x-0.5 transition-transform">east</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

