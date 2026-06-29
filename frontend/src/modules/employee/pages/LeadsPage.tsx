import { useState, useEffect } from 'react';
import { Search, Filter, Users, Phone, Briefcase, CreditCard, Landmark, ChevronRight, Calendar, UserPlus, Loader2 } from 'lucide-react';
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

const getLeadIconStyles = (type: string, leadType?: string) => {
  if (leadType === 'cold_calling') {
    return { icon: Phone, color: 'text-indigo-600', gradient: 'from-indigo-500/10 to-purple-500/10' };
  }
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
      <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative z-20 mx-1 md:mx-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="size-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Users className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-955 dark:text-white">Leads Pipeline</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monitor and manage your assigned leads pipeline</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
             <div className="relative w-full md:w-64 lg:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input 
                  type="text" 
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search leads by name or phone..." 
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl py-2 pl-11 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all text-slate-700 dark:text-slate-200 placeholder:opacity-50"
                />
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto relative">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-1 sm:flex-none p-2 relative border rounded-xl transition-all shadow-sm flex items-center justify-center ${showFilters ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
                >
                  <Filter className="size-4.5" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 size-5 bg-rose-500 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950 font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => navigate('/employee/leads/create')}
                  className="flex-[2] sm:flex-none px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
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
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.98 }}
                        className="fixed md:absolute bottom-0 md:bottom-auto md:top-full left-0 right-0 md:left-auto md:right-0 mt-0 md:mt-3 w-full md:w-72 bg-white dark:bg-slate-900 border-t md:border border-slate-100 dark:border-slate-800 rounded-t-2xl md:rounded-xl shadow-lg z-[100] p-6 md:p-4 space-y-4"
                      >
                         <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-2 md:hidden" />
                        
                        <div className="space-y-4">
                           <div>
                             <label className="text-xs font-semibold text-slate-500 block mb-2 px-1">Lead Lifecycle</label>
                             <select 
                               value={filters.status} 
                               onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
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

                         <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                           <button onClick={() => { setFilters({ search: filters.search, status: 'all', type: 'all' }); setShowFilters(false); }} className="text-xs font-semibold text-rose-500 hover:opacity-75 transition-all">Clear</button>
                           <button onClick={() => setShowFilters(false)} className="md:hidden px-4 py-2 bg-slate-955 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold rounded-lg shadow-sm">Apply</button>
                         </div>
                     </motion.div>
                   </>
                 )}
               </AnimatePresence>
             </div>
          </div>
        </div>
      </div>

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
                const style = getLeadIconStyles(lead.loanType, lead.leadType);
                const Icon = style.icon;
                
                return (
                  <motion.div
                    key={lead.leadId}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm relative overflow-hidden group active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl bg-gradient-to-br ${style.gradient} ${style.color} flex items-center justify-center font-semibold text-xs border border-slate-100 dark:border-slate-800 shadow-sm`}>
                          {getInitials(lead.customerName)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{lead.customerName}</h4>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="size-3" /> {lead.phone}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider border whitespace-nowrap ${getStatusStyles(lead.status)} shadow-sm`}>
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
                    
                    <div className="pt-3 border-t border-slate-50 dark:border-slate-850 flex gap-2">
                      <Link 
                        to={`/employee/leads/${lead.leadId}`}
                        className="flex-1 bg-primary text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-all"
                      >
                        Workspace <ChevronRight className="size-4" />
                      </Link>
                      <button className="size-9 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                        <Phone className="size-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4.5">Customer Profile</th>
                  <th className="px-6 py-4.5">Phone Number</th>
                  <th className="px-6 py-4.5">Classification</th>
                  <th className="px-6 py-4.5">Stage</th>
                  <th className="px-6 py-4.5">Assigned Date</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLeads.map((lead) => {
                  const style = getLeadIconStyles(lead.loanType, lead.leadType);
                  const Icon = style.icon;
                  
                  return (
                    <tr key={lead.leadId} className="transition-colors group cursor-pointer border-b border-slate-100/50 dark:border-slate-800/55 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-850">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`size-9 rounded-xl bg-gradient-to-br ${style.gradient} ${style.color} flex items-center justify-center font-semibold text-xs border border-white dark:border-slate-800 shadow-sm`}>
                            {getInitials(lead.customerName)}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-primary transition-colors">{lead.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{lead.phone}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          <Icon className="size-4 opacity-50" /> {lead.loanType || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider border whitespace-nowrap ${getStatusStyles(lead.status)} shadow-sm`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/employee/leads/${lead.leadId}`} className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-primary border border-slate-100 dark:border-slate-700 rounded-lg text-[11px] font-semibold uppercase tracking-wider hover:bg-primary hover:text-white transition-all">
                              Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

