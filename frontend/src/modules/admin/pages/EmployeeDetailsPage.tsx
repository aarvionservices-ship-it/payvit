import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  Calendar, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  ChevronRight, 
  XCircle, 
  Search, 
  FileText
} from 'lucide-react';
import { getEmployeeByIdRequest } from '../../../api/admin.api';
import { getLeadsRequest } from '../../../api/lead.api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const getLeadStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'new': 
      return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    case 'assigned': 
      return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
    case 'contacted': 
      return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    case 'interested': 
      return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    case 'callback': 
      return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
    case 'in-progress': 
      return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30';
    case 'converted': 
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
    case 'rejected': 
      return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30';
    default: 
      return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
  }
};

export default function EmployeeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'converted' | 'rejected' | 'active'>('all');

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, leadsRes] = await Promise.all([
        getEmployeeByIdRequest(id!),
        getLeadsRequest({ assignedEmployee: id!, limit: 100 })
      ]);

      if (empRes.success) {
        setEmployee(empRes.data || empRes);
      }
      
      if (leadsRes.success) {
        setLeads(leadsRes.data?.data || leadsRes.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load employee dossier');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  // Metrics computation
  const stats = useMemo(() => {
    const total = leads.length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const rejected = leads.filter(l => l.status === 'rejected').length;
    const active = total - converted - rejected;
    const successRate = total > 0 ? ((converted / total) * 100).toFixed(1) + '%' : '0%';
    
    return { total, converted, rejected, active, successRate };
  }, [leads]);

  // Frontend filter for search and status tabs
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // 1. Tab filtering
      if (activeTab === 'converted' && lead.status !== 'converted') return false;
      if (activeTab === 'rejected' && lead.status !== 'rejected') return false;
      if (activeTab === 'active' && ['converted', 'rejected'].includes(lead.status)) return false;

      // 2. Search query filtering
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = lead.customerName?.toLowerCase().includes(query);
        const matchesPhone = lead.phone?.includes(query);
        const matchesEmail = lead.email?.toLowerCase().includes(query);
        const matchesProduct = lead.loanType?.toLowerCase().includes(query);
        const matchesStatus = lead.status?.toLowerCase().includes(query);

        return matchesName || matchesPhone || matchesEmail || matchesProduct || matchesStatus;
      }

      return true;
    });
  }, [leads, activeTab, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retrieving Personnel Dossier...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6">
        <XCircle className="size-16 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Personnel Record Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center max-w-md">
          The requested user record could not be found or has been purged from the system registry.
        </p>
        <Link to="/admin/employees" className="mt-4 bg-primary text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
          Return to directory
        </Link>
      </div>
    );
  }

  return (
    <main className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12">
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/admin/employees')}
          className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white leading-none">Personnel Details</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Operational view and assigned leads history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-6 lg:p-8 space-y-6 flex flex-col justify-between">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="size-24 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-3xl border border-white dark:border-slate-800 shadow-lg overflow-hidden relative">
              {employee.profileImage ? (
                <img src={employee.profileImage} alt={employee.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(employee.name)
              )}
              <div className={`absolute bottom-0 right-0 size-3 border-2 border-white dark:border-slate-900 rounded-full ${employee.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{employee.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-1">{employee.role}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border shadow-sm ${employee.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
              {employee.isActive ? 'Active' : 'Locked'}
            </span>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/60">
              <Mail className="size-4 text-primary shrink-0" />
              <span className="truncate">{employee.email}</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/60">
              <Phone className="size-4 text-primary shrink-0" />
              <span>{employee.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/60">
              <Calendar className="size-4 text-primary shrink-0" />
              <span>Joined {new Date(employee.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Metrics & Leads List */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          {/* Dynamic Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Target className="size-4" />
                </div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Leads</p>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</h3>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CheckCircle2 className="size-4" />
                </div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Conversions</p>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.converted}</h3>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                  <TrendingUp className="size-4" />
                </div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Conversion Rate</p>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.successRate}</h3>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/5 to-transparent rounded-bl-full pointer-events-none" />
            </div>
          </div>

          {/* Assigned Leads Table/Filter Container */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Assigned Leads Registry</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit trail of customer applications</p>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all placeholder:opacity-50"
                  />
                </div>
              </div>

              {/* Filtering tabs */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                {[
                  { id: 'all', label: 'All Leads', count: stats.total },
                  { id: 'converted', label: 'Converted', count: stats.converted, color: 'text-emerald-600 bg-emerald-500/5 border-emerald-500/10' },
                  { id: 'rejected', label: 'Rejected', count: stats.rejected, color: 'text-rose-600 bg-rose-500/5 border-rose-500/10' },
                  { id: 'active', label: 'Active', count: stats.active, color: 'text-blue-600 bg-blue-500/5 border-blue-500/10' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      activeTab === t.id 
                        ? 'bg-primary border-primary text-white shadow-sm' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {t.label}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      activeTab === t.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Leads List/Table */}
            <div className="overflow-x-auto">
              {filteredLeads.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Classification</th>
                      <th className="px-6 py-4">Stage</th>
                      <th className="px-6 py-4">Assigned On</th>
                      <th className="px-6 py-4 text-right">View Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                    <AnimatePresence mode="popLayout">
                      {filteredLeads.map((lead) => (
                        <motion.tr 
                          key={lead.leadId}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">{lead.customerName}</div>
                            <div className="text-[10px] font-medium text-slate-500 mt-0.5">{lead.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              {lead.loanType || lead.productType || 'Cold Calling'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider border whitespace-nowrap ${getLeadStatusStyles(lead.status)}`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-400">
                            {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link 
                              to={`/admin/leads/${lead.leadId}`}
                              className="inline-flex p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all hover:scale-105 active:scale-95 border border-transparent hover:border-primary/10"
                            >
                              <ChevronRight className="size-4" />
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <FileText className="size-10 opacity-30" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No matching leads found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
