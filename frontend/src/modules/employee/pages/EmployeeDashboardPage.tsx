import { 
  Target, 
  PhoneCall, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight,
  Calendar,
  Clock,
  Briefcase,
  CreditCard,
  Landmark
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { getLeadsRequest } from '../../../api/lead.api';
import { toast } from 'react-hot-toast';

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



const getStatusStyles = (type: string) => {
  switch (type) {
    case 'new': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    case 'callback': return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    case 'interested': return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
    default: return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
  }
};

const getStatColorClasses = (color: string) => {
  switch (color) {
    case 'blue': return 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400';
    case 'amber': return 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400';
    case 'emerald': return 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400';
    case 'purple': return 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400';
    default: return 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400';
  }
};

export default function EmployeeDashboardPage() {
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await getLeadsRequest();
        if (res.success && res.data) {
          const leadsData = res.data?.data || (Array.isArray(res.data) ? res.data : []);
          setLeads(leadsData);
        }
      } catch(err) {
        toast.error("Failed to load dashboard data");
      }
    }
    load();
  }, []);

  const RECENT_LEADS = leads.slice(0, 5).map(lead => ({
    id: lead.leadId,
    name: lead.customerName,
    initials: getInitials(lead.customerName),
    type: lead.loanType || 'General',
    status: lead.status || 'New',
    statusType: lead.status?.toLowerCase() || 'new',
    time: new Date(lead.createdAt).toLocaleDateString(),
    icon: getLeadIconStyles(lead.loanType).icon,
    gradient: getLeadIconStyles(lead.loanType).gradient,
    color: getLeadIconStyles(lead.loanType).color
  }));

  const stats = {
    assigned: leads.length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
    efficiency: leads.length > 0 ? ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1) + '%' : '0%'
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Overview of assigned leads and performance status</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 shadow-sm flex items-center gap-2">
            <Calendar className="size-3.5 text-emerald-600" /> Today
          </div>
        </div>
      </motion.div>

      {/* Analytics Recap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Assigned', count: stats.assigned.toString(), icon: Target, color: 'blue', trend: '+12%' },
          { label: 'Contacted', count: stats.contacted.toString(), icon: PhoneCall, color: 'amber', trend: '+5' },
          { label: 'Converted', count: stats.converted.toString(), icon: CheckCircle2, color: 'emerald', trend: '↑' },
          { label: 'Efficiency', count: stats.efficiency, icon: TrendingUp, color: 'purple', trend: 'Good' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden"
          >
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className={`size-8 rounded-lg flex items-center justify-center ${getStatColorClasses(stat.color).split(' ').filter(c => c.startsWith('bg-')).join(' ')}`}>
                  <stat.icon className={`size-4.5 ${getStatColorClasses(stat.color).split(' ').filter(c => c.startsWith('text-')).join(' ')}`} />
                </div>
                <span className="text-xs font-semibold text-emerald-600">{stat.trend}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-505 dark:text-slate-400">{stat.label}</p>
                <h3 className="text-2xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">{stat.count}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads Module */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="size-4.5 text-slate-400" />
              Recent Leads
            </h2>
            <Link to="/employee/leads" className="text-xs font-semibold text-emerald-600 hover:text-emerald-705 flex items-center gap-1 transition-colors">
              View Pipeline <ArrowUpRight className="size-3" />
            </Link>
          </div>

          {/* Mobile Leads Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
            <AnimatePresence>
              {RECENT_LEADS.map((lead, i) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`size-8 rounded-lg bg-gradient-to-br ${lead.gradient} ${lead.color} flex items-center justify-center font-bold text-[10px] border border-slate-100 dark:border-slate-800`}>
                        {lead.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-950 dark:text-white group-hover:text-emerald-600 transition-colors text-sm">{lead.name}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 uppercase">
                          <lead.icon className="size-3" /> {lead.type}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border ${getStatusStyles(lead.statusType)}`}>
                      {lead.status}
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="size-3" /> {lead.time}
                    </div>
                    <Link 
                      to={`/employee/leads/${lead.id}`}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Desktop Leads Layout */}
          <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4">Customer Profile</th>
                  <th className="px-6 py-4">Lead Type</th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4">Time Inflow</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {RECENT_LEADS.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-8 rounded-lg bg-gradient-to-br ${lead.gradient} ${lead.color} flex items-center justify-center font-bold text-[10px] border border-slate-100 dark:border-slate-800`}>
                          {lead.initials}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-450 uppercase tracking-tight">
                        <lead.icon className="size-3.5 opacity-60" /> {lead.type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border ${getStatusStyles(lead.statusType)} shadow-none`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500">{lead.time}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/employee/leads/${lead.id}`} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-650 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Predictive Analytics */}
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="size-4.5 text-slate-405 animate-pulse" />
            Conversion Engine
          </h2>
          <div className="bg-[#0E1320] p-6 rounded-xl border border-slate-850 relative overflow-hidden min-h-[280px] flex flex-col justify-between group shadow-sm">
             <div className="relative z-10">
               <p className="text-emerald-400 font-semibold text-[10px] uppercase tracking-wider mb-2">Live Performance</p>
               <h3 className="text-white text-lg font-bold leading-snug">Your conversion velocity is <span className="text-emerald-400">optimal</span> today.</h3>
             </div>
             <div className="relative z-10 pt-6 border-t border-slate-800">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-slate-400 text-xs font-semibold">Daily Milestone</span>
                 <span className="text-white font-bold text-xs">84%</span>
               </div>
               <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '84%' }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-emerald-550"                 />
               </div>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
