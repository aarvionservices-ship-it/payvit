import { Users, TrendingUp, Target, Briefcase, ArrowUpRight, ArrowDownRight, MoreVertical, Star, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const RECENT_LEADS = [
  {
    id: '1',
    customer: 'Rahul Sharma',
    phone: '+91 98765 43210',
    type: 'Personal Loan',
    assignedTo: 'Amit Kumar',
    assignedInitials: 'AK',
    status: 'In Progress',
    statusType: 'progress',
    initial: 'R',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: '2',
    customer: 'Priya Singh',
    phone: '+91 91234 56789',
    type: 'Credit Card',
    assignedTo: 'Neha Gupta',
    assignedInitials: 'NG',
    status: 'Converted',
    statusType: 'converted',
    initial: 'P',
    color: 'from-emerald-500 to-teal-600'
  }
];

const getStatusStyles = (type: string) => {
  switch (type) {
    case 'progress': return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    case 'converted': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    default: return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
  }
};

export default function AdminDashboardPage() {
   return (
      <div className="space-y-6 lg:space-y-8 pb-10">
         {/* Premium Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="size-12 lg:size-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-6 transition-transform hover:rotate-0">
                  <Star className="size-6 lg:size-7" />
               </div>
               <div>
                  <h1 className="text-xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight uppercase">Control Hub</h1>
                  <p className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time Platform Intelligence</p>
               </div>
            </div>
            <div className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] lg:text-xs font-black text-slate-600 dark:text-slate-400 shadow-sm flex items-center gap-2">
               <Calendar className="size-4 text-primary" /> Last 30 Cycles
            </div>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              { label: 'Total Leads', count: '1,284', icon: Target, color: 'blue', trend: '+12.5%', type: 'up' },
              { label: 'Conversions', count: '456', icon: TrendingUp, color: 'emerald', trend: '+5.2%', type: 'up' },
              { label: 'Employees', count: '24', icon: Users, color: 'purple', trend: '-2.1%', type: 'down' },
              { label: 'Conv. Rate', count: '35.5%', icon: Briefcase, color: 'amber', trend: '0%', type: 'stable' },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <stat.icon className="size-16 lg:size-20" />
                </div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                   <div className={`size-10 lg:size-12 bg-gradient-to-br transition-all rounded-xl flex items-center justify-center text-white shadow-lg ${
                      stat.color === 'blue' ? 'from-blue-500 to-indigo-600 shadow-blue-500/20' :
                      stat.color === 'emerald' ? 'from-emerald-400 to-teal-500 shadow-emerald-500/20' :
                      stat.color === 'purple' ? 'from-purple-500 to-pink-500 shadow-purple-500/20' :
                      'from-amber-400 to-orange-500 shadow-amber-500/20'
                   }`}>
                      <stat.icon className="size-5 lg:size-6" />
                   </div>
                   <span className={`px-2 py-0.5 rounded-lg text-[9px] lg:text-[10px] font-black flex items-center gap-1 border ${
                      stat.type === 'up' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                      stat.type === 'down' ? 'text-rose-600 bg-rose-50 border-rose-100' :
                      'text-slate-500 bg-slate-50 border-slate-100'
                   }`}>
                      {stat.trend} {stat.type === 'up' ? <ArrowUpRight className="size-3" /> : stat.type === 'down' ? <ArrowDownRight className="size-3" /> : null}
                   </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] lg:text-xs font-black uppercase tracking-widest relative z-10">{stat.label}</p>
                <h3 className="text-2xl lg:text-3xl font-black mt-1 text-slate-900 dark:text-white relative z-10">{stat.count}</h3>
              </motion.div>
            ))}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Momentum Trend */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                     <div className="size-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
                        <TrendingUp className="size-5" />
                     </div>
                     <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Leads Momentum</h2>
                  </div>
               </div>
               <div className="flex-1 min-h-[200px] bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <p className="text-slate-400 font-bold text-xs flex items-center gap-2">
                     <TrendingUp className="size-4" /> [ Live Momentum Visualization Placeholder ]
                  </p>
               </div>
            </div>

            {/* Elite Assets */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
               <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
                     <Star className="size-5 fill-amber-500" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Elite Loans</h2>
               </div>
               <div className="space-y-3">
                  {[
                    { name: 'Axis Personal Loan', id: 'A', count: 142, color: 'blue' },
                    { name: 'SBI Home Loan', id: 'S', count: 98, color: 'purple' }
                  ].map((loan) => (
                    <div key={loan.name} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-primary/20 transition-all">
                       <div className="flex justify-between items-start mb-2">
                          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-3">
                             <div className={`size-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                                loan.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                             }`}>{loan.id}</div>
                             <span className="truncate">{loan.name}</span>
                          </h3>
                          <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">Active</span>
                       </div>
                       <div className="flex justify-between items-center text-xs mt-3">
                          <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Conversions</span>
                          <span className="font-black text-primary">{loan.count}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Recent Feed */}
         <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="size-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center">
                     <Users className="size-5" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Recent Ingress</h2>
               </div>
               <Link to="/admin/leads" className="text-[10px] font-black text-primary hover:text-white hover:bg-primary bg-primary/5 px-4 py-2 rounded-xl transition-all uppercase tracking-widest">Monitor Deck</Link>
            </div>

            {/* Distributed Feed - Mobile Cards */}
            <div className="lg:hidden p-4 space-y-4">
               {RECENT_LEADS.map((lead) => (
                 <motion.div 
                   key={lead.id}
                   whileHover={{ scale: 1.01 }}
                   className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group active:bg-slate-50 transition-all"
                 >
                    <div className="flex items-center gap-4">
                       <div className={`size-12 bg-gradient-to-br ${lead.color} text-white rounded-xl flex items-center justify-center font-black shadow-lg group-hover:rotate-6 transition-transform text-base`}>
                          {lead.initial}
                       </div>
                       <div>
                          <h4 className="font-black text-sm text-slate-900 dark:text-white tracking-tight leading-none">{lead.customer}</h4>
                          <div className="flex items-center gap-2 mt-2">
                             <div className="size-5 rounded-md bg-white dark:bg-slate-700 flex items-center justify-center text-[7px] font-black text-slate-500 shadow-sm border border-slate-100 dark:border-slate-600">{lead.assignedInitials}</div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{lead.assignedTo.split(' ')[0]}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className={`px-2.5 py-1 rounded-full text-[8px] font-black border ${getStatusStyles(lead.statusType)} uppercase tracking-widest shadow-sm`}>
                          {lead.status}
                       </span>
                       <ChevronRight className="size-4 text-slate-200 dark:text-slate-700 group-hover:text-primary transition-colors" />
                    </div>
                 </motion.div>
               ))}
            </div>

            {/* Desktop Interface */}
            <div className="hidden lg:block overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                        <th className="px-8 py-6">Identity</th>
                        <th className="px-8 py-6">Asset classification</th>
                        <th className="px-8 py-6">Custodian</th>
                        <th className="px-8 py-6">State</th>
                        <th className="px-8 py-6 text-right">Utility</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {RECENT_LEADS.map((lead) => (
                       <tr key={lead.id} className="hover:bg-primary/[0.02] dark:hover:bg-primary/5 transition-all group cursor-pointer">
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-4">
                                <div className={`size-10 bg-gradient-to-br ${lead.color} text-white rounded-xl flex items-center justify-center font-black shadow-md group-hover:scale-110 transition-transform text-xs`}>
                                   {lead.initial}
                                </div>
                                <div>
                                   <span className="font-black text-slate-900 dark:text-white text-sm group-hover:text-primary transition-colors leading-none tracking-tight">{lead.customer}</span>
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{lead.phone}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest italic">{lead.type}</span>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                <div className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[9px] font-black text-slate-500 shadow-sm">
                                   {lead.assignedInitials}
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{lead.assignedTo}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusStyles(lead.statusType)} shadow-sm`}>
                                {lead.status}
                             </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button className="p-2 text-slate-300 hover:text-primary transition-all">
                                <MoreVertical className="size-5" />
                             </button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
}

