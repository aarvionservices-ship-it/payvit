import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Briefcase, Clock, Save, CheckCircle2, FileText, Share2, Loader2, AlertCircle, Upload, Plus, UserPlus, Landmark, ArrowUpRight, MessageSquare } from 'lucide-react';
import { getLeadByIdRequest, updateLeadStatusRequest, requestDocumentRequest, addCommunicationLogRequest, getCommunicationLogsRequest } from '../../../api/lead.api';
import { getLeadHistoryRequest } from '../../../api/leadHistory.api';
import { toast } from 'react-hot-toast';

export default function LeadDetailsPage() {
  const { id } = useParams<{ id: string }>();
  
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<string>('new');
  const [note, setNote] = useState<string>('');
  const [requestDocName, setRequestDocName] = useState<string>('');
  const [requesting, setRequesting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loggingType, setLoggingType] = useState('call');
  const [logOutcome, setLogOutcome] = useState('interested');
  const [logContent, setLogContent] = useState('');
  const [logging, setLogging] = useState(false);
  
  const fetchLead = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await getLeadByIdRequest(id);
      if (res.success && res.data) {
        setLead(res.data);
        setStatus(res.data.status || 'new');
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

  const fetchLogs = async () => {
    if (!id) return;
    try {
      setLoadingLogs(true);
      const res = await getCommunicationLogsRequest(id);
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLead();
    fetchHistory();
    fetchLogs();
  }, [id]);

  const handleUpdate = async (e?: React.FormEvent, forceStatus?: string) => {
    if (e) e.preventDefault();
    if (!id || !lead) return;

    try {
      setUpdating(true);
      const newStatus = forceStatus || status;
      const res = await updateLeadStatusRequest(id, { status: newStatus, note });
      if (res.success) {
         toast.success('Lead updated successfully!');
         setNote('');
         await fetchLead();
         await fetchHistory();
      }
    } catch (err) {
      toast.error('Could not update lead status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !logContent) return;

    try {
      setLogging(true);
      const res = await addCommunicationLogRequest(id, {
        type: loggingType,
        outcome: logOutcome,
        content: logContent,
        timestamp: new Date()
      });
      if (res.success) {
        toast.success("Interaction logged successfully");
        setLogContent('');
        await fetchLogs();
        // Also update status if it was interested/callback
        if (logOutcome === 'interested' && status !== 'interested') {
           await handleUpdate(undefined, 'interested');
        } else if (logOutcome === 'callback_requested' && status !== 'callback') {
           await handleUpdate(undefined, 'callback');
        }
      }
    } catch (err) {
      toast.error("Failed to log interaction");
    } finally {
      setLogging(false);
    }
  };
  const handleRequestDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !requestDocName) return;

    try {
      setRequesting(true);
      const res = await requestDocumentRequest(id, requestDocName);
      if (res.success) {
        toast.success(`Requested ${requestDocName} from customer`);
        setRequestDocName('');
        await fetchLead();
        await fetchHistory();
      }
    } catch (err) {
      toast.error('Failed to request document');
    } finally {
      setRequesting(false);
    }
  };
  if (loading) {
     return (
       <div className="flex items-center justify-center min-h-screen bg-slate-50">
         <Loader2 className="size-10 animate-spin text-emerald-600" />
       </div>
     );
  }

  if (!lead) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
         <AlertCircle className="size-10 text-rose-500" />
         <h2 className="text-xl font-bold text-slate-700">Lead not found</h2>
         <Link to="/employee/leads" className="text-sm font-bold text-emerald-600 underline">Return to Leads</Link>
       </div>
     );
  }

  return (
    <main className="px-3 md:px-6 py-6 max-w-7xl mx-auto space-y-4 md:space-y-6 bg-slate-50/50 min-h-screen pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <Link to="/employee/leads" className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-emerald-600 transition-all shadow-sm group">
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase italic leading-none">Terminal</h1>
            <p className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.2em] mt-1">Lead Analysis & Control</p>
          </div>
        </div>
        <div className="flex gap-2 relative z-10">
          {status !== 'rejected' && (
            <button 
              onClick={() => handleUpdate(undefined, 'converted')}
              disabled={updating || status === 'converted'}
              className="flex-1 md:flex-none px-6 py-3.5 text-[10px] font-black text-white bg-slate-900 rounded-2xl transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
            >
              {updating ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {status === 'converted' ? 'Converted' : 'Convert'}
            </button>
          )}
          {status === 'rejected' && (
             <span className="px-5 py-3 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2 uppercase tracking-widest">
               <AlertCircle className="size-4" /> Rejected
             </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Applied Product Section */}
          {lead.leadType === 'cold_calling' ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-5 md:p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20"></div>
              <div className="flex items-center gap-4">
                <div className="size-14 md:size-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 shrink-0">
                   <Phone className="size-6 md:size-8" />
                </div>
                <div className="min-w-0">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">Lead Origin</p>
                   <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">Cold Calling Campaign</h2>
                   <div className="flex flex-wrap items-center gap-2 mt-3">
                      <div className="bg-slate-50 px-3 py-1.5 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-100">
                        Spreadsheet Import
                      </div>
                      <div className="bg-indigo-50 px-3 py-1.5 rounded-xl text-[9px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100">
                        Cold Calling Lead
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-5 md:p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/20"></div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="size-14 md:size-16 bg-amber-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-amber-500/20 shrink-0">
                     <Landmark className="size-6 md:size-8" />
                  </div>
                  <div className="min-w-0">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">Primary Portfolio</p>
                     <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">{lead.productName || 'Asset Unlinked'}</h2>
                     <div className="flex flex-wrap items-center gap-2 mt-3">
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border border-slate-100">
                          <Landmark className="size-3" /> {lead.bankName || 'Partner'}
                        </div>
                        <div className="bg-blue-50 px-3 py-1.5 rounded-xl text-[9px] font-black text-blue-600 uppercase tracking-widest border border-blue-100">
                          {lead.appliedProduct?.category || lead.productType || 'Segment'}
                        </div>
                     </div>
                  </div>
                </div>
                {lead.productId && (
                   <Link 
                     to={`/loan/${lead.productId}`} 
                     className="w-full sm:w-auto px-6 py-3.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                   >
                     Details <ArrowUpRight className="size-4" />
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
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-5 md:p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20"></div>
            <h2 className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
              <User className="size-4" /> Identity Data
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex items-start gap-4">
                <div className="size-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0">
                  <User className="size-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                  <p className="text-[13px] font-black text-slate-900 leading-none">{lead.customerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="size-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0">
                  <Phone className="size-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="text-[13px] font-black text-slate-900 leading-none">{lead.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="size-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0">
                  <Mail className="size-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                  <p className="text-[13px] font-black text-slate-900 leading-none truncate max-w-[200px]">{lead.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="size-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0">
                  <Share2 className="size-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Engagement Source</p>
                  <p className="text-[13px] font-black text-slate-900 leading-none capitalize">{lead.source || 'LeadGen'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-5 md:p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/20"></div>
            <h2 className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
              <FileText className="size-4" /> Validation Assets
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {lead.documents && lead.documents.length > 0 ? (
                lead.documents.map((doc: any, idx: number) => (
                  <div key={idx} className="p-3 border border-slate-100 rounded-2xl bg-slate-50 flex flex-col gap-3 group transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="size-8 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                        <FileText className="size-3.5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-900 truncate uppercase">{doc.documentType?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <a 
                      href={doc.url} 
                      download={doc.name} 
                      className="w-full py-2 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                    >
                      View
                    </a>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-6 text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Awaiting Verification Files</p>
                </div>
              )}
            </div>

            {/* Request Form Integrated Here */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Request New Doc</p>
              <form className="flex flex-col sm:flex-row gap-4" onSubmit={handleRequestDocument}>
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" 
                    value={requestDocName}
                    onChange={e => setRequestDocName(e.target.value)}
                    placeholder="Enter document name (e.g., Salary Slip)" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-700"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={requesting || !requestDocName} 
                  className="px-6 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {requesting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Request
                </button>
              </form>

              {lead.requestedDocuments && lead.requestedDocuments.length > 0 && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lead.requestedDocuments.map((rd: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${rd.status === 'uploaded' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {rd.status === 'uploaded' ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">{rd.name}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{rd.status}</p>
                        </div>
                      </div>
                      {rd.status === 'uploaded' && (
                        <a href={rd.url} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-white rounded-lg transition-colors">
                           <Upload className="size-3.5 text-primary" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CRM Actions */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-5 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20"></div>
          <h2 className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
            <Briefcase className="size-4" /> Action Control
          </h2>
          <form className="space-y-5" onSubmit={handleUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Stage</label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none"
                >
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
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">{lead.leadType === 'cold_calling' ? 'Classification' : 'Asset Class'}</label>
                <input 
                  type="text" 
                  value={lead.loanType || "Cold Calling"}
                  readOnly
                  className="w-full bg-slate-50/50 border-none rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed opacity-60"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Internal Note</label>
              <textarea 
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="PERSIST STATUS UPDATE REMARK..."
                rows={2}
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-[11px] font-black uppercase placeholder:opacity-30 focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none resize-none"
              />
            </div>

            <button type="submit" disabled={updating} className="w-full py-4 text-[10px] font-black text-white bg-slate-900 rounded-2xl transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 uppercase tracking-widest">
              {updating ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Commit Update
            </button>
          </form>
        </div>
      </div>

      {/* Communication Log Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Add Log Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Phone className="size-5 text-blue-600" /> Log Interaction
          </h2>
          <form onSubmit={handleAddLog} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Type</label>
                <select 
                  value={loggingType} 
                  onChange={e => setLoggingType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="call">Call Log</option>
                  <option value="message">Message Sent</option>
                  <option value="remark">Internal Remark</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Outcome</label>
                <select 
                  value={logOutcome} 
                  onChange={e => setLogOutcome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="interested">Interested</option>
                  <option value="callback_requested">Callback Requested</option>
                  <option value="no_answer">No Answer</option>
                  <option value="busy">Line Busy</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Notes / Message Content</label>
              <textarea 
                value={logContent}
                onChange={e => setLogContent(e.target.value)}
                placeholder="Detail your conversation or message here..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
              />
            </div>
            <button 
              type="submit" 
              disabled={logging || !logContent}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {logging ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save Interaction
            </button>
          </form>
        </div>

        {/* Interaction History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-5 text-indigo-500" /> Interaction Log
            </div>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-widest">{logs.length} Entries</span>
          </h2>
          <div className="flex-1 overflow-y-auto max-h-[350px] space-y-4 pr-1 custom-scrollbar">
            {loadingLogs ? (
               <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-300" /></div>
            ) : logs.length === 0 ? (
               <div className="text-center py-10 opacity-50 space-y-3">
                  <MessageSquare className="size-10 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-400 italic uppercase">No communications logged</p>
               </div>
            ) : logs.map((log, idx) => {
              const colors: Record<string, string> = {
                 call: 'blue',
                 message: 'emerald',
                 remark: 'amber',
                 meeting: 'purple'
              };
              const color = colors[log.type] || 'slate';
              return (
                <div key={idx} className={`p-4 rounded-2xl border border-slate-50 bg-${color}-50/30 space-y-3`}>
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-${color}-100 text-${color}-600`}>
                           {log.type === 'call' ? <Phone className="size-3" /> : log.type === 'message' ? <Mail className="size-3" /> : <FileText className="size-3" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">{log.type}</p>
                          <p className={`text-xs font-black text-${color}-700 mt-1 capitalize`}>{log.outcome.replace('_', ' ')}</p>
                        </div>
                     </div>
                     <time className="text-[10px] font-bold text-slate-400">{new Date(log.createdAt).toLocaleString()}</time>
                  </div>
                  <p className="whitespace-pre-line text-sm text-slate-700 font-medium leading-relaxed bg-white/50 p-3 rounded-xl border border-white">
                    {log.content}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <div className="size-4 bg-white rounded-full flex items-center justify-center border border-slate-100 uppercase text-[8px]">{log.employeeName?.charAt(0)}</div>
                    {log.employeeName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lead Timeline */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 md:p-8">
        <h2 className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2 border-b border-slate-50 pb-4">
          <Clock className="size-4" /> Operations Timeline
        </h2>
        
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
          {loadingHistory ? (
             <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : history.length === 0 ? (
             <p className="text-center py-10 text-[10px] font-black uppercase text-slate-400">No activity logged</p>
          ) : history.map((h, idx) => {
            const timelineConfigs: Record<string, any> = {
               LEAD_CREATED: { icon: User, color: 'emerald', text: 'Identity Logged' },
               LEAD_ASSIGNED: { icon: UserPlus, color: 'indigo', text: 'Control Assigned' },
               STATUS_UPDATED: { icon: CheckCircle2, color: 'blue', text: `Stage: ${h.details?.status}` },
               DOCUMENT_REQUESTED: { icon: Share2, color: 'purple', text: `Asset Req: ${h.details?.documentName}` },
               DOCUMENT_UPLOADED: { icon: Upload, color: 'pink', text: `Asset Sync: ${h.details?.documentName}` },
               INITIAL_DOCUMENT_UPDATED: { icon: FileText, color: 'teal', text: `Asset Update: ${h.details?.documentType}` },
               COMMUNICATION_LOGGED: { 
                  icon: h.details?.type === 'call' ? Phone : h.details?.type === 'message' ? MessageSquare : FileText, 
                  color: h.details?.type === 'call' ? 'blue' : h.details?.type === 'message' ? 'emerald' : 'amber', 
                  text: `${h.details?.type?.toUpperCase()}: ${h.details?.outcome?.replace('_', ' ')}` 
               }
            };
            
            const config = timelineConfigs[h.action] || { icon: Clock, color: 'slate', text: h.action };
            const IconComp = config.icon;

            return (
              <div key={idx} className="relative flex items-start gap-4 group">
                <div className="size-8 rounded-full border-4 border-white bg-slate-50 text-slate-400 shadow-sm flex items-center justify-center shrink-0 z-10">
                  <IconComp className="size-3" />
                 </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between mb-1">
                     <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none group-hover:text-primary transition-colors">{config.text}</p>
                     <time className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(h.createdAt).toLocaleDateString()}</time>
                  </div>
                  {h.details?.note && (
                    <p className="whitespace-pre-line text-[10px] font-medium text-slate-500 leading-relaxed bg-slate-50/50 p-2 rounded-xl border border-slate-100/50 mt-2">
                       {h.details.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

