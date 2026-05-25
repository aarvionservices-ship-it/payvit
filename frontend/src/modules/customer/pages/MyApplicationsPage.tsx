import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Filter, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ChevronLeft,
  ChevronRight, 
  Briefcase, 
  CreditCard, 
  Landmark,
  Calendar,
  Search,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLeadsRequest } from '../../../api/lead.api';
import { toast } from 'react-hot-toast';

const getStatusStyles = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'approved':
    case 'converted':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
  }
};

const getStatusIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'approved': 
    case 'converted':
      return <CheckCircle2 className="size-3.5" />;
    case 'rejected': 
      return <XCircle className="size-3.5" />;
    default: 
      return <Clock className="size-3.5" />;
  }
};

const getLeadIconStyles = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'personal':
    case 'personal loan':
      return { icon: Landmark, color: 'text-blue-600', gradient: 'from-blue-500/10 to-indigo-500/10', borderColor: 'border-blue-200/50' };
    case 'business':
    case 'business loan':
      return { icon: Briefcase, color: 'text-purple-600', gradient: 'from-purple-500/10 to-pink-500/10', borderColor: 'border-purple-200/50' };
    case 'home':
    case 'home loan':
      return { icon: Landmark, color: 'text-emerald-600', gradient: 'from-emerald-500/10 to-teal-500/10', borderColor: 'border-emerald-200/50' };
    case 'credit card':
      return { icon: CreditCard, color: 'text-amber-600', gradient: 'from-amber-500/10 to-orange-500/10', borderColor: 'border-amber-200/50' };
    default:
      return { icon: Landmark, color: 'text-slate-600', gradient: 'from-slate-500/10 to-gray-500/10', borderColor: 'border-slate-200/50' };
  }
};

