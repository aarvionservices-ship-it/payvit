import { useState, useEffect } from 'react';
import { Search, Filter, Users, Phone, Briefcase, CreditCard, Landmark, ChevronRight, MoreVertical, Calendar, UserPlus, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getLeadsRequest } from '../../../api/lead.api';
import { toast } from 'react-hot-toast';

const getStatusStyles = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'new': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    case 'callback': return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    case 'interested': return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
    case 'converted': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
    case 'assigned': return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
    case 'contacted': return 'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20';
    case 'in-progress': return 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20';
    default: return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
  }
};

const getLeadIconStyles = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'personal':
    case 'personal loan':
      return { icon: Landmark, color: 'text-blue-600', gradient: 'from-blue-500/10 to-indigo-500/10' };
    case 'business':
    case 'business loan':
      return { icon: Briefcase, color: 'text-purple-600', gradient: 'from-purple-500/10 to-pink-500/10' };
    case 'home':
    case 'home loan':
      return { icon: Landmark, color: 'text-emerald-600', gradient: 'from-emerald-500/10 to-teal-500/10' };
    case 'credit card':
      return { icon: CreditCard, color: 'text-amber-600', gradient: 'from-amber-500/10 to-orange-500/10' };
    default:
      return { icon: Landmark, color: 'text-slate-600', gradient: 'from-slate-500/10 to-gray-500/10' };
  }
};

const getInitials = (name: string) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
};

