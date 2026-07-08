import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  Calendar, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  ChevronRight, 
  XCircle, 
  Search, 
  FileText,
  UserPlus,
  Edit,
  Award
} from 'lucide-react';
import { getEmployeeByIdRequest, getEmployeesRequest } from '../../../api/admin.api';
import { getLeadsRequest, bulkAssignLeadsRequest } from '../../../api/lead.api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import Pagination from '../../../components/Pagination';

const getLeadStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'new': 
      return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    case 'assigned': 
      return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
    case 'contacted': 
      return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    case 'interested': 
      return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    case 'callback': 
      return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
    case 'in-progress': 
      return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30';
    case 'converted': 
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
    case 'rejected': 
      return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30';
    default: 
      return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
  }
};

export default function EmployeeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'converted' | 'rejected' | 'active'>('all');

  const [unassignedLeads, setUnassignedLeads] = useState<any[]>([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [assigningInProgress, setAssigningInProgress] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = useState(10);

  // Reassignment flow states
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [selectedTargetEmployee, setSelectedTargetEmployee] = useState('');
  const [otherEmployees, setOtherEmployees] = useState<any[]>([]);
  const [reassigningInProgress, setReassigningInProgress] = useState(false);
  const [modalStatusFilter, setModalStatusFilter] = useState('all');

  useEffect(() => {
    if (id) {
      loadData();
      checkUnassignedLeads();
    }
  }, [id]);

  const checkUnassignedLeads = async () => {
    try {
      const res = await getLeadsRequest({
        assignment: 'unassigned',
        leadType: 'cold_calling',
        limit: 20
      });
      if (res.success) {
        const leadsData = res.data?.data || res.data || [];
        setUnassignedLeads(leadsData);
        setUnassignedCount(res.data?.total || leadsData.length);
      }
    } catch (error) {
      console.error("Failed to check unassigned cold calling leads:", error);
    }
  };

  const handleQuickAssign = async () => {
    if (!id || unassignedLeads.length === 0) return;
    
    try {
      setAssigningInProgress(true);
      const leadIdsToAssign = unassignedLeads.slice(0, 20).map(lead => lead.leadId);
      
      const res = await bulkAssignLeadsRequest(leadIdsToAssign, id);
      if (res.success) {
        toast.success(`Successfully assigned ${leadIdsToAssign.length} cold calling leads`);
        await Promise.all([
          loadData(),
          checkUnassignedLeads()
        ]);
      } else {
        toast.error(res.message || "Failed to assign leads");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to assign leads");
    } finally {
      setAssigningInProgress(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, leadsRes] = await Promise.all([
        getEmployeeByIdRequest(id!),
        getLeadsRequest({ assignedEmployee: id!, limit: 100 })
      ]);

      if (empRes.success) {
        setEmployee(empRes.data || empRes);
      }
      
      if (leadsRes.success) {
        setLeads(leadsRes.data?.data || leadsRes.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load employee dossier');
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherEmployees = async () => {
    try {
      const res = await getEmployeesRequest({ limit: 1000 });
      if (res.success) {
        const list = res.data?.data || res.data || [];
        const filtered = list.filter((emp: any) => emp.userId !== id && emp.isActive && emp.role === 'employee');
        setOtherEmployees(filtered);
      }
    } catch (error) {
      console.error("Failed to load other employees:", error);
    }
  };

  useEffect(() => {
    if (isReassignModalOpen && id) {
      fetchOtherEmployees();
    }
  }, [isReassignModalOpen, id]);

  // Modal leads status filter logic
  const modalFilteredLeads = useMemo(() => {
    if (modalStatusFilter === 'all') return leads;
    return leads.filter(lead => lead.status?.toLowerCase() === modalStatusFilter.toLowerCase());
  }, [leads, modalStatusFilter]);

  const handleToggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(leadId) ? prev.filter(item => item !== leadId) : [...prev, leadId]
    );
  };

  const handleSelectAllLeads = (checked: boolean) => {
    if (checked) {
      const filteredIds = modalFilteredLeads.map(lead => lead.leadId);
      setSelectedLeadIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    } else {
      const filteredIds = modalFilteredLeads.map(lead => lead.leadId);
      setSelectedLeadIds(prev => prev.filter(id => !filteredIds.includes(id)));
    }
  };

  const isAllFilteredSelected = useMemo(() => {
    return modalFilteredLeads.length > 0 && modalFilteredLeads.every(lead => selectedLeadIds.includes(lead.leadId));
  }, [modalFilteredLeads, selectedLeadIds]);

  const handleExecuteReassignment = async () => {
    if (selectedLeadIds.length === 0) {
      toast.error("Please select at least one lead to reassign");
      return;
    }
    if (!selectedTargetEmployee) {
      toast.error("Please select a target employee to assign to");
      return;
    }

    try {
      setReassigningInProgress(true);
      const res = await bulkAssignLeadsRequest(selectedLeadIds, selectedTargetEmployee);
      if (res.success) {
        toast.success(`Successfully reassigned ${selectedLeadIds.length} leads`);
        setIsReassignModalOpen(false);
        setSelectedLeadIds([]);
        setSelectedTargetEmployee('');
        setModalStatusFilter('all');
        loadData();
      } else {
        toast.error(res.message || "Failed to reassign leads");
      }
    } catch (error) {
      console.error("Reassignment error:", error);
      toast.error("Failed to reassign leads");
    } finally {
      setReassigningInProgress(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  // Metrics computation
  const stats = useMemo(() => {
    const total = leads.length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const rejected = leads.filter(l => l.status === 'rejected').length;
    const active = total - converted - rejected;
    const successRate = total > 0 ? ((converted / total) * 100).toFixed(1) + '%' : '0%';
    
    return { total, converted, rejected, active, successRate };
  }, [leads]);

  // Frontend filter for search and status tabs
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // 1. Tab filtering
      if (activeTab === 'converted' && lead.status !== 'converted') return false;
      if (activeTab === 'rejected' && lead.status !== 'rejected') return false;
      if (activeTab === 'active' && ['converted', 'rejected'].includes(lead.status)) return false;

      // 2. Search query filtering
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = lead.customerName?.toLowerCase().includes(query);
        const matchesPhone = lead.phone?.includes(query);
        const matchesEmail = lead.email?.toLowerCase().includes(query);
        const matchesProduct = lead.loanType?.toLowerCase().includes(query);
        const matchesStatus = lead.status?.toLowerCase().includes(query);

        return matchesName || matchesPhone || matchesEmail || matchesProduct || matchesStatus;
      }

      return true;
    });
  }, [leads, activeTab, searchQuery]);

  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * leadsPerPage;
    return filteredLeads.slice(startIndex, startIndex + leadsPerPage);
  }, [filteredLeads, currentPage, leadsPerPage]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retrieving Personnel Dossier...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6">
        <XCircle className="size-16 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Personnel Record Not Found</h2>
        <p className="text-xs text-slate-505 dark:text-slate-400 uppercase tracking-wider text-center max-w-md">
          The requested user record could not be found or has been purged from the system registry.
        </p>
        <Link to="/admin/employees" className="mt-4 bg-primary text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
          Return to directory
        </Link>
      </div>
    );
  }

  return (
    <main className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/employees')}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-955 dark:text-white leading-none">Personnel Details</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Operational view and assigned leads history</p>
          </div>
        </div>
        
        {/* Quick Assign 20 Cold Calling Leads */}
        <button
          onClick={handleQuickAssign}
          disabled={unassignedCount === 0 || assigningInProgress}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
            unassignedCount > 0 
              ? "bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/25 cursor-pointer hover:scale-[1.02] active:scale-[0.98]" 
              : "bg-slate-105 dark:bg-slate-805 text-slate-400 dark:text-slate-600 border border-slate-200/50 dark:border-slate-700/50 cursor-not-allowed"
          }`}
        >
          {assigningInProgress ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Assigning Leads...</span>
            </>
          ) : (
            <>
              <UserPlus className="size-4" />
              <span>Quick Assign 20 Cold Leads ({unassignedCount} available)</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-6 lg:p-8 space-y-6 flex flex-col justify-between">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="size-24 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-3xl border border-white dark:border-slate-800 shadow-lg overflow-hidden relative">
              {employee.profileImage ? (
                <img src={employee.profileImage} alt={employee.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(employee.name)
              )}
              <div className={`absolute bottom-0 right-0 size-3 border-2 border-white dark:border-slate-900 rounded-full ${employee.isActive ? 'bg-emerald-505' : 'bg-slate-300'}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-905 dark:text-white tracking-tight leading-tight">{employee.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-1">{employee.role}</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border shadow-sm ${employee.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-slate-55 text-slate-700 border-slate-100'}`}>
              {employee.isActive ? 'Active' : 'Locked'}
            </span>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-808/30 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/60">
              <Mail className="size-4 text-primary shrink-0" />
              <span className="truncate">{employee.email}</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-55 dark:bg-slate-808/30 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/60">
              <Phone className="size-4 text-primary shrink-0" />
              <span>{employee.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-55 dark:bg-slate-808/30 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/60">
              <Calendar className="size-4 text-primary shrink-0" />
              <span>Joined {new Date(employee.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Performance Index (Conversion Rate) */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><Award className="size-3.5 text-amber-500" /> Success Rate</span>
              <span className="text-emerald-500 font-black">{stats.successRate}</span>
            </div>
            <div className="w-full h-2 bg-slate-105 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-emerald-505 rounded-full transition-all duration-500"
                style={{ width: stats.successRate }}
              />
            </div>
            <p className="text-[9px] text-slate-400 dark:text-slate-505 uppercase tracking-widest text-center">
              {stats.converted} of {stats.total} leads converted
            </p>
          </div>

          <button
            onClick={() => navigate(`/admin/employees/edit/${employee.userId}`)}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all hover:bg-slate-850 dark:hover:bg-slate-50 shadow-sm mt-4 border border-transparent dark:border-slate-200"
          >
            <Edit className="size-3.5" /> Edit Profile dossier
          </button>
        </div>

        {/* Metrics & Leads List */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          {/* Dynamic Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Target className="size-4" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Leads</p>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</h3>
              <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                {stats.active} active lead pipeline
              </p>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CheckCircle2 className="size-4" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversions</p>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.converted}</h3>
              <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-2 uppercase tracking-wider">
                Successful conversions
              </p>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                  <TrendingUp className="size-4" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversion Rate</p>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.successRate}</h3>
              <p className="text-[9px] font-bold text-purple-600 dark:text-purple-400 mt-2 uppercase tracking-wider">
                Industry Average: ~45.0%
              </p>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/5 to-transparent rounded-bl-full pointer-events-none" />
            </div>
          </div>

          {/* Assigned Leads Table/Filter Container */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-909 dark:text-white leading-tight">Assigned Leads Registry</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit trail of customer applications</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {leads.length > 0 && (
                    <button
                      onClick={() => {
                        setIsReassignModalOpen(true);
                        setSelectedLeadIds([]);
                        setSelectedTargetEmployee('');
                        setModalStatusFilter('all');
                      }}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shrink-0"
                    >
                      Reassign Leads
                    </button>
                  )}
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter leads..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all placeholder:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Filtering tabs */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {[
                  { id: 'all', label: 'All Leads', count: stats.total, icon: FileText },
                  { id: 'converted', label: 'Converted', count: stats.converted, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-emerald-500/10' },
                  { id: 'rejected', label: 'Rejected', count: stats.rejected, icon: XCircle, color: 'text-rose-600 dark:text-rose-400 bg-rose-500/5 border-rose-500/10' },
                  { id: 'active', label: 'Active', count: stats.active, icon: Target, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/5 border-blue-500/10' }
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTab(t.id as any);
                        setCurrentPage(1);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-2 ${
                        activeTab === t.id 
                          ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' 
                          : 'bg-white dark:bg-slate-905 border-slate-202 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span>{t.label}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        activeTab === t.id
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-105 dark:bg-slate-808 text-slate-600 dark:text-slate-400'
                      }`}>
                        {t.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Leads List/Table */}
            <div className="overflow-x-auto">
              {filteredLeads.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-808/30 text-slate-505 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Classification</th>
                      <th className="px-6 py-4">Stage</th>
                      <th className="px-6 py-4">Assigned On</th>
                      <th className="px-6 py-4 text-right">View Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-808/40">
                    <AnimatePresence mode="popLayout">
                      {paginatedLeads.map((lead) => (
                        <motion.tr 
                          key={lead.leadId}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-808/20 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-905 dark:text-white text-sm leading-tight">{lead.customerName}</div>
                            <div className="text-[10px] font-medium text-slate-500 mt-0.5">{lead.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700/50">
                              {lead.loanType || lead.productType || 'Cold Calling'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider border whitespace-nowrap ${getLeadStatusStyles(lead.status)}`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-400">
                            {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link 
                              to={`/admin/leads/${lead.leadId}`}
                              className="inline-flex p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all hover:scale-105 active:scale-95 border border-transparent hover:border-primary/10"
                            >
                              <ChevronRight className="size-4" />
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <FileText className="size-10 opacity-30" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No matching leads found</p>
                </div>
              )}
            </div>

            {filteredLeads.length > leadsPerPage && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-850">
                <Pagination
                  currentPage={currentPage}
                  totalPage={Math.ceil(filteredLeads.length / leadsPerPage)}
                  isLoading={loading}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reassign Leads Modal */}
      {isReassignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-950 text-white">
              <div>
                <h2 className="text-base font-bold text-white">Reassign Leads</h2>
                <p className="text-xs text-slate-400 mt-0.5">Bulk reassign leads from {employee.name} to another agent.</p>
              </div>
              <button
                onClick={() => setIsReassignModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-all"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Target Employee & Status Filter Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-505 block mb-1">Target Employee</label>
                  <select
                    value={selectedTargetEmployee}
                    onChange={e => setSelectedTargetEmployee(e.target.value)}
                    className="w-full bg-slate-55 dark:bg-slate-800 border border-slate-202 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                  >
                    <option value="">Select target employee...</option>
                    {otherEmployees.map((emp) => (
                      <option key={emp.userId} value={emp.userId}>
                        {emp.name} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-505 block mb-1">Filter Leads by Status</label>
                  <select
                    value={modalStatusFilter}
                    onChange={e => setModalStatusFilter(e.target.value)}
                    className="w-full bg-slate-55 dark:bg-slate-800 border border-slate-202 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer capitalize"
                  >
                    <option value="all">All Statuses</option>
                    <option value="new">New</option>
                    <option value="assigned">Assigned</option>
                    <option value="contacted">Contacted</option>
                    <option value="interested">Interested</option>
                    <option value="callback">Callback</option>
                    <option value="in-progress">In-progress</option>
                    <option value="converted">Converted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Leads List with Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-slate-500 font-semibold">Leads List ({selectedLeadIds.filter(id => modalFilteredLeads.some(l => l.leadId === id)).length} of {modalFilteredLeads.length} filtered leads selected)</span>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-650 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={e => handleSelectAllLeads(e.target.checked)}
                      className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 size-3.5"
                    />
                    Select All Filtered
                  </label>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/10 max-h-[260px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-808/60 p-1">
                  {modalFilteredLeads.map((lead) => (
                    <label
                      key={lead.leadId}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.leadId)}
                        onChange={() => handleToggleLeadSelection(lead.leadId)}
                        className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 size-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{lead.customerName}</span>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0">
                            {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-505 truncate">
                            {lead.loanType || lead.productType || 'Cold Calling'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getLeadStatusStyles(lead.status)}`}>
                            {lead.status}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                  {modalFilteredLeads.length === 0 && (
                    <div className="py-10 text-center text-xs text-slate-400">
                      No leads available matching the selected status.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end items-center gap-4">
              <button
                onClick={() => setIsReassignModalOpen(false)}
                className="text-xs font-semibold text-slate-550 hover:text-slate-850 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReassignment}
                disabled={selectedLeadIds.length === 0 || !selectedTargetEmployee || reassigningInProgress}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
              >
                {reassigningInProgress ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Reassigning...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    <span>Reassign {selectedLeadIds.length} Leads</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
