import { Target, PhoneCall, CheckCircle2, TrendingUp, BarChart3, Calendar, ArrowUpRight, Briefcase, CreditCard, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { getLeadsRequest } from '../../../api/lead.api';
import { toast } from 'react-hot-toast';

const getLeadIconStyles = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'personal':
    case 'personal loan':
      return { icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-500/10' };
    case 'business':
    case 'business loan':
      return { icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-500/10' };
    case 'home':
    case 'home loan':
      return { icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-500/10' };
    case 'credit card':
      return { icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-500/10' };
    default:
      return { icon: Landmark, color: 'text-slate-600', bg: 'bg-slate-500/10' };
  }
};

export default function MyPerformancePage() {
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
        toast.error("Failed to load performance metrics");
      }
    }
    load();
  }, []);

  const totalAssigned = leads.length;
  const contacted = leads.filter(l => l.status === 'contacted').length;
  const conversions = leads.filter(l => l.status === 'converted');
  const conversionRate = totalAssigned > 0 ? ((conversions.length / totalAssigned) * 100).toFixed(1) + '%' : '0%';

  const STATS = [
    { label: 'Total Leads Assigned', value: totalAssigned.toString(), icon: Target, color: 'blue', bg: 'bg-blue-500/10' },
    { label: 'Calls Made (Contacted)', value: contacted.toString(), icon: PhoneCall, color: 'amber', bg: 'bg-amber-500/10' },
    { label: 'Successful Conversions', value: conversions.length.toString(), icon: CheckCircle2, color: 'emerald', bg: 'bg-emerald-500/10' },
    { label: 'Conversion Rate', value: conversionRate, icon: TrendingUp, color: 'purple', bg: 'bg-purple-500/10' },
  ];

  const CONVERSIONS = conversions.slice(0, 4).map(c => ({
    id: c.leadId,
    name: c.customerName,
    type: c.loanType || 'General',
    date: new Date(c.updatedAt || c.createdAt).toLocaleDateString(),
    icon: getLeadIconStyles(c.loanType).icon,
    color: getLeadIconStyles(c.loanType).color,
    bg: getLeadIconStyles(c.loanType).bg
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Performance Metrics</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Overview of your call activities, conversions, and target efficiency tracker</p>
        </div>
        <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm cursor-pointer">
          <option value="30">Last 30 Days</option>
          <option value="7">Last 7 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden"
          >
            <div className="relative z-10 flex flex-col gap-3">
              <div className={`size-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center border border-slate-105 dark:border-slate-800`}>
                <stat.icon className="size-4.5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <h3 className="text-2xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Analysis */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4.5 text-slate-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Performance Trend</h2>
          </div>
          <div className="aspect-[16/9] lg:aspect-auto lg:h-[360px] bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center relative shadow-sm overflow-hidden group">
            <p className="text-slate-350 dark:text-slate-600 font-semibold text-xs uppercase tracking-wider relative z-10 flex items-center gap-2">
              <TrendingUp className="size-4.5" /> Generative Analysis Pending
            </p>
          </div>
        </motion.div>

        {/* Recent Conversions */}
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="size-4.5 text-emerald-600" />
              Conversions
            </h2>
            <Link to="/employee/leads" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
              Pipeline <ArrowUpRight className="size-3" />
            </Link>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {CONVERSIONS.map((conv, i) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`size-9 rounded-lg ${conv.bg} ${conv.color} flex items-center justify-center border border-slate-100 dark:border-slate-800 shrink-0`}>
                      <conv.icon className="size-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors truncate text-sm">{conv.name}</h4>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">{conv.type}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-wider">Success</span>
                      <div className="text-[9px] font-medium text-slate-400 mt-1 flex items-center gap-1 justify-end">
                        <Calendar className="size-3" /> {conv.date}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