export default function LeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all'
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await getLeadsRequest();
      if (response && response.success) {
        const leadsData = response.data?.data || (Array.isArray(response.data) ? response.data : []);
        setLeads(leadsData);
      }
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const searchMatch = !filters.search || 
      lead.customerName?.toLowerCase().includes(filters.search.toLowerCase()) || 
      lead.phone?.toLowerCase().includes(filters.search.toLowerCase());
    
    const statusMatch = filters.status === 'all' || lead.status?.toLowerCase() === filters.status.toLowerCase();
    
    const typeMatch = filters.type === 'all' || lead.loanType?.toLowerCase() === filters.type.toLowerCase();

    return searchMatch && statusMatch && typeMatch;
  });

  const activeFilterCount = (filters.status !== 'all' ? 1 : 0) + (filters.type !== 'all' ? 1 : 0);

  return (
    <div className="space-y-6 lg:space-y-10 pb-20">
      {/* Search and Filters Hub */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative z-20 mx-1 md:mx-0"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <div className="size-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/10 rotate-3">
              <Users className="size-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic leading-none">Pipeline</h1>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Assigned Channel</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
             <div className="relative w-full md:w-64 lg:w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
               <input 
                 type="text" 
                 value={filters.search}
                 onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                 placeholder="Search identifiers..." 
                 className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl py-3.5 pl-12 pr-6 text-[11px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/10 transition-all dark:text-white placeholder:opacity-40"
               />
             </div>
             
             <div className="flex items-center gap-3 w-full sm:w-auto relative">
               <button 
                 onClick={() => setShowFilters(!showFilters)}
                 className={`flex-1 sm:flex-none p-3.5 relative border rounded-2xl transition-all shadow-sm flex items-center justify-center min-w-[50px] ${showFilters ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
               >
                 <Filter className="size-5" />
                 {activeFilterCount > 0 && (
                   <span className="absolute -top-1 -right-1 size-5 bg-rose-500 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950 font-black">
                     {activeFilterCount}
                   </span>
                 )}
               </button>

               <button 
                 onClick={() => navigate('/employee/leads/create')}
                 className="flex-[2] sm:flex-none px-6 py-3.5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <UserPlus className="size-4" /> New Lead
               </button>

               <AnimatePresence>
                 {showFilters && (
                   <>
                     {/* Mobile Backdrop */}
                     <motion.div 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       onClick={() => setShowFilters(false)}
                       className="fixed md:hidden inset-0 bg-slate-900/40 backdrop-blur-sm z-[99]"
                     />

                     <motion.div
                       initial={{ opacity: 0, y: 20, scale: 0.95 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, y: 20, scale: 0.95 }}
                       className="fixed md:absolute bottom-0 md:bottom-auto md:top-full left-0 right-0 md:left-auto md:right-0 mt-0 md:mt-4 w-full md:w-72 bg-white dark:bg-slate-900 border-t md:border border-slate-200 dark:border-slate-800 rounded-t-[2.5rem] md:rounded-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.1),0_20px_50px_rgba(0,0,0,0.1)] z-[100] p-8 md:p-5 space-y-6 md:space-y-4"
                     >
                        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-2 md:hidden" />
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-3 px-1">Lead Lifecycle</label>
                            <select 
                              value={filters.status} 
                              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                              <option value="all">All Channels</option>
                              <option value="new">New Entry</option>
                              <option value="assigned">Assigned</option>
                              <option value="contacted">Contacted</option>
                              <option value="interested">Interested</option>
                              <option value="callback">Callback</option>
                              <option value="in-progress">In-Progress</option>
                              <option value="converted">Converted</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-3 px-1">Portfolio Class</label>
                            <select 
                              value={filters.type} 
                              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                              <option value="all">Any Segment</option>
                              <option value="personal">Personal Loan</option>
                              <option value="business">Business Loan</option>
                              <option value="home">Home Loan</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                          <button onClick={() => { setFilters({ search: filters.search, status: 'all', type: 'all' }); setShowFilters(false); }} className="text-[9px] font-black uppercase tracking-widest text-rose-500 px-2 py-1 hover:opacity-70 transition-all">Clear Focus</button>
                          <button onClick={() => setShowFilters(false)} className="md:hidden px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.1em] rounded-xl shadow-xl shadow-slate-900/10">Apply Focus</button>
                        </div>
                     </motion.div>
                   </>
                 )}
               </AnimatePresence>
             </div>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-10 animate-spin text-primary" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
            <Users className="size-10" />
          </div>
          <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">No leads found</h3>
          <p className="text-sm font-medium text-slate-400">Try adjusting your active filters to see more results.</p>
        </div>
      ) : (
        <>
          {/* Mobile Grid Layout */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 px-1">
            <AnimatePresence>
              {filteredLeads.map((lead, i) => {
                const style = getLeadIconStyles(lead.loanType);
                const Icon = style.icon;
                
                return (
                  <motion.div
                    key={lead.leadId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className={`size-12 rounded-2xl bg-gradient-to-br ${style.gradient} ${style.color} flex items-center justify-center font-black text-xs border border-slate-100 dark:border-slate-800 shadow-inner`}>
                          {getInitials(lead.customerName)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{lead.customerName}</h4>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                            <Phone className="size-3" /> {lead.phone}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest border ${getStatusStyles(lead.status)} shadow-sm`}>
                        {lead.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-400 uppercase tracking-tight flex items-center gap-1.5"><Icon className="size-3.5" /> Product</span>
                          <span className="text-slate-700 dark:text-slate-300 capitalize">{lead.loanType}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-400 uppercase tracking-tight flex items-center gap-1.5"><Calendar className="size-3.5" /> Assigned</span>
                          <span className="text-slate-700 dark:text-slate-300">{new Date(lead.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex gap-2">
                      <Link 
                        to={`/employee/leads/${lead.leadId}`}
                        className="flex-1 bg-primary text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                      >
                        Workspace <ChevronRight className="size-4" />
                      </Link>
                      <button className="size-11 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center hover:bg-slate-100 transition-all active:scale-90">
                        <Phone className="size-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Desktop Table Layout */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden lg:block bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden"
          >
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-10 py-6">Lead Identity</th>
                  <th className="px-10 py-6">Connectivity</th>
                  <th className="px-10 py-6">Portfolio Segment</th>
                  <th className="px-10 py-6">Engagement</th>
                  <th className="px-10 py-6">Timeline</th>
                  <th className="px-10 py-6 text-right">Utility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLeads.map((lead) => {
                  const style = getLeadIconStyles(lead.loanType);
                  const Icon = style.icon;
                  
                  return (
                    <tr key={lead.leadId} className="hover:bg-primary/[0.02] dark:hover:bg-primary/5 transition-colors group cursor-pointer">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`size-12 rounded-2xl bg-gradient-to-br ${style.gradient} ${style.color} flex items-center justify-center font-black text-xs border border-slate-100 dark:border-slate-800 shadow-inner group-hover:rotate-6 transition-transform`}>
                            {getInitials(lead.customerName)}
                          </div>
                          <span className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-all">{lead.customerName}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{lead.phone}</span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                          <Icon className="size-4 opacity-40" /> {lead.loanType || 'N/A'}
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(lead.status)} shadow-sm`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-10 py-6 italic text-[10px] font-bold text-slate-400">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/employee/leads/${lead.leadId}`} className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm">
                              Details
                          </Link>
                          <button className="p-2.5 text-slate-400 hover:text-primary transition-all rounded-xl hover:bg-primary/5">
                              <MoreVertical className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        </>
      )}
    </div>
  );
}

