import { useState, useEffect } from 'react';
import { BarChart3, PieChart, Activity, Zap, Calendar, Loader2, RefreshCw, TrendingUp, Users, Target } from 'lucide-react';
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
        <Loader2 className="size-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading analytics dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 overflow-x-hidden">
      {/* Header Panel */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="size-11 hidden sm:flex bg-slate-900 text-white rounded-xl items-center justify-center shadow-md">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">Analytics</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Monitor lead acquisitions, status distribution, and agent performance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 w-full sm:w-auto shadow-sm">
                <Calendar className="size-4 text-blue-600" />
                <select 
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="bg-transparent border-0 text-xs font-semibold text-slate-600 dark:text-slate-300 focus:ring-0 focus:outline-none cursor-pointer w-full py-0.5"
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Quarterly View</option>
               </select>
             </div>
             <button 
               onClick={fetchAnalytics}
               className={`p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600 rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-sm ${isLoading ? 'animate-spin' : ''}`}
             >
                <RefreshCw className="size-4" />
             </button>
          </div>
        </div>
      </motion.div>

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Total Leads', value: data?.stats?.totalLeads || 0, icon: Users, color: 'blue' },
          { label: 'Total Conversions', value: data?.stats?.convertedCount || 0, icon: Target, color: 'emerald' },
          { label: 'Conversion Rate', value: `${(data?.stats?.conversionRate || 0).toFixed(1)}%`, icon: Zap, color: 'amber' },
          { label: 'Growth Trend', value: '+12.5%', icon: TrendingUp, color: 'purple' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className={`p-2.5 bg-blue-500/10 rounded-xl w-fit mb-3.5 ${
              stat.color === 'blue' ? 'bg-blue-500/10 text-blue-600' :
              stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
              stat.color === 'amber' ? 'bg-amber-500/10 text-amber-600' :
              'bg-purple-500/10 text-purple-600'
            }`}>
              <stat.icon className="size-5" />
            </div>
            <p className="text-xs font-medium text-slate-500 mb-1.5 leading-none">{stat.label}</p>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stat.value}
            </h4>
          </motion.div>
        ))}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        
        {/* Trend Analysis Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Lead Volume Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Daily count of newly registered leads</p>
            </div>
            <Activity className="size-5 text-blue-600" />
          </div>
          
          <div className="h-[250px] sm:h-[300px] w-full min-h-[250px]">
            {isMounted && data?.leadsTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.leadsTrend}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0055ff" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0055ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="_id" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)', padding: '10px' }}
                    labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#0055ff" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No trend metrics available
              </div>
            )}
          </div>
        </motion.div>

        {/* Distributed Logic (Pie Chart) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Leads Status Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">Proportion of leads across pipeline phases</p>
            </div>
            <PieChart className="size-5 text-emerald-500" />
          </div>
          
          <div className="h-[250px] sm:h-[300px] w-full min-h-[250px]">
            {isMounted && data?.statusBreakdown?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={data.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={6}
                    dataKey="count"
                    nameKey="_id"
                  >
                    {data.statusBreakdown.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No distribution data found
              </div>
            )}
          </div>
        </motion.div>

        {/* Human Capital ROI (Bar Chart) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Agent Performance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Assigned vs. converted leads by employee</p>
            </div>
            <BarChart3 className="size-5 text-amber-500" />
          </div>
          
          <div className="h-[300px] sm:h-[400px] w-full min-h-[300px]">
            {isMounted && data?.employeePerformance?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.employeePerformance} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend iconType="rect" wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                  <Bar dataKey="totalLeads" name="Assigned Leads" fill="#0055ff" radius={[4, 4, 0, 0]} barSize={35} />
                  <Bar dataKey="converted" name="Converted" fill="#10b981" radius={[4, 4, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No performance records available
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
