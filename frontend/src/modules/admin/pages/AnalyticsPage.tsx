import { useState, useEffect } from 'react';
import { BarChart3, PieChart, Activity, Zap, Calendar, Shell, RefreshCw, TrendingUp, Users, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart as RePieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { getAnalyticsRequest } from '../../../api/admin.api';

const COLORS = ['#0055ff', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

export default function AnalyticsPage() {
  const [days, setDays] = useState(7);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchAnalytics();
    // Touch to force refresh
  }, [days]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await getAnalyticsRequest({ days });
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Analytics Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Shell className="size-12 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Synchronizing Global Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-10 pb-20 overflow-x-hidden">
      {/* Dynamic Command Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 p-6 lg:p-10 rounded-3xl sm:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="size-16 hidden sm:flex bg-gradient-to-br from-primary to-blue-600 rounded-2xl items-center justify-center text-white shadow-xl shadow-primary/20 rotate-3">
              <TrendingUp className="size-8" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-4xl font-black tracking-tighter text-slate-900 dark:text-white leading-none uppercase">Market Intelligence</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
                <span className="size-1.5 bg-emerald-500 rounded-full animate-ping" />
                Live Network Performance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center gap-3 w-full sm:w-auto">
                <Calendar className="size-4 text-primary" />
                <select 
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer w-full"
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Quarterly View</option>
               </select>
             </div>
             <button 
               onClick={fetchAnalytics}
               className={`p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:text-primary transition-all ${isLoading ? 'animate-spin' : ''}`}
             >
                <RefreshCw className="size-4" />
             </button>
          </div>
        </div>
      </motion.div>

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Network Leads', value: data?.stats?.totalLeads || 0, icon: Users, color: 'blue' },
          { label: 'Conversions', value: data?.stats?.convertedCount || 0, icon: Target, color: 'emerald' },
          { label: 'Yield Rate', value: `${(data?.stats?.conversionRate || 0).toFixed(1)}%`, icon: Zap, color: 'amber' },
          { label: 'Growth Vector', value: '+12.5%', icon: TrendingUp, color: 'purple' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className={`p-2.5 bg-${stat.color}-500/10 text-${stat.color}-600 rounded-xl w-fit mb-4`}>
              <stat.icon className="size-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 uppercase tracking-tighter">
              {stat.value}
            </h4>
          </motion.div>
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        
        {/* Trend Analysis Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">Acquisition Velocity</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Real-time daily lead volume</p>
            </div>
            <Activity className="size-5 text-primary" />
          </div>
          
          <div className="h-[250px] sm:h-[300px] w-full min-h-[250px]">
            {isMounted && data?.leadsTrend?.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.leadsTrend || []}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0055ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0055ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="_id" 
                  tick={{ fontSize: 9, fontWeight: 900 }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#0055ff" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Distributed Logic (Pie Chart) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">Network Distribution</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Status percentage allocation</p>
            </div>
            <PieChart className="size-5 text-emerald-500" />
          </div>
          
          <div className="h-[250px] sm:h-[300px] w-full min-h-[250px]">
            {isMounted && data?.statusBreakdown?.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={data?.statusBreakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="count"
                  nameKey="_id"
                >
                  {(data?.statusBreakdown || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
              </RePieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Human Capital ROI (Bar Chart) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">Performance Matrix</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Employee-wise conversion efficiency</p>
            </div>
            <BarChart3 className="size-5 text-amber-500" />
          </div>
          
          <div className="h-[300px] sm:h-[400px] w-full min-h-[300px]">
            {isMounted && data?.employeePerformance?.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.employeePerformance || []} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 9, fontWeight: 900 }} 
                  axisLine={false} 
                  tickLine={false} 
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend iconType="rect" wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                <Bar dataKey="totalLeads" name="Assigned Leads" fill="#0055ff" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="converted" name="Converted" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

