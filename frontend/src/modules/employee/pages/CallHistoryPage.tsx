import { useState, useEffect } from 'react';
import { Search, Filter, PhoneCall, Clock, Calendar, MessageSquare, PhoneIncoming, Loader2, Mail, FileText } from 'lucide-react';
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
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Communication Log</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Contact history and client call interaction logs</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..." 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none dark:text-white"
            />
          </div>
          <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-slate-550 hover:text-emerald-600 transition-colors">
            <Filter className="size-4" />
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <Loader2 className="size-8 text-primary animate-spin" />
           <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Retrieving interactions...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
           <PhoneCall className="size-12 text-slate-300" />
           <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No interactions found</p>
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-8 rounded-lg ${colorClass} flex items-center justify-center border border-slate-100 dark:border-slate-800 shrink-0`}>
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{log.customerName}</h4>
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                            <Clock className="size-3" /> {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border ${getStatusStyles(log.outcome)}`}>
                        {log.outcome?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg mb-4">
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                        "{log.content}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        <Calendar className="size-3.5" /> {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                      <Link to={`/employee/leads/${log.leadId}`} className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md">
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden lg:block bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden"
          >
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4">Customer Engagement</th>
                  <th className="px-6 py-4">Temporal Metrics</th>
                  <th className="px-6 py-4">Interaction Meta</th>
                  <th className="px-6 py-4">Outcome</th>
                  <th className="px-6 py-4 text-right">Insight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => {
                   const Icon = getIcon(log.type);
                   const colorClass = getColor(log.type);
                   return (
                    <tr key={log._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`size-8 rounded-lg ${colorClass} flex items-center justify-center border border-slate-100 dark:border-slate-800`}>
                            <Icon className="size-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">{log.customerName}</span>
                            <p className="text-[10px] text-slate-400 uppercase mt-0.5">{new Date(log.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-655 dark:text-slate-350">
                              <Clock className="size-3.5 opacity-60" /> {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase">
                              {log.type} entry
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug flex items-start gap-2 italic">
                            <MessageSquare className="size-3 shrink-0 opacity-40 mt-0.5" /> {log.content}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-semibold uppercase border ${getStatusStyles(log.outcome)}`}>
                          {log.outcome?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/employee/leads/${log.leadId}`} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-650 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors inline-block">
                          View Lead
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

