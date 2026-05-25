import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Trash2, Edit2, ExternalLink, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { getCards, deleteCard } from '../../../api/card.api';
import type { CardModel } from '../../../types';
import Pagination from '../../../components/Pagination';

export default function AdminCardsPage() {
  const [cards, setCards] = useState<CardModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCards, setTotalCards] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(6); // 3 per row looks good
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Filter States
  const [filters, setFilters] = useState({
    bank: '',
    type: ''
  });

  useEffect(() => {
    fetchCards();
  }, [currentPage, searchQuery, filters]);

  const fetchCards = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page: currentPage,
        limit,
        search: searchQuery || undefined,
        bank: filters.bank || undefined,
        type: filters.type || undefined
      };
      
      const response = await getCards(params);
      if (response.success) {
        setCards(response.data?.data || []);
        setTotalCards(response.data?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        setDeletingId(id);
        const response = await deleteCard(id);
        if (response.success) {
          setCards(cards.filter(card => card._id !== id));
        }
      } catch (error) {
        console.error('Error deleting card:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };


  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 pb-20 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="max-w-full overflow-hidden">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">Credit Card Portfolio</h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.15em] sm:tracking-widest mt-2 leading-relaxed">
            Manage Financial Assets & Marketplace Offers
          </p>
        </div>
        <Link 
          to="/admin/cards/create" 
          className="w-full sm:w-auto bg-primary text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95"
        >
          <Plus className="size-4" /> Add New Card
        </Link>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2rem] border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by card name or bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider">
            {totalCards} Total Cards
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 border border-slate-200 dark:border-slate-800 rounded-xl transition-all ${showFilters || filters.bank || filters.type ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
          >
            <Filter className="size-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter by Bank</label>
                <input 
                  type="text" 
                  placeholder="e.g. HDFC, ICICI..."
                  value={filters.bank}
                  onChange={(e) => setFilters(f => ({ ...f, bank: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Card Type</label>
                <select 
                  value={filters.type}
                  onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All Types</option>
                  <option value="credit">Credit Card</option>
                  <option value="debit">Debit Card</option>
                  <option value="prepaid">Prepaid Card</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={() => setFilters({ bank: '', type: '' })}
                  className="w-full h-11 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {cards.map((card, i) => (
              <motion.div
                key={card._id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:border-primary/30 transition-all duration-300"
              >
                {/* Compact Header */}
                <div className="relative h-32 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {card.imageUrl ? (
                    <img 
                      src={card.imageUrl} 
                      alt={card.cardName} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${card.gradient || 'from-slate-700 to-slate-900'}`} />
                  )}
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest border border-white/20">
                    {card.bank}
                  </div>
                </div>

                {/* Practical Body */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">{card.cardName}</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{card.type} â€¢ {card.network[0]}</p>
                    </div>
                    <div className="flex gap-1.5 pt-0.5">
                      <Link 
                        to={`/admin/cards/edit/${card._id}`} 
                        className="size-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                        title="Edit Card"
                      >
                        <Edit2 className="size-3.5" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(card._id)} 
                        disabled={deletingId === card._id}
                        className="size-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all disabled:opacity-50"
                        title="Delete Card"
                      >
                        {deletingId === card._id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 dark:border-slate-800">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Annual Fee</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">₹{card.fees.annualFee}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Min Income</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">Applied</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {card.category.slice(0, 2).map(cat => (
                        <span key={cat} className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-md text-[8px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 dark:border-slate-700">
                          {cat}
                        </span>
                      ))}
                    </div>
                    <Link 
                      to={`/card/${card._id}`} 
                      target="_blank" 
                      className="text-slate-400 hover:text-primary transition-colors p-1"
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!isLoading && (
        <Pagination
          currentPage={currentPage}
          totalPage={Math.ceil(totalCards / limit)}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

