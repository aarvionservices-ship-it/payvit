import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, Landmark, CreditCard, Briefcase, Phone, Calendar, ChevronRight, TrendingUp, UserPlus, CheckCircle2, Loader2, Check, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { getLeadsRequest, bulkAssignLeadsRequest, uploadColdCallingLeadsRequest } from '../../../api/lead.api';
import { getEmployeesRequest } from '../../../api/admin.api';
import { toast } from 'react-hot-toast';
import Pagination from '../../../components/Pagination';

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    case 'assigned': return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
    case 'contacted': return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    case 'interested': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    case 'callback': return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
    case 'converted': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
    default: return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
  }
};

const getCategoryIcon = (type: string, leadType?: string) => {
  if (leadType === 'cold_calling') {
    return { icon: Phone, color: 'text-indigo-600', bg: 'bg-indigo-500/10' };
  }
  switch (type?.toLowerCase()) {
    case 'personal': return { icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-500/10' };
    case 'business': return { icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-500/10' };
    case 'home': return { icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-500/10' };
    case 'credit': return { icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-500/10' };
    default: return { icon: TrendingUp, color: 'text-slate-600', bg: 'bg-slate-500/10' };
  }
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState<string | 'bulk' | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  
  const [activeTab, setActiveTab] = useState<'applied' | 'cold_calling'>('applied');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    assignment: "all" as "all" | "assigned" | "unassigned",
    serviceType: "all"
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const employeesMap = useMemo(() => {
    const map: Record<string, any> = {};
    employees.forEach(emp => {
      map[emp.userId] = emp;
    });
    return map;
  }, [employees]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    fetchLeads();
  }, [currentPage, debouncedSearch, filters.status, filters.assignment, filters.serviceType, activeTab]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await getEmployeesRequest();
      if (res.success) setEmployees(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit,
        search: debouncedSearch || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        loanType: filters.serviceType !== 'all' ? filters.serviceType : undefined,
        leadType: activeTab === 'applied' ? 'customer_applied' : 'cold_calling'
      };

      if (filters.assignment === 'assigned') params.assignedEmployee = { $ne: null };
      if (filters.assignment === 'unassigned') params.assignedEmployee = null;

      const res = await getLeadsRequest(params);
      
      if (res.success) {
        setLeads(res.data?.data || []);
        setTotalLeads(res.data?.total || 0);
      }
    } catch (error) {
      toast.error("Failed to sync lead intelligence");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = fetchLeads; // Alias for backward compatibility if needed

  const handleBulkAssign = async (employeeId: string) => {
    try {
      setAssigning(true);
      const leadIds = showAssignModal === 'bulk' ? selectedLeads : [showAssignModal!];
      const res = await bulkAssignLeadsRequest(leadIds, employeeId);
      
      if (res.success) {
        toast.success(`Leads successfully synchronized to agent protocol`);
        setSelectedLeads([]);
        setShowAssignModal(null);
        fetchData();
      }
    } catch (error) {
      toast.error("Encryption handshake failed during assignment");
    } finally {
      setAssigning(false);
    }
  };

  const isAllOnPageSelected = useMemo(() => {
    return leads.length > 0 && leads.every(l => selectedLeads.includes(l.leadId));
  }, [leads, selectedLeads]);

  const toggleSelectAll = () => {
    if (isAllOnPageSelected) {
      const leadIdsToRemove = leads.map(l => l.leadId);
      setSelectedLeads(prev => prev.filter(id => !leadIdsToRemove.includes(id)));
    } else {
      const newSelections = [...selectedLeads];
      leads.forEach(l => {
        if (!newSelections.includes(l.leadId)) {
          newSelections.push(l.leadId);
        }
      });
      setSelectedLeads(newSelections);
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const res = await uploadColdCallingLeadsRequest(file.name, base64Data);
          if (res.success) {
            toast.success(res.message || "Cold calling leads synchronized successfully!");
            setShowUploadModal(false);
            setFile(null);
            fetchLeads();
            
            // Periodically refresh the data over the next few seconds to display leads as they finish importing
            const intervals = [1000, 3000, 6000];
            intervals.forEach(delay => {
              setTimeout(() => {
                fetchLeads();
              }, delay);
            });
          } else {
            toast.error(res.message || "Upload failed");
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to process server response");
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || "Spreadsheet upload failed");
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-955 dark:text-white">Leads Acquisition</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monitor, assign, and track customer applied and cold calling leads</p>
        </div>
        {activeTab === 'cold_calling' && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Upload className="size-4" /> Upload Leads List
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('applied')}
          className={`pb-3 text-xs font-semibold relative transition-all cursor-pointer ${activeTab === 'applied' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Customer Applied
          {activeTab === 'applied' && (
            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('cold_calling')}
          className={`pb-3 text-xs font-semibold relative transition-all cursor-pointer ${activeTab === 'cold_calling' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Cold Calling List
          {activeTab === 'cold_calling' && (
            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Selection Control Bar */}
      <AnimatePresence>
        {selectedLeads.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex items-center justify-between bg-primary/10 border border-primary/20 p-3 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-primary" />
              <span className="text-xs font-semibold text-primary">{selectedLeads.length} Leads Selected</span>
            </div>
            <button 
              onClick={() => setShowAssignModal('bulk')}
              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
            >
              Bulk Assign Agent
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by name or phone..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl py-2 pl-11 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all text-slate-700 dark:text-slate-200 placeholder:opacity-50"
          />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto relative">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 lg:flex-none p-2 border rounded-xl transition-all relative ${showFilters ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
             <Filter className="size-4.5 mx-auto" />
          </button>

          <button className="flex-1 lg:flex-none p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-primary transition-all shadow-sm">
            <Download className="size-4.5 mx-auto" />
          </button>

          <AnimatePresence>
            {showFilters && (
              <>
                {/* Mobile Backdrop */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowFilters(false)}
                  className="fixed lg:hidden inset-0 bg-slate-900/40 backdrop-blur-sm z-[99]"
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="fixed lg:absolute bottom-0 lg:bottom-auto lg:top-full left-0 right-0 lg:left-auto lg:right-0 mt-0 lg:mt-4 w-full lg:w-72 bg-white dark:bg-slate-900 border-t lg:border border-slate-200 dark:border-slate-800 rounded-t-[2.5rem] lg:rounded-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.1),0_20px_50px_rgba(0,0,0,0.1)] z-[100] p-6 lg:p-5 space-y-5 lg:space-y-4"
                >
                  <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-2 lg:hidden" />
                  
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">Assignment Status</label>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                      {['all', 'assigned', 'unassigned'].map((val) => (
                        <button
                          key={val}
                          onClick={() => setFilters(prev => ({ ...prev, assignment: val as any }))}
                          className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filters.assignment === val ? 'bg-primary text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500'}`}
                        >
                          {val === 'all' ? 'Unified' : val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">Lifecycle State</label>
                    <select 
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="all">All Channels</option>
                      <option value="new">New Entry</option>
                      <option value="assigned">Assigned</option>
                      <option value="contacted">Contacted</option>
                      <option value="interested">Interested</option>
                      <option value="callback">Callback</option>
                      <option value="in-progress">In-Progress</option>
                      <option value="converted">Converted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">Service Logic</label>
                    <select 
                      value={filters.serviceType}
                      onChange={(e) => setFilters(prev => ({ ...prev, serviceType: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="all">Any Portfolio</option>
                      <option value="personal">Personal Loan</option>
                      <option value="business">Business Loan</option>
                      <option value="home">Home Loan</option>
                      <option value="credit">Credit Card</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <button 
                      onClick={() => {
                        setFilters({ search: "", status: "all", assignment: "all", serviceType: "all" });
                        setCurrentPage(1);
                        setShowFilters(false);
                      }}
                      className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] px-2 hover:opacity-70 transition-all"
                    >
                      Clear All
                    </button>
                    <button 
                      onClick={() => setShowFilters(false)}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 lg:hidden"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="size-10 animate-spin text-primary opacity-20" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Intelligence Grid...</p>
        </div>
      ) : (
        <>
          {/* Leads Cards Grid - Mobile */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {leads.map((lead) => {
                const category = getCategoryIcon(lead.loanType, lead.leadType);
                const assignedEmp = employeesMap[lead.assignedEmployee];
                
                return (
                  <motion.div
                    key={lead.leadId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => toggleSelectLead(lead.leadId)}
                    className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all relative overflow-hidden group active:scale-[0.99] ${selectedLeads.includes(lead.leadId) ? 'border-primary ring-2 ring-primary/10 shadow-md' : 'border-slate-100 dark:border-slate-800/80 shadow-sm'}`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`size-14 rounded-2xl ${category.bg} ${category.color} flex items-center justify-center border border-white dark:border-slate-800 shadow-lg group-hover:rotate-12 transition-transform`}>
                          <category.icon className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{lead.customerName}</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                            <Phone className="size-3.5" /> {lead.phone}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusStyles(lead.status)} shadow-sm`}>
                        {lead.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 mb-6">
                       {lead.assignedEmployee ? (
                         <Link 
                           to={`/admin/employees/${lead.assignedEmployee}`}
                           onClick={(e) => e.stopPropagation()}
                           className="w-full p-4 bg-slate-50 dark:bg-slate-800/10 rounded-2xl border border-slate-50 dark:border-slate-800 flex items-center justify-between hover:border-primary/20 transition-all cursor-pointer"
                         >
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Active Custodian</span>
                                <span className="text-sm font-black text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">{assignedEmp?.name || "System Protocol"}</span>
                            </div>
                            <div className="size-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-xs">
                              {assignedEmp?.name?.[0] || "S"}
                            </div>
                         </Link>
                       ) : (
                         <button 
                           onClick={(e) => { e.stopPropagation(); setShowAssignModal(lead.leadId); }}
                           className="w-full p-4 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between group transition-all"
                         >
                            <div>
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-1 underline">Action Required</span>
                                <span className="text-sm font-black text-slate-700 dark:text-slate-300">Unassigned Lead</span>
                            </div>
                            <UserPlus className="size-5 text-rose-500 group-hover:scale-110 transition-transform" />
                         </button>
                       )}
                    </div>

                    <div className="space-y-3 mb-6 px-1">
                       <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-400 uppercase tracking-tighter flex items-center gap-2"><Calendar className="size-4" /> Received At</span>
                          <span className="text-slate-700 dark:text-slate-300">{new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                       </div>
                       <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-400 uppercase tracking-tighter flex items-center gap-2"><TrendingUp className="size-4" /> Classification</span>
                          <span className="text-primary font-black uppercase tracking-[0.1em]">{lead.loanType || "Cold Calling"}</span>
                       </div>
                    </div>
                    
                    <div className="pt-5 border-t border-slate-50 dark:border-slate-800 flex gap-2">
                      <Link 
                        to={`/admin/leads/${lead.leadId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm"
                      >
                        Dive into Intelligence <ChevronRight className="size-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4.5 w-12">
                    <button 
                      onClick={toggleSelectAll}
                      className={`size-4.5 rounded border flex items-center justify-center transition-all ${isAllOnPageSelected ? 'bg-primary border-primary' : 'border-slate-200 dark:border-slate-800/80 bg-white'}`}
                    >
                      {isAllOnPageSelected && <Check className="size-3 text-white" />}
                    </button>
                  </th>
                  <th className="px-6 py-4.5">Customer Profile</th>
                  <th className="px-6 py-4.5">Classification</th>
                  <th className="px-6 py-4.5">Assigned Agent</th>
                  <th className="px-6 py-4.5">Stage</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leads.map((lead) => {
                  const category = getCategoryIcon(lead.loanType, lead.leadType);
                  const assignedEmp = employeesMap[lead.assignedEmployee];
                  
                  return (
                    <tr 
                      key={lead.leadId} 
                      onClick={() => toggleSelectLead(lead.leadId)}
                      className={`transition-colors group cursor-pointer border-b border-slate-100/50 dark:border-slate-800/55 last:border-b-0 ${selectedLeads.includes(lead.leadId) ? 'bg-primary/5' : 'hover:bg-slate-50/50 dark:hover:bg-slate-850'}`}
                    >
                      <td className="px-6 py-4">
                        <div className={`size-4.5 rounded border flex items-center justify-center transition-all ${selectedLeads.includes(lead.leadId) ? 'bg-primary border-primary' : 'border-slate-200 dark:border-slate-800'}`}>
                          {selectedLeads.includes(lead.leadId) && <Check className="size-3 text-white" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`size-9 rounded-xl ${category.bg} ${category.color} flex items-center justify-center border border-white dark:border-slate-800 shadow-sm group-hover:scale-105 transition-transform`}>
                            <category.icon className="size-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block leading-tight text-sm">{lead.customerName}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 block flex items-center gap-1"><Phone className="size-3" /> {lead.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{lead.loanType || "Cold Calling"}</span>
                      </td>
                      <td className="px-4 py-3">
                        {lead.assignedEmployee ? (
                          <Link 
                            to={`/admin/employees/${lead.assignedEmployee}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-800/10 rounded-lg border border-slate-50 dark:border-slate-850 flex items-center justify-between hover:border-primary/20 transition-all cursor-pointer"
                          >
                             <div className="flex items-center gap-2">
                                 <div className="size-6 bg-primary/10 rounded-md flex items-center justify-center text-primary font-bold text-[9px]">{assignedEmp?.name?.[0] || 'S'}</div>
                                 <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">{assignedEmp?.name || "System Protocol"}</span>
                             </div>
                          </Link>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowAssignModal(lead.leadId); }}
                            className="w-full p-2 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-between group transition-all"
                          >
                             <div className="flex items-center gap-2">
                                 <UserPlus className="size-3 text-rose-500" />
                                 <span className="text-[10px] font-semibold text-rose-500">Assign</span>
                             </div>
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border whitespace-nowrap ${getStatusStyles(lead.status)} shadow-sm`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                         <div className="flex items-center justify-end gap-1.5">
                            <Link to={`/admin/leads/${lead.leadId}`} className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-primary border border-slate-100 dark:border-slate-700 rounded-lg text-[11px] font-semibold uppercase tracking-wider hover:bg-primary hover:text-white transition-all">
                              View
                            </Link>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPage={Math.ceil(totalLeads / limit)}
            onPageChange={setCurrentPage}
            isLoading={loading}
          />
        </>
      )}

      {/* Assignment Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
               <div className="p-8 pb-4">
                  <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                    <UserPlus className="size-7" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Assign Custodian</h2>
                  <p className="text-sm font-bold text-slate-500 mt-2">
                    {showAssignModal === 'bulk' 
                      ? `Select an agent to manage the ${selectedLeads.length} selected leads.` 
                      : 'Transfer this lead intelligence to a specialized agent protocol.'}
                  </p>
               </div>

               <div className="max-h-[300px] overflow-y-auto px-8 py-4 space-y-2">
                  {employees.filter(e => e.isActive).map(emp => (
                    <button
                      key={emp.userId}
                      onClick={() => handleBulkAssign(emp.userId)}
                      disabled={assigning}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-primary hover:text-white transition-all rounded-2xl group border border-slate-100 dark:border-slate-800 disabled:opacity-50"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="size-10 bg-white/50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center font-black group-hover:bg-white/20 transition-colors">
                          {emp.name[0]}
                        </div>
                        <div>
                          <p className="font-black text-sm">{emp.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Team Protocol: {emp.role}</p>
                        </div>
                      </div>
                      <ChevronRight className="size-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
               </div>

               <div className="p-8 pt-4">
                  <button 
                    onClick={() => setShowAssignModal(null)}
                    className="w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Abort Assignment
                  </button>
               </div>
               
               {assigning && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center">
                    <Loader2 className="size-10 animate-spin text-primary" />
                  </div>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Spreadsheet Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!uploading) setShowUploadModal(false); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8"
            >
               <div className="pb-4">
                  <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                    <Upload className="size-7" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Upload Cold Calling List</h2>
                  <p className="text-sm font-bold text-slate-500 mt-2">
                    Import lists of leads (CSV, XLS, XLSX) for cold calling campaigns. Columns are mapped automatically.
                  </p>
               </div>

               <form onSubmit={handleUploadSubmit} className="space-y-6">
                 <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-all relative">
                   <input 
                     type="file" 
                     accept=".csv, .xls, .xlsx" 
                     onChange={handleFileChange}
                     disabled={uploading}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   />
                   <Upload className="size-8 text-slate-400 mb-4" />
                   <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                     {file ? file.name : "Drag and drop or click to choose file"}
                   </p>
                   <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">
                     Supports CSV, XLS, XLSX (Max 10MB)
                   </p>
                 </div>

                 <div className="flex gap-4">
                   <button 
                     type="button"
                     disabled={uploading}
                     onClick={() => setShowUploadModal(false)}
                     className="flex-1 py-4 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit"
                     disabled={uploading || !file}
                     className="flex-1 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                   >
                     {uploading ? (
                       <>
                         <Loader2 className="size-4 animate-spin" /> Synchronizing...
                       </>
                     ) : (
                       "Initialize Import"
                     )}
                   </button>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

