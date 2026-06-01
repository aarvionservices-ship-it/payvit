import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Briefcase, Calendar, Clock, FileText, Share2, Loader2, AlertCircle, Landmark, ArrowUpRight } from 'lucide-react';
import { getLeadByIdRequest } from '../../../api/lead.api';
import { getLeadHistoryRequest } from '../../../api/leadHistory.api';
import { toast } from 'react-hot-toast';

export default function LeadDetailsPage() {
  const { id } = useParams<{ id: string }>();
  
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const fetchLead = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await getLeadByIdRequest(id);
      if (res.success && res.data) {
        setLead(res.data);
      }
    } catch (err: any) {
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!id) return;
    try {
      setLoadingHistory(true);
      const res = await getLeadHistoryRequest(id);
      if (res.success) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchLead();
    fetchHistory();
  }, [id]);

  if (loading) {
     return (
       <div className="flex items-center justify-center min-h-screen bg-slate-50">
         <Loader2 className="size-10 animate-spin text-blue-600" />
       </div>
     );
  }

  if (!lead) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
         <AlertCircle className="size-10 text-rose-500" />
         <h2 className="text-xl font-bold text-slate-700">Lead not found</h2>
         <Link to="/admin/leads" className="text-sm font-bold text-blue-600 underline">Return to Leads</Link>
       </div>
     );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'converted': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-rose-100 text-rose-700';
      case 'new': return 'bg-blue-100 text-blue-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50/50 min-h-screen pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <Link to="/admin/leads" className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm group">
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Lead Details</h1>
            <p className="text-slate-500 font-medium text-sm text-center md:text-left">Full management of customer lead file</p>
          </div>
        </div>
        <div className="relative z-10">
          <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-current/10 ${getStatusColor(lead.status)}`}>
            {lead.status || 'New'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Applied Product Section */}
          {lead.leadType === 'cold_calling' ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
              <div className="flex items-center gap-4">
                <div className="size-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-200/20">
                   <Phone className="size-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Lead Origin</p>
                   <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Cold Calling Campaign</h2>
                   <div className="flex flex-wrap items-center gap-3 mt-2">
                      <div className="bg-slate-100 px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-tight border border-slate-200/50">
                        Spreadsheet Import
                      </div>
                      <div className="bg-indigo-100 px-2.5 py-1 rounded-lg text-[10px] font-black text-indigo-600 uppercase tracking-tight border border-indigo-200/50">
                        Cold Calling Lead
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 border border-amber-200/20">
                     <Landmark className="size-6" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Applied For</p>
                     <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">{lead.productName || 'Personal Loan Application'}</h2>
                     <div className="flex flex-wrap items-center gap-3 mt-2">
                        <div className="bg-slate-100 px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-tight flex items-center gap-1.5 border border-slate-200/50">
                          <Landmark className="size-3" /> {lead.bankName || 'PayVit Partner'}
                        </div>
                        <div className="bg-blue-100 px-2.5 py-1 rounded-lg text-[10px] font-black text-blue-600 uppercase tracking-tight border border-blue-200/50">
                          {lead.appliedProduct?.category || lead.productType || 'loan'}
                        </div>
                     </div>
                  </div>
                </div>
                {lead.productId && (
                   <Link 
                     to={`/admin/offers/${lead.productId}`} // Or wherever admin offer view is
                     className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-2 shadow-md shadow-slate-900/10"
                   >
                     Offer Config <ArrowUpRight className="size-3.5" />
                   </Link>
                )}
              </div>

              {lead.appliedProduct && (
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                    {lead.appliedProduct.interestRate && (
                      <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Interest Rate</p>
                          <p className="font-black text-slate-900 text-sm">{lead.appliedProduct.interestRate.min}% <span className="text-[10px] text-slate-400 font-bold">p.a</span></p>
                      </div>
                    )}
                    {lead.appliedProduct.loanAmount && (
                      <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Amount</p>
                          <p className="font-black text-slate-900 text-sm">₹{lead.appliedProduct.loanAmount.max?.toLocaleString()}</p>
                      </div>
                    )}
                    {lead.appliedProduct.tenure && (
                      <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Tenure</p>
                          <p className="font-black text-slate-900 text-sm">{lead.appliedProduct.tenure.maxMonths} <span className="text-[10px] text-slate-400 font-bold">Months</span></p>
                      </div>
                    )}
                    {lead.appliedProduct.processingFee && (
                      <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Proc. Fee</p>
                          <p className="font-black text-slate-900 text-sm">{lead.appliedProduct.processingFee}</p>
                      </div>
                    )}
                 </div>
              )}
            </div>
          )}

          {/* Customer Information */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <User className="size-5 text-blue-600" /> Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 shrink-0">
                  <User className="size-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Full Name</p>
                  <p className="font-bold text-slate-900">{lead.customerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 shrink-0">
                  <Phone className="size-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Phone Number</p>
                  <p className="font-bold text-slate-900">{lead.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 shrink-0">
                  <Mail className="size-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Email Address</p>
                  <p className="font-bold text-slate-900">{lead.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 shrink-0">
                  <Share2 className="size-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Source</p>
                  <p className="font-bold text-slate-900 capitalize">{lead.source || 'Direct'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Briefcase className="size-5 text-emerald-600" /> Lead Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{lead.leadType === 'cold_calling' ? 'Classification' : 'Loan Type'}</label>
                <p className="font-bold text-slate-700 capitalize p-3 bg-slate-50 rounded-xl border border-slate-100">{lead.loanType || "Cold Calling"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Assigned To</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="size-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                    {lead.assignedEmployeeName ? lead.assignedEmployeeName.charAt(0) : 'NA'}
                  </div>
                  <p className="font-bold text-slate-700">{lead.assignedEmployeeName || 'Not Assigned'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Created On</label>
                <p className="font-bold text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                  <Calendar className="size-4 text-slate-400" />
                  {new Date(lead.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Clock className="size-5 text-slate-400" /> Activity History
          </h2>
          
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-slate-200 before:to-slate-200">
            
            {loadingHistory ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-300" /></div>
            ) : history.length === 0 ? (
                <p className="text-center py-10 text-slate-400 text-sm italic">No records yet</p>
            ) : history.map((h, idx) => {
                const configs: Record<string, any> = {
                    LEAD_CREATED: { icon: User, color: 'emerald', text: 'Lead Generated' },
                    LEAD_ASSIGNED: { icon: Briefcase, color: 'indigo', text: `Assigned to ${h.details?.employeeName || h.details?.employeeId}` },
                    STATUS_UPDATED: { icon: FileText, color: 'blue', text: `Status Changed to ${h.details?.status}` },
                    DOCUMENT_REQUESTED: { icon: Share2, color: 'purple', text: `Request Sent: ${h.details?.documentName}` },
                    DOCUMENT_UPLOADED: { icon: FileText, color: 'pink', text: `Document Received: ${h.details?.documentName}` },
                    INITIAL_DOCUMENT_UPDATED: { icon: Briefcase, color: 'teal', text: `File Correction: ${h.details?.documentType}` }
                };
                
                const config = configs[h.action] || { icon: Clock, color: 'slate', text: h.action };
                const IconComp = config.icon;

                return (
                  <div key={idx} className="relative flex items-start gap-4 group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-white text-slate-400 shadow-md shrink-0 z-10 transition-transform group-hover:scale-110">
                      <IconComp className="size-4" />
                    </div>
                    <div className="flex-1 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                         <div className="font-bold text-slate-900 text-sm">{config.text}</div>
                         <time className="text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full w-fit">
                           {new Date(h.createdAt).toLocaleDateString()}
                         </time>
                       </div>
                       {h.details?.note && <div className="whitespace-pre-line text-sm text-slate-500 leading-relaxed italic border-l-2 border-slate-100 pl-3 py-1 mb-2">{h.details.note}</div>}
                       <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-2 border-t border-slate-50">
                         {h.role} &bull; {h.performedBy?.slice(-8)}
                       </div>
                    </div>
                  </div>
                );
            })}

          </div>
        </div>
      </div>
    </main>
  );
}


