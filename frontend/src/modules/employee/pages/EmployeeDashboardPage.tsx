import { 
  Target, 
  PhoneCall, 
  CheckCircle2, 
  TrendingUp, 
  MoreVertical, 
  ChevronRight,
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
    <div className="space-y-6 lg:space-y-10 pb-20">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5">
          <div className="size-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 text-xl font-black rotate-3">
            E
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">My Workspace</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Performance Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black text-slate-500 dark:text-slate-400 shadow-sm flex items-center gap-2">
            <Calendar className="size-3.5 text-primary" /> Today
          </div>
        </div>
      </motion.div>

      {/* Analytics Recap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Assigned', count: stats.assigned.toString(), icon: Target, color: 'blue', trend: '+12%' },
          { label: 'Contacted', count: stats.contacted.toString(), icon: PhoneCall, color: 'amber', trend: '+5' },
          { label: 'Converted', count: stats.converted.toString(), icon: CheckCircle2, color: 'emerald', trend: 'â†‘' },
          { label: 'Efficiency', count: stats.efficiency, icon: TrendingUp, color: 'purple', trend: 'Good' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all relative overflow-hidden active:scale-95"
          >
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
              <stat.icon className="size-20" />
            </div>
            <div className="relative z-10 flex flex-col gap-4">
              <div className={`size-12 rounded-2xl flex items-center justify-center ${getStatColorClasses(stat.color).split(' ').filter(c => c.startsWith('bg-')).join(' ')}`}>
                <stat.icon className={`size-6 ${getStatColorClasses(stat.color).split(' ').filter(c => c.startsWith('text-')).join(' ')}`} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                  <span className="text-[10px] font-black text-emerald-500">{stat.trend}</span>
                </div>
                <h3 className="text-3xl font-black mt-1 text-slate-900 dark:text-white">{stat.count}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
        {/* Recent Leads Module */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Target className="size-5 text-primary" />
              </div>
              Recent Intelligence
            </h2>
            <Link to="/employee/leads" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
              View All Pipeline <ArrowUpRight className="size-3" />
            </Link>
          </div>

          {/* Mobile Leads Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
            <AnimatePresence>
              {RECENT_LEADS.map((lead, i) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-2xl bg-gradient-to-br ${lead.gradient} ${lead.color} flex items-center justify-center font-black text-[10px] border border-slate-100 dark:border-slate-800 shadow-inner`}>
                        {lead.initials}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{lead.name}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                          <lead.icon className="size-3" /> {lead.type}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest border ${getStatusStyles(lead.statusType)} shadow-sm`}>
                      {lead.status}
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <Clock className="size-3" /> {lead.time}
                    </div>
                    <Link 
                      to={`/employee/leads/${lead.id}`}
                      className="size-10 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all group/btn"
                    >
                      <ChevronRight className="size-5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Desktop Leads Layout */}
          <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-6">Customer Profile</th>
                  <th className="px-8 py-6">Lead Type</th>
                  <th className="px-8 py-6">Current Status</th>
                  <th className="px-8 py-6">Time Inflow</th>
                  <th className="px-8 py-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {RECENT_LEADS.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`size-12 rounded-2xl bg-gradient-to-br ${lead.gradient} ${lead.color} flex items-center justify-center font-black text-xs border border-slate-100 dark:border-slate-800 shadow-inner`}>
                          {lead.initials}
                        </div>
                        <span className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-all">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                        <lead.icon className="size-3.5 opacity-50" /> {lead.type}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(lead.statusType)} shadow-sm`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lead.time}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link to={`/employee/leads/${lead.id}`} className="size-10 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all inline-flex items-center justify-center rounded-xl shadow-sm hover:scale-110">
                        <MoreVertical className="size-4" />
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
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <TrendingUp className="size-5 text-emerald-600" />
            </div>
            Conversion Engine
          </h2>
          <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 dark:from-slate-900 dark:to-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col justify-between group">
             <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-1000">
               <TrendingUp className="size-32 text-white" />
             </div>
             <div className="relative z-10">
               <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] mb-4">Live Performance</p>
               <h3 className="text-white text-2xl font-black leading-tight">Your conversion velocity is <span className="text-emerald-400">optimal</span> today.</h3>
             </div>
             <div className="relative z-10 pt-10 border-t border-white/10">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Daily Milestone</span>
                 <span className="text-white font-black text-xs">84%</span>
               </div>
               <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '84%' }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="h-full bg-emerald-500"
                 />
               </div>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

