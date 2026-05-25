import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Download, Mail, MoreVertical, Star, UserMinus, Edit, Loader2, Key } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getEmployeesRequest, resetEmployeePasswordRequest } from '../../../api/admin.api';
import { toast } from 'react-hot-toast';
import Pagination from '../../../components/Pagination';

const getStatusStyles = (isActive: boolean) => {
  if (isActive) return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
  return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  
  const [filters, setFilters] = useState({
    search: "",
    status: "active" as "all" | "active" | "inactive",
    hasLeads: "all" as "all" | "active" | "none"
  });
  const [showFilters, setShowFilters] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, filters]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit,
        role: 'employee',
        search: filters.search || undefined,
        isActive: filters.status === 'active' ? true : (filters.status === 'inactive' ? false : undefined),
        hasLeads: filters.hasLeads !== 'all' ? filters.hasLeads : undefined
      };
      
      const response = await getEmployeesRequest(params);
      if (response.success) {
        setEmployees(response.data?.data || []);
        setTotalEmployees(response.data?.total || 0);
      }
    } catch (error) {
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };


  const activeFilterCount = (filters.status !== "active" ? 1 : 0) + (filters.hasLeads !== "all" ? 1 : 0);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  const handleResetPassword = async (id: string, name: string) => {
    const newPassword = window.prompt(`Enter new password for ${name}:`);
    if (!newPassword) return;
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");

    try {
      setResettingId(id);
      const res = await resetEmployeePasswordRequest(id, newPassword);
      if (res.success) {
        toast.success("Password reset successful");
      }
    } catch (error) {
      toast.error("Failed to reset password");
    } finally {
      setResettingId(null);
    }
  };

  return (
    <div className="px-4 lg:px-0 space-y-6 lg:space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Workforce Index</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.4em] mt-1">Management of Human Capital Assets</p>
        </div>
        <Link to="/admin/employees/register" className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 group">
          <Plus className="size-4 group-hover:rotate-90 transition-transform" /> Register Personnel
        </Link>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search within workforce directory..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl py-4 pl-14 pr-6 text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/10 transition-all placeholder:opacity-50"
          />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 lg:flex-none px-6 py-4 border rounded-2xl transition-all relative flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest ${showFilters ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <Filter className="size-4" /> Filter Index
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 size-5 bg-rose-500 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950 font-black">
                {activeFilterCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showFilters && (
              <>
                {/* Backdrop fix for mobile */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowFilters(false)}
                  className="fixed lg:absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[99]"
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="fixed lg:absolute bottom-0 lg:bottom-auto lg:top-full left-0 right-0 lg:left-auto lg:right-0 mt-0 lg:mt-4 w-full lg:w-72 bg-white dark:bg-slate-900 border-t lg:border border-slate-200 dark:border-slate-800 rounded-t-[2rem] lg:rounded-[2rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1),0_20px_50px_rgba(0,0,0,0.1)] z-[100] p-6 lg:p-5 overflow-hidden"
                >
                  <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6 lg:hidden" />
                  
                  <div className="space-y-5 lg:space-y-4">
                    {/* Status Category */}
                    <div>
                      <div className="px-1 pb-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50 dark:border-slate-800 mb-3">
                        Security Status
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(["active", "inactive"] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => setFilters(prev => ({ ...prev, status }))}
                            className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${filters.status === status ? 'bg-primary text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400'}`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Assignment Status */}
                    <div>
                      <div className="px-1 pb-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50 dark:border-slate-800 mb-3">
                        Workload Logic
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                         {[
                           { id: "all", label: "Unified Force" },
                           { id: "active", label: "Active Assignees" },
                           { id: "none", label: "Unallocated Bench" }
                         ].map((opt) => (
                           <button
                             key={opt.id}
                             onClick={() => setFilters(prev => ({ ...prev, hasLeads: opt.id as any }))}
                             className={`w-full text-left px-3 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${filters.hasLeads === opt.id ? 'bg-indigo-500/10 text-indigo-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400'}`}
                           >
                             {opt.label}
                             <div className={`size-1 rounded-full ${filters.hasLeads === opt.id ? 'bg-indigo-500 animate-pulse' : 'bg-slate-200'}`} />
                           </button>
                         ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setFilters({ search: filters.search, status: "active", hasLeads: "all" });
                          setCurrentPage(1);
                          setShowFilters(false);
                        }}
                        className="text-[8px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-[0.2em] transition-colors"
                      >
                        Reset Index
                      </button>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="bg-primary text-white px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                      >
                        Apply Logic
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <button className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm">
            <Download className="size-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Mobile Card Grid */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {employees.map((employee, i) => (
                <motion.div
                  key={employee.userId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-slate-900 p-5 rounded-[2.2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group"
                >
                  {/* Floating Action Menu (Mobile) */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                      <div className="size-14 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-sm border border-white dark:border-slate-800 shadow-lg group-hover:rotate-6 transition-transform overflow-hidden relative">
                        {employee.profileImage ? (
                          <img src={employee.profileImage} alt={employee.name} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(employee.name)
                        )}
                        <div className={`absolute bottom-0 right-0 size-3 border-2 border-white dark:border-slate-900 rounded-full ${employee.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{employee.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{employee.role}</span>
                          <span className="size-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                          <span className="text-[9px] font-black text-primary uppercase tracking-widest">ID: {employee.userId.slice(-6)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-5">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Leads</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{employee.leadsCount || 0}</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Rating</span>
                      <div className="flex gap-1 items-center justify-center">
                        <Star className="size-2.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-black text-slate-900 dark:text-white">4.9</span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Status</span>
                      <span className={`text-[8px] font-black uppercase ${employee.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {employee.isActive ? 'Active' : 'Locked'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <Mail className="size-3.5 text-primary" />
                      <span className="truncate flex-1">{employee.email}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/employees/edit/${employee.userId}`)}
                      className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                    >
                      Management
                    </button>
                    <button 
                      onClick={() => handleResetPassword(employee.userId, employee.name)}
                      disabled={resettingId === employee.userId}
                      className="size-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      {resettingId === employee.userId ? <Loader2 className="size-4 animate-spin" /> : <Key className="size-4" />}
                    </button>
                    <button className="size-12 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                      <UserMinus className="size-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-6">Personnel Index</th>
                  <th className="px-8 py-6">Asset Load</th>
                  <th className="px-8 py-6">Contact Matrix</th>
                  <th className="px-8 py-6">Security</th>
                  <th className="px-8 py-6 text-right">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {employees.map((employee) => (
                  <tr key={employee.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-xs border border-white/50 dark:border-slate-800 shadow-sm group-hover:scale-110 transition-transform overflow-hidden relative">
                          {employee.profileImage ? (
                            <img src={employee.profileImage} alt={employee.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(employee.name)
                          )}
                          <div className={`absolute bottom-0 right-0 size-2.5 border-2 border-white dark:border-slate-950 rounded-full ${employee.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                        <div>
                          <span className="font-black text-slate-900 dark:text-white block leading-none uppercase tracking-tight">{employee.name}</span>
                          <span className="text-[9px] text-slate-400 font-black uppercase mt-1.5 block tracking-widest">{employee.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-black text-slate-900 dark:text-white">{employee.leadsCount || 0}</span> 
                           <span className="text-[9px] font-black text-slate-400 uppercase">Leads</span>
                        </div>
                        <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-primary" style={{ width: `${Math.min((employee.leadsCount || 0) * 5, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                         <span className="text-[11px] font-bold text-slate-900 dark:text-white block">{employee.email}</span>
                         <span className="text-[10px] font-bold text-slate-400 block">{employee.phone}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(employee.isActive)} shadow-sm`}>
                        {employee.isActive ? 'Active Mode' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                          onClick={() => handleResetPassword(employee.userId, employee.name)}
                          disabled={resettingId === employee.userId}
                          className="p-3 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-2xl transition-all"
                        >
                           {resettingId === employee.userId ? <Loader2 className="size-4 animate-spin" /> : <Key className="size-4" />}
                        </button>
                        <button
                          onClick={() => navigate(`/admin/employees/edit/${employee.userId}`)}
                          className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                        >
                          <Edit className="size-4" />
                        </button>
                        <button className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all">
                          <MoreVertical className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPage={Math.ceil(totalEmployees / limit)}
            isLoading={loading}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}

