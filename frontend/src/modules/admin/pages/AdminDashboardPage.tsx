import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Briefcase, 
  ArrowUpRight, 
  ArrowDownRight, 
  MoreVertical, 
  Star, 
  Calendar, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { getAdminDashboardRequest, getEmployeesRequest, getAnalyticsRequest } from '../../../api/admin.api';
import { getLeadsRequest } from '../../../api/lead.api';
import { toast } from 'react-hot-toast';

const getStatusStyles = (type: string) => {
  switch (type) {
    case 'progress': return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    case 'converted': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
    default: return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
  }
};

const getStatusType = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'converted': return 'converted';
    case 'rejected': return 'rejected';
    case 'new': return 'new';
    default: return 'progress';
  }
};

const getInitials = (name: string) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
};

const getLeadTypeDetails = (loanType: string) => {
  switch (loanType?.toLowerCase()) {
    case 'personal': return { label: 'Personal Loan', initial: 'P', color: 'from-blue-500 to-indigo-600' };
    case 'business': return { label: 'Business Loan', initial: 'B', color: 'from-amber-400 to-orange-500' };
    case 'home': return { label: 'Home Loan', initial: 'H', color: 'from-emerald-400 to-teal-500' };
    case 'credit_card': return { label: 'Credit Card', initial: 'C', color: 'from-purple-500 to-pink-500' };
    default: return { label: 'General Loan', initial: 'L', color: 'from-slate-500 to-slate-600' };
  }
};

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leadsTrend, setLeadsTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, leadsRes, empRes, analyticsRes] = await Promise.all([
        getAdminDashboardRequest(),
        getLeadsRequest({ limit: 5, sort: "-createdAt" }),
        getEmployeesRequest({ limit: 100 }),
        getAnalyticsRequest({ days: 7 })
      ]);

      if (dashRes.success) {
        setDashboardData(dashRes.data);
      }
      if (leadsRes.success) {
        setRecentLeads(leadsRes.data?.data || leadsRes.data || []);
      }
      if (empRes.success) {
        setEmployees(empRes.data?.data || empRes.data || []);
      }
      if (analyticsRes.success) {
        setLeadsTrend(analyticsRes.data?.leadsTrend || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const employeesMap = useMemo(() => {
    const map: Record<string, any> = {};
    employees.forEach(emp => {
      map[emp.userId] = emp;
    });
    return map;
  }, [employees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const totalLeads = dashboardData?.totalLeads ?? 0;
  const conversions = dashboardData?.converted ?? 0;
  const totalEmployees = dashboardData?.totalEmployees ?? employees.length;
  const conversionRate = totalLeads > 0 ? ((conversions / totalLeads) * 100).toFixed(1) + "%" : "0.0%";

  const loanTypeBreakdown = dashboardData?.loanTypeBreakdown || [];

  return (
    <div className="space-y-6 lg:space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-11 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md">
            <Star className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time stats, leads momentum, and recent platform activity.</p>
          </div>
        </div>
        <div className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 shadow-sm flex items-center gap-2 w-fit">
          <Calendar className="size-4 text-blue-600" /> Last 30 Days
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Total Leads', count: totalLeads, icon: Target, color: 'blue', trend: '+12.5%', type: 'up' },
          { label: 'Conversions', count: conversions, icon: TrendingUp, color: 'emerald', trend: '+5.2%', type: 'up' },
          { label: 'Employees', count: totalEmployees, icon: Users, color: 'purple', trend: '-2.1%', type: 'down' },
          { label: 'Conv. Rate', count: conversionRate, icon: Briefcase, color: 'amber', trend: '0%', type: 'stable' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <stat.icon className="size-16 lg:size-20" />
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
               <div className={`size-10 bg-gradient-to-br transition-all rounded-xl flex items-center justify-center text-white shadow-lg ${
                  stat.color === 'blue' ? 'from-blue-500 to-indigo-600 shadow-blue-500/20' :
                  stat.color === 'emerald' ? 'from-emerald-400 to-teal-500 shadow-emerald-500/20' :
                  stat.color === 'purple' ? 'from-purple-500 to-pink-500 shadow-purple-500/20' :
                  'from-amber-400 to-orange-500 shadow-amber-500/20'
               }`}>
                  <stat.icon className="size-5" />
               </div>
               <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1 border ${
                  stat.type === 'up' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                  stat.type === 'down' ? 'text-rose-600 bg-rose-50 border-rose-100' :
                  'text-slate-500 bg-slate-50 border-slate-100'
               }`}>
                  {stat.trend} {stat.type === 'up' ? <ArrowUpRight className="size-3" /> : stat.type === 'down' ? <ArrowDownRight className="size-3" /> : null}
               </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium relative z-10">{stat.label}</p>
            <h3 className="text-2xl lg:text-3xl font-bold mt-1 text-slate-900 dark:text-white relative z-10">{stat.count}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Momentum Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                 <div className="size-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="size-5" />
                 </div>
                 <h2 className="text-base font-bold text-slate-900 dark:text-white">Leads Momentum</h2>
              </div>
           </div>
           <div className="flex-1 min-h-[200px] bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-center">
              {leadsTrend.length > 0 ? (
                 <div className="space-y-3 w-full">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                       <span>Date</span>
                       <span>Leads Created</span>
                    </div>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto">
                       {leadsTrend.map((t) => (
                          <div key={t._id} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800/60 pb-1.5 last:border-0 last:pb-0">
                             <span className="text-slate-600 dark:text-slate-400 font-medium">{t._id}</span>
                             <span className="text-slate-900 dark:text-white font-bold">{t.count}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              ) : (
                 <p className="text-slate-400 font-medium text-sm flex items-center gap-2 justify-center">
                    <TrendingUp className="size-4" /> Live Momentum Visualization Placeholder
                 </p>
              )}
           </div>
        </div>

        {/* Top Performing Loans */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
           <div className="flex items-center gap-3 mb-4">
              <div className="size-10 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
                 <Star className="size-5 fill-amber-500 text-amber-500" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Top Performing Loans</h2>
           </div>
           <div className="space-y-3">
              {loanTypeBreakdown.length > 0 ? (
                 loanTypeBreakdown.map((loan: any) => {
                    const typeInfo = getLeadTypeDetails(loan._id);
                    return (
                       <div key={loan._id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 group hover:border-blue-500/20 transition-all">
                          <div className="flex justify-between items-start mb-2">
                             <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <div className={`size-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                   typeInfo.color.includes('emerald') ? 'bg-emerald-100 text-emerald-600' :
                                   typeInfo.color.includes('amber') ? 'bg-amber-100 text-amber-600' :
                                   typeInfo.color.includes('purple') ? 'bg-purple-100 text-purple-600' :
                                   'bg-blue-100 text-blue-600'
                                }`}>{typeInfo.initial}</div>
                                <span className="truncate capitalize">{typeInfo.label}</span>
                             </h3>
                             <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">Active</span>
                          </div>
                          <div className="flex justify-between items-center text-xs mt-3">
                             <span className="text-slate-500 font-medium">Conversions</span>
                             <span className="font-semibold text-blue-600 dark:text-blue-400">{loan.count}</span>
                          </div>
                       </div>
                    );
                 })
              ) : (
                 <div className="text-center py-6 text-slate-400 text-sm">
                    No conversion details found
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
           <div className="flex items-center gap-3">
              <div className="size-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center">
                 <Users className="size-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Leads</h2>
           </div>
           <Link to="/admin/leads" className="text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-all">View All Leads</Link>
        </div>

        {/* Recent Leads - Mobile Cards */}
        <div className="lg:hidden p-4 space-y-3">
           {recentLeads.length > 0 ? (
              recentLeads.map((lead) => {
                 const typeInfo = getLeadTypeDetails(lead.loanType);
                 const assignedUser = employeesMap[lead.assignedEmployee];
                 const assignedInit = assignedUser ? getInitials(assignedUser.name) : "UN";
                 const assignedName = assignedUser ? assignedUser.name.split(' ')[0] : "Unassigned";

                 return (
                    <motion.div 
                      key={lead.leadId}
                      whileHover={{ scale: 1.01 }}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100/80 dark:border-slate-800 flex items-center justify-between group active:bg-slate-50 transition-all"
                    >
                       <div className="flex items-center gap-3">
                          <div className={`size-10 bg-gradient-to-br ${typeInfo.color} text-white rounded-lg flex items-center justify-center font-semibold shadow-md group-hover:rotate-6 transition-transform text-sm`}>
                             {typeInfo.initial}
                          </div>
                          <div>
                             <h4 className="font-semibold text-sm text-slate-900 dark:text-white tracking-tight leading-none">{lead.customerName}</h4>
                             <div className="flex items-center gap-2 mt-2">
                                <div className="size-5 rounded bg-white dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-550 shadow-sm border border-slate-100 dark:border-slate-600">{assignedInit}</div>
                                <span className="text-xs text-slate-500 capitalize">{assignedName}</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex flex-col items-end gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusStyles(getStatusType(lead.status))} shadow-sm`}>
                             {lead.status}
                          </span>
                          <ChevronRight className="size-4 text-slate-350 dark:text-slate-700 group-hover:text-blue-600 transition-colors" />
                       </div>
                    </motion.div>
                 );
              })
           ) : (
              <div className="text-center py-6 text-slate-400 text-sm">
                 No recent leads found
              </div>
           )}
        </div>

        {/* Desktop Leads Interface */}
        <div className="hidden lg:block overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-3.5">Lead Details</th>
                    <th className="px-6 py-3.5">Lead Type</th>
                    <th className="px-6 py-3.5">Assigned To</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {recentLeads.length > 0 ? (
                    recentLeads.map((lead) => {
                       const typeInfo = getLeadTypeDetails(lead.loanType);
                       const assignedUser = employeesMap[lead.assignedEmployee];
                       const assignedInit = assignedUser ? getInitials(assignedUser.name) : "UN";
                       const assignedName = assignedUser ? assignedUser.name : "Unassigned";

                       return (
                          <tr key={lead.leadId} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/30 transition-all group cursor-pointer">
                             <td className="px-6 py-3.5">
                                <div className="flex items-center gap-3">
                                   <div className={`size-8 bg-gradient-to-br ${typeInfo.color} text-white rounded-lg flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform text-xs`}>
                                      {typeInfo.initial}
                                   </div>
                                   <div>
                                      <span className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 transition-colors block leading-none">{lead.customerName}</span>
                                      <p className="text-xs text-slate-500 mt-1 font-normal">{lead.phone}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-3.5">
                                <span className="text-xs font-semibold text-slate-650 dark:text-slate-400 capitalize">{typeInfo.label}</span>
                             </td>
                             <td className="px-6 py-3.5">
                                <div className="flex items-center gap-2.5">
                                   <div className="size-6 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                                      {assignedInit}
                                   </div>
                                   <span className="text-xs text-slate-705 dark:text-slate-300 font-medium">{assignedName}</span>
                                </div>
                             </td>
                             <td className="px-6 py-3.5">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(getStatusType(lead.status))} shadow-sm`}>
                                   {lead.status}
                                </span>
                             </td>
                             <td className="px-6 py-3.5 text-right">
                                <Link to={`/admin/leads`} className="inline-block p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all">
                                   <MoreVertical className="size-4" />
                                </Link>
                             </td>
                          </tr>
                       );
                    })
                 ) : (
                    <tr>
                       <td colSpan={5} className="text-center py-8 text-slate-400 text-sm">
                          No recent leads found
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
