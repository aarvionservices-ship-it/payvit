import { Search, Plus, Filter, Landmark, Edit2, Globe, ArrowUpRight, Trash2, Loader2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getLoans, deleteLoan } from '../../../api/loan.api';
import type { LoanModel } from '../../../types';
import toast from 'react-hot-toast';
import Pagination from '../../../components/Pagination';

const getStatusStyles = (type: string) => {
  switch (type) {
    case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    case 'inactive': return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
    default: return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
  }
};

const getCategoryStyles = (type: string) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('personal')) return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
  if (t.includes('home')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
  if (t.includes('car')) return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
  if (t.includes('business')) return 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400';
  return 'bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400';
};

export default function LoansPage() {
  const [loans, setLoans] = useState<LoanModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalLoans, setTotalLoans] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(8);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    bank: "all"
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchLoans = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page: currentPage,
        limit,
        search: searchQuery || undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        bankName: filters.bank !== 'all' ? filters.bank : undefined,
        status: filters.status !== 'all' ? filters.status : undefined
      };
      const response = await getLoans(params);
      if (response.success) {
        setLoans(response.data?.data || []);
        setTotalLoans(response.data?.total || 0);
      } else {
        toast.error(response.message || 'Failed to fetch loans');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [currentPage, searchQuery, filters]);

  const activeFilterCount = (filters.category !== "all" ? 1 : 0) + (filters.bank !== "all" ? 1 : 0) + (filters.status !== "all" ? 1 : 0);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    
    const response = await deleteLoan(id);
    if (response.success) {
      toast.success(`${name} deleted successfully`);
      setLoans(loans.filter(l => l._id !== id));
    } else {
      toast.error(response.message || 'Failed to delete loan');
    }
  };


  return (
    <div className="px-4 lg:px-0 space-y-6 lg:space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Loan Portfolio</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.4em] mt-1">Management Registry</p>
        </div>
        <Link 
          to="/admin/loans/create" 
          className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 group"
        >
          <Plus className="size-4 group-hover:rotate-90 transition-transform" /> Add New Asset
        </Link>
      </div>

      {/* Filter Hub */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col lg:row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search within loan registry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl py-4 pl-14 pr-6 text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/10 transition-all placeholder:opacity-50"
          />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto relative">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`flex-1 lg:flex-none p-4 border rounded-2xl transition-all relative flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest ${showFilters ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
             {isLoading ? (
               <Loader2 className="size-4 animate-spin" />
             ) : (
               <Filter className="size-4" />
             )}
             <span className="hidden lg:inline">Filter Index</span>
             {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 size-5 bg-rose-500 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950 font-black">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button className="flex-1 lg:flex-none p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm">
            <Download className="size-5 mx-auto" />
          </button>

          <AnimatePresence>
            {showFilters && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowFilters(false)}
                  className="fixed lg:absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-[99]"
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="fixed lg:absolute bottom-0 lg:bottom-auto lg:top-full left-0 right-0 lg:left-auto lg:right-0 mt-0 lg:mt-4 w-full lg:w-80 bg-white dark:bg-slate-900 border-t lg:border border-slate-200 dark:border-slate-800 rounded-t-[2.5rem] lg:rounded-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.1),0_20px_50px_rgba(0,0,0,0.1)] z-[100] p-6 lg:p-5 space-y-6 lg:space-y-4"
                >
                  <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-2 lg:hidden" />
                  
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 px-1">Asset Allocation</label>
                    <div className="grid grid-cols-2 gap-2">
                       {['Personal Loan', 'Business Loan', 'Home Loan', 'Car Loan', 'Education Loan', 'Gold Loan'].map((cat) => (
                         <button
                           key={cat}
                           onClick={() => setFilters(prev => ({ ...prev, category: filters.category === cat ? 'all' : cat }))}
                           className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filters.category === cat ? 'bg-primary text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500'}`}
                         >
                           {cat.split(' ')[0]}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 px-1">Lending Partners</label>
                    <select 
                      value={filters.bank}
                      onChange={(e) => setFilters(prev => ({ ...prev, bank: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="all">All Financial Institutions</option>
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="SBI">State Bank of India</option>
                      <option value="Axis Bank">Axis Bank</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <button 
                      onClick={() => {
                        setFilters({ status: "all", category: "all", bank: "all" });
                        setCurrentPage(1);
                        setShowFilters(false);
                      }}
                      className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] px-2 hover:opacity-70 transition-all"
                    >
                      Reset Focus
                    </button>
                    <button 
                      onClick={() => setShowFilters(false)}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 lg:hidden"
                    >
                      Apply Filters
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Loans Cards - Mobile */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
        <AnimatePresence mode="popLayout">
          {loans.map((loan, i) => (
            <motion.div
              key={loan._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group active:scale-[0.98] transition-all"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-white dark:border-slate-800 shadow-lg group-hover:-rotate-12 transition-transform">
                  <Landmark className="size-7" />
                </div>
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusStyles('active')} shadow-sm`}>
                  Active
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tighter mb-1 truncate">{loan.loanName}</h3>
                <p className="text-[10px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest opacity-70">
                   <Globe className="size-3.5" /> {loan.bankName}
                </p>
              </div>

              <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Max Capital Exposure</span>
                    <span className="text-lg font-black text-primary">
                      {loan.loanAmount.max >= 10000000 
                        ? `₹${(loan.loanAmount.max / 10000000).toFixed(1)} Cr` 
                        : `₹${(loan.loanAmount.max / 100000).toFixed(1)} L`}
                    </span>
                 </div>
                 <div className="flex gap-2">
                    <Link to={`/admin/loans/edit/${loan._id}`} className="size-10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all shadow-sm">
                       <Edit2 className="size-4" />
                    </Link>
                    <button 
                      onClick={() => handleDelete(loan._id, loan.loanName)}
                      className="size-10 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-lg flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                    >
                       <Trash2 className="size-4" />
                    </button>
                 </div>
              </div>

              <div className="mt-8 flex items-center justify-between px-1">
                 <span className={`inline-block whitespace-nowrap px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${getCategoryStyles(loan.category)} shadow-inner`}>
                    {loan.category || 'Uncategorized'}
                 </span>
                 <ArrowUpRight className="size-4 text-slate-200 dark:text-slate-700" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Desktop Master Deck */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
              <th className="px-8 py-6">Loan Product</th>
              <th className="px-8 py-6">Max Amount</th>
              <th className="px-8 py-6">Category</th>
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              [1,2,3].map(i => (
                <tr key={i}>
                  <td colSpan={5} className="px-8 py-10 text-center text-slate-400 font-bold">Loading assets...</td>
                </tr>
              ))
            ) : loans.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="size-10 text-slate-200" />
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No records found</p>
                  </div>
                </td>
              </tr>
            ) : (
              loans.map((loan: LoanModel) => (
                <tr key={loan._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-white dark:border-slate-800 shadow-md group-hover:rotate-6 transition-transform">
                        <Landmark className="size-6" />
                      </div>
                      <div>
                        <span className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-all text-base tracking-tight leading-none">{loan.loanName}</span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5 opacity-70 leading-none">
                           <Globe className="size-3" /> {loan.bankName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-black text-primary text-xl tracking-tighter">
                      {loan.loanAmount.max >= 10000000 
                        ? `₹${(loan.loanAmount.max / 10000000).toFixed(1)} Cr` 
                        : `₹${(loan.loanAmount.max / 100000).toFixed(1)} L`}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                     <span className={`inline-block whitespace-nowrap px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getCategoryStyles(loan.category)} shadow-sm border border-slate-100/50 dark:border-slate-800/50`}>
                        {loan.category || 'Uncategorized'}
                     </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles('active')} shadow-sm`}>
                      Active
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        to={`/admin/loans/edit/${loan._id}`}
                        className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:text-primary transition-all shadow-sm border border-slate-100 dark:border-slate-700"
                      >
                        <Edit2 className="size-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(loan._id, loan.loanName)}
                        className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-400 hover:text-rose-600 transition-all rounded-xl border border-rose-100/50 dark:border-rose-500/20"
                      >
                         <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPage={Math.ceil(totalLoans / limit)}
        isLoading={isLoading}
        onPageChange={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}

