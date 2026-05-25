import { useState, useEffect } from 'react';
import { Search, Filter, PhoneCall, Clock, Calendar, ChevronRight, MessageSquare, PhoneIncoming, Loader2, Mail, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getEmployeeCommunicationLogsRequest } from '../../../api/lead.api';
import { Link } from 'react-router-dom';

export default function CallHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getEmployeeCommunicationLogsRequest();
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.outcome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyles = (outcome: string) => {
    switch (outcome) {
      case 'interested': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'no_answer': 
      case 'busy':
      case 'switched_off':
        return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
      case 'callback_requested': return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      default: return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'call': return PhoneIncoming;
      case 'message': return Mail;
      case 'remark': return MessageSquare;
      default: return FileText;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'call': return 'text-blue-600 bg-blue-500/10';
      case 'message': return 'text-emerald-600 bg-emerald-500/10';
      case 'remark': return 'text-amber-600 bg-amber-500/10';
      default: return 'text-slate-600 bg-slate-500/10';
    }
  };

  return (
    <div className="space-y-6 lg:space-y-10 pb-20">
      {/* Header with Glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="size-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
              <PhoneCall className="size-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">Communication Log</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Contact Intelligence Tracking</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search history..." 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
              />
            </div>
            <button className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-primary transition-all">
              <Filter className="size-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <Loader2 className="size-10 text-primary animate-spin" />
           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Retrieving interactions...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
           <PhoneCall className="size-16 text-slate-300" />
           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">No interactions found</p>
        </div>
      ) : (
        <>
          {/* Mobile Card Grid */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredLogs.map((log, i) => {
                const Icon = getIcon(log.type);
                const colorClass = getColor(log.type);
                return (
                  <motion.div
                    key={log._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative group overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-12 rounded-2xl ${colorClass} flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-inner group-hover:rotate-12 transition-transform`}>
                          <Icon className="size-6" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{log.customerName}</h4>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                            <Clock className="size-3" /> {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest border ${getStatusStyles(log.outcome)} shadow-sm`}>
                        {log.outcome?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-4">
                      <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">
                        "{log.content}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar className="size-3.5" /> {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                      <Link to={`/employee/leads/${log.leadId}`} className="text-[10px] font-black text-primary uppercase bg-primary/10 px-3 py-1.5 rounded-xl">
                        View Lead
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Desktop Perspective Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden lg:block bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden"
          >
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-10 py-6">Customer Engagement</th>
                  <th className="px-10 py-6">Temporal Metrics</th>
                  <th className="px-10 py-6">Interaction Meta</th>
                  <th className="px-10 py-6">Outcome</th>
                  <th className="px-10 py-6 text-right">Insight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => {
                   const Icon = getIcon(log.type);
                   const colorClass = getColor(log.type);
                   return (
                    <tr key={log._id} className="hover:bg-primary/[0.01] dark:hover:bg-primary/5 transition-colors group cursor-pointer">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`size-10 rounded-xl ${colorClass} flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-inner group-hover:scale-110 transition-transform`}>
                            <Icon className="size-5" />
                          </div>
                          <div>
                            <span className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-all">{log.customerName}</span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{new Date(log.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                              <Clock className="size-3.5 opacity-50" /> {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest capitalize">
                              {log.type} entry
                            </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="max-w-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight flex items-start gap-2 italic">
                            <MessageSquare className="size-3 shrink-0 opacity-40 mt-0.5" /> {log.content}
                          </p>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(log.outcome)} shadow-sm`}>
                          {log.outcome?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <Link to={`/employee/leads/${log.leadId}`} className="p-3 text-slate-400 hover:text-primary dark:text-slate-500 hover:bg-primary/5 rounded-2xl transition-all flex items-center justify-end">
                          <ChevronRight className="size-5" />
                        </Link>
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

