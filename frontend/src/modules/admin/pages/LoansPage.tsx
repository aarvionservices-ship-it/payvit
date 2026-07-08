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
  if (t.includes('personal')) return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/25';
  if (t.includes('home')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/25';
  if (t.includes('car')) return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/25';
  if (t.includes('business')) return 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-100 dark:border-purple-500/25';
  return 'bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-200 dark:border-slate-750';
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
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Loans</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage loan offerings, interest rates, lending institutions, and asset portfolios.</p>
        </div>
        <Link 
          to="/admin/loans/create" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm w-fit"
        >
          <Plus className="size-4" /> Add Loan
        </Link>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search within loan registry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all placeholder:opacity-50"
          />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto relative">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`flex-1 lg:flex-none px-4 py-2.5 border rounded-xl transition-all relative flex items-center justify-center gap-2 text-xs font-semibold ${showFilters ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
             {isLoading ? (
               <Loader2 className="size-4 animate-spin" />
             ) : (
               <Filter className="size-4" />
             )}
             <span>Filters</span>
             {activeFilterCount > 0 && (
               <span className="absolute -top-1.5 -right-1.5 size-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-955 font-bold">
                 {activeFilterCount}
               </span>
             )}
          </button>

          <button className="flex-1 lg:flex-none p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm">
            <Download className="size-4 mx-auto" />
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
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="fixed lg:absolute bottom-0 lg:bottom-auto lg:top-full left-0 right-0 lg:left-auto lg:right-0 mt-0 lg:mt-3 w-full lg:w-80 bg-white dark:bg-slate-900 border-t lg:border border-slate-200 dark:border-slate-800 rounded-t-2xl lg:rounded-xl shadow-lg z-[100] p-6 lg:p-5 space-y-5"
                >
                  <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-1 lg:hidden" />
                  
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5 px-1">Categories</label>
                    <div className="grid grid-cols-2 gap-2">
                       {['Personal Loan', 'Business Loan', 'Home Loan', 'Car Loan', 'Education Loan', 'Gold Loan'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setFilters(prev => ({ ...prev, category: filters.category === cat ? 'all' : cat }))}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${filters.category === cat ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 text-slate-500'}`}
                          >
                            {cat}
                          </button>
                       ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5 px-1">Lending Partners</label>
                    <select 
                      value={filters.bank}
                      onChange={(e) => setFilters(prev => ({ ...prev, bank: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-650 dark:text-slate-300 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="all">All Banks</option>
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="SBI">State Bank of India</option>
                      <option value="Axis Bank">Axis Bank</option>
                    </select>
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button 
                      onClick={() => {
                        setFilters({ status: "all", category: "all", bank: "all" });
                        setCurrentPage(1);
                        setShowFilters(false);
                      }}
                      className="text-xs font-bold text-rose-500 px-1 hover:opacity-75 transition-all"
                    >
                      Reset filters
                    </button>
                    <button 
                      onClick={() => setShowFilters(false)}
                      className="bg-slate-955 text-white dark:bg-white dark:text-slate-900 px-5 py-2 rounded-xl text-xs font-semibold shadow-sm lg:hidden"
                    >
                      Close
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
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group active:scale-[0.99] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="size-11 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm group-hover:scale-105 transition-transform">
                  <Landmark className="size-5.5" />
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyles('active')} shadow-sm`}>
                  Active
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate leading-tight capitalize">{loan.loanName}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5">
                   <Globe className="size-3.5 text-blue-600" /> {loan.bankName}
                </p>
              </div>

              <div className="mt-6 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Max Amount</span>
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                      {loan.loanAmount.max >= 10000000 
                        ? `₹${(loan.loanAmount.max / 10000000).toFixed(1)} Cr` 
                        : `₹${(loan.loanAmount.max / 100000).toFixed(1)} L`}
                    </span>
                 </div>
                 <div className="flex gap-2">
                    <Link to={`/admin/loans/edit/${loan._id}`} className="size-9 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-650 dark:text-slate-400 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm">
                       <Edit2 className="size-4" />
                    </Link>
                    <button 
                      onClick={() => handleDelete(loan._id, loan.loanName)}
                      className="size-9 bg-rose-50 border border-rose-100 dark:bg-rose-500/10 text-rose-600 rounded-lg flex items-center justify-center hover:bg-rose-650 hover:text-white transition-all shadow-sm"
                    >
                       <Trash2 className="size-4" />
                    </button>
                 </div>
              </div>

              <div className="mt-5 flex items-center justify-between px-1">
                 <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryStyles(loan.category)} shadow-sm`}>
                    {loan.category || 'Uncategorized'}
                 </span>
                 <ArrowUpRight className="size-4 text-slate-350 dark:text-slate-700 group-hover:text-blue-600 transition-colors" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Desktop Master Deck */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-3.5">Loan Product</th>
              <th className="px-6 py-3.5">Max Amount</th>
              <th className="px-6 py-3.5">Category</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              [1,2,3].map(i => (
                <tr key={i}>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">Loading loans portfolio...</td>
                </tr>
              ))
            ) : loans.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2.5">
                    <Search className="size-8 text-slate-300" />
                    <p className="text-slate-400 font-semibold text-sm">No records found</p>
                  </div>
                </td>
              </tr>
            ) : (
              loans.map((loan: LoanModel) => (
                <tr key={loan._id} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/30 transition-all group cursor-pointer">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center border border-slate-100 dark:border-slate-850 shadow-sm group-hover:scale-105 transition-transform">
                        <Landmark className="size-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors text-sm block leading-none">{loan.loanName}</span>
                        <p className="text-xs text-slate-500 mt-1 font-normal flex items-center gap-1 leading-none capitalize">
                           <Globe className="size-3 text-blue-605" /> {loan.bankName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-bold text-slate-900 dark:text-white text-base">
                      {loan.loanAmount.max >= 10000000 
                        ? `₹${(loan.loanAmount.max / 10000000).toFixed(1)} Cr` 
                        : `₹${(loan.loanAmount.max / 100000).toFixed(1)} L`}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                     <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryStyles(loan.category)} shadow-sm`}>
                        {loan.category || 'Uncategorized'}
                     </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyles('active')} shadow-sm`}>
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        to={`/admin/loans/edit/${loan._id}`}
                        className="size-9 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:text-blue-600 flex items-center justify-center transition-all border border-slate-100 dark:border-slate-700 shadow-sm"
                      >
                        <Edit2 className="size-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(loan._id, loan.loanName)}
                        className="size-9 bg-slate-50 dark:bg-slate-850 text-slate-400 hover:text-rose-650 transition-all rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm"
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