export default function MyApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  useEffect(() => {
    fetchApplications(pagination.page);
  }, [pagination.page]);

  const fetchApplications = async (page: number) => {
    try {
      setLoading(true);
      const response = await getLeadsRequest({ page, limit: pagination.limit });
      if (response && response.success) {
        // Handle both new paginated response and old flat array response for safety
        if (response.data.data && Array.isArray(response.data.data)) {
          setApplications(response.data.data);
          setPagination(prev => ({ ...prev, total: response.data.total }));
        } else {
          setApplications(response.data);
          setPagination(prev => ({ ...prev, total: response.data.length }));
        }
      }
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = applications.filter(app => {
    if (!searchQuery) return true;
    return (
      app.loanType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getStats = () => {
    // Note: These stats are for the CURRENT PAGE if using client-side filtering on paginated results.
    // For a real production app, total stats should come from the server metadata.
    return {
      total: pagination.total,
      approved: applications.filter(a => ['approved', 'converted'].includes(a.status?.toLowerCase())).length,
      pending: applications.filter(a => !['approved', 'converted', 'rejected'].includes(a.status?.toLowerCase())).length,
      rejected: applications.filter(a => a.status?.toLowerCase() === 'rejected').length
    };
  };

  const stats = getStats();
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1"
          >
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">My Applications</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Manage and track your financing requests in real-time.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3"
          >
            <div className="relative group flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white"
              />
            </div>
            <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-primary transition-all shadow-sm active:scale-95">
              <Filter className="size-5" />
            </button>
          </motion.div>
        </div>

        {/* Stats Summary - Desktop Only */}
        <div className="hidden md:grid grid-cols-4 gap-4">
          {[
            { label: 'Total Leads', count: stats.total, icon: <FileText className="size-4" />, color: 'bg-blue-500' },
            { label: 'Approved', count: stats.approved, icon: <CheckCircle2 className="size-4" />, color: 'bg-emerald-500' },
            { label: 'Pending', count: stats.pending, icon: <Clock className="size-4" />, color: 'bg-amber-500' },
            { label: 'Rejected', count: stats.rejected, icon: <XCircle className="size-4" />, color: 'bg-rose-500' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm"
            >
              <div className={`p-2.5 rounded-xl ${stat.color} text-white`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{stat.count}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-10 animate-spin text-primary" />
          </div>
        ) : filteredApps.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
               <FileText className="size-10" />
             </div>
             <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">No applications found</h3>
             <p className="text-sm font-medium text-slate-400">You haven't submitted any applications yet or matching active filters.</p>
           </div>
        ) : (
          <>
            {/* Mobile View: Animated Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
              <AnimatePresence mode="popLayout">
                {filteredApps.map((app, i) => {
                  const style = getLeadIconStyles(app.loanType);
                  const Icon = style.icon;
                  return (
                    <motion.div
                      key={app.leadId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all overflow-hidden active:scale-[0.98]"
                    >
                      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${style.color}`}>
                        <Icon className="size-24 rotate-12" />
                      </div>

                      <div className="flex flex-col h-full relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`size-12 rounded-2xl bg-gradient-to-br ${style.gradient} ${style.color} flex items-center justify-center border ${style.borderColor} shadow-inner`}>
                            <Icon className="size-5" />
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyles(app.status)} shadow-sm`}>
                            {getStatusIcon(app.status)} {app.status || 'Pending'}
                          </span>
                        </div>

                        <div className="mb-6">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors capitalize">{app.loanType}</h3>
                          <div className="flex items-center gap-1.5 mt-1 text-slate-500 dark:text-slate-400 text-sm font-medium">
                            <Landmark className="size-3.5 opacity-50" />
                            PayVit Partner
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                            <Calendar className="size-3.5" />
                            {new Date(app.createdAt).toLocaleDateString()}
                          </div>
                          <Link 
                            to={`/customer/applications/${app.leadId}`}
                            className="size-10 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all group/btn"
                          >
                            <ArrowUpRight className="size-5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Desktop View: Modern Table */}
            <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-6">Offer Portfolio</th>
                    <th className="px-8 py-6 text-center">Current Status</th>
                    <th className="px-8 py-6">Submission Date</th>
                    <th className="px-8 py-6 text-right">Action Center</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredApps.map((app, i) => {
                    const style = getLeadIconStyles(app.loanType);
                    const Icon = style.icon;
                    return (
                      <motion.tr 
                        key={app.leadId} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`size-12 rounded-2xl bg-gradient-to-br ${style.gradient} ${style.color} flex items-center justify-center shrink-0 border ${style.borderColor}`}>
                              <Icon className="size-5 group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors capitalize">{app.loanType || 'Application'}</p>
                              <p className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 mt-1 uppercase tracking-wider"><Landmark className="size-3" /> PayVit Partner</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-wider border ${getStatusStyles(app.status)} shadow-sm`}>
                            <span className="relative flex size-2">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${['new', 'contacted', 'callback'].includes(app.status?.toLowerCase()) ? 'bg-amber-400' : ['approved', 'converted'].includes(app.status?.toLowerCase()) ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                              <span className={`relative inline-flex rounded-full size-2 ${['new', 'contacted', 'callback'].includes(app.status?.toLowerCase()) ? 'bg-amber-500' : ['approved', 'converted'].includes(app.status?.toLowerCase()) ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            </span>
                            {app.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{new Date(app.createdAt).toLocaleDateString()}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confirmed</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <Link 
                            to={`/customer/applications/${app.leadId}`} 
                            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all group/link"
                          >
                            Detail View
                            <div className="size-8 bg-slate-50 dark:bg-slate-800 group-hover/link:bg-primary group-hover/link:text-white rounded-xl flex items-center justify-center transition-all">
                              <ChevronRight className="size-4 group-hover/link:translate-x-0.5 transition-transform" />
                            </div>
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-8 py-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-bold text-slate-500">
                Showing <span className="text-slate-900 dark:text-white">{applications.length}</span> of <span className="text-slate-900 dark:text-white">{pagination.total}</span> applications
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                      className={`size-8 rounded-xl text-xs font-black transition-all ${
                        pagination.page === i + 1 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                  disabled={pagination.page === totalPages}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

