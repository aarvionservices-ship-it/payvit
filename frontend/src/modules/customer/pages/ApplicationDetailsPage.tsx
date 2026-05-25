import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  Clock, 
  PhoneCall, 
  CreditCard, 
  Calendar, 
  Info,
  ShieldCheck,
  Loader2,
  AlertCircle,
  XCircle,
  PencilLine,
  Upload,
  User,
  Landmark,
  ArrowUpRight,
  RotateCcw,
  Rocket,
  ChevronDown
} from 'lucide-react';
import { getLeadByIdRequest, uploadRequestedDocumentRequest, updateInitialDocumentRequest } from '../../../api/lead.api';
import { getLeadHistoryRequest } from '../../../api/leadHistory.api';
import { toast } from 'react-hot-toast';

const getStatusConfig = (status: string) => {
  const s = status?.toLowerCase() || 'pending';
  switch (s) {
    case 'converted':
    case 'approved':
      return { label: 'Approved', icon: CheckCircle2, color: 'emerald' };
    case 'rejected':
      return { label: 'Rejected', icon: XCircle, color: 'rose' };
    case 'callback':
    case 'contacted':
    case 'interested':
    case 'in-progress':
      return { label: status === 'in-progress' ? 'In Progress' : 'In Review', icon: PhoneCall, color: 'blue' };
    default:
      return { label: 'In Review', icon: Clock, color: 'amber' };
  }
};

export default function ApplicationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    fetchApplicationDetails();
    fetchHistory();
  }, [id]);

  const fetchApplicationDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await getLeadByIdRequest(id);
      if (res.success) {
        setLead(res.data);
      } else {
        toast.error(res.message || 'Failed to load details');
      }
    } catch (err) {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (docName: string, file: File) => {
    try {
      setUploading(docName);
      const base64 = await fileToBase64(file);
      const res = await uploadRequestedDocumentRequest(id!, docName, base64);
      if (res.success) {
        toast.success(`${docName} uploaded successfully!`);
        await fetchApplicationDetails();
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleInitialFileUpload = async (documentType: string, file: File) => {
    try {
      setUploading(documentType);
      const base64 = await fileToBase64(file);
      const res = await updateInitialDocumentRequest(id!, documentType, base64, file.name);
      if (res.success) {
        toast.success(`${documentType} updated successfully!`);
        await fetchApplicationDetails();
      }
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setUploading(null);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
        <AlertCircle className="size-12 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Application Not Found</h2>
        <Link to="/customer/applications" className="text-primary font-bold hover:underline">Back to My Applications</Link>
      </div>
    );
  }

  const statusCfg = getStatusConfig(lead.status);
  const StatusIcon = statusCfg.icon;

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen pb-20">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="flex items-center gap-5 relative z-10">
          <Link to="/customer/applications" className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-primary transition-all shadow-sm group">
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">Application Details</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
              <span className="text-primary font-black">REF ID:</span> {lead.leadId?.slice(-10)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
           <div className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border shadow-sm flex items-center gap-2 ${
             statusCfg.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
             statusCfg.color === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100' :
             statusCfg.color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' :
             'bg-amber-50 text-amber-600 border-amber-100'
           }`}>
             <StatusIcon className="size-4" /> {statusCfg.label}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
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

                   {(lead.interestRate || lead.loanAmount || lead.tenure || lead.processingFee) && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                         {lead.interestRate && (
                           <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Interest Rate</p>
                              <p className="font-black text-slate-900 text-sm">
                                {lead.interestRate.min || lead.interestRate.percentage || lead.interestRate}% 
                                <span className="ml-1 text-[10px] text-slate-400 font-bold">p.a</span>
                             </p>
                           </div>
                         )}
                         {lead.loanAmount && (
                           <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Amount</p>
                              <p className="font-black text-slate-900 text-sm">
                                ₹{(lead.loanAmount.max || lead.loanAmount || 0).toLocaleString()}
                              </p>
                           </div>
                         )}
                         {lead.tenure && (
                           <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Tenure</p>
                              <p className="font-black text-slate-900 text-sm">
                                {lead.tenure.maxMonths || lead.tenure || 'NA'} 
                                <span className="ml-1 text-[10px] text-slate-400 font-bold">Months</span>
                              </p>
                           </div>
                         )}
                         {lead.processingFee && (
                           <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Proc. Fee</p>
                              <p className="font-black text-slate-900 text-sm">
                                {lead.processingFee.percentage 
                                  ? `${lead.processingFee.percentage}%` 
                                  : lead.processingFee || 'Variable'}
                              </p>
                           </div>
                         )}
                      </div>
                   )}
                   {lead.productId && !lead.appliedProduct && (
                      <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                         <RotateCcw className="size-4 text-amber-600 animate-pulse" />
                         <div>
                            <p className="text-xs font-bold text-amber-900">Configuring Offer Link...</p>
                            <p className="text-[10px] text-amber-700 font-medium">Full details will appear once the product configuration is fully synchronized.</p>
                         </div>
                      </div>
                   )}
                </div>
              </div>
              {lead.productId && (
                 <Link 
                   to={`/customer/offers/${lead.productId}`} 
                   className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-2 shadow-md shadow-slate-900/10"
                 >
                   View Product Details <ArrowUpRight className="size-3.5" />
                 </Link>
              )}
            </div>
          </div>

          {/* Main Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 uppercase tracking-tighter">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <CreditCard className="size-4 text-blue-600" />
              </div>
              Product Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               {[
                 { label: 'Loan Type', val: lead.loanType, icon: FileText, color: 'text-primary' },
                 { label: 'Customer Name', val: lead.customerName, icon: User, color: 'text-slate-400' },
                 { label: 'Phone Number', val: lead.phone, icon: PhoneCall, color: 'text-slate-400' },
                 { label: 'Submission Date', val: new Date(lead.createdAt).toLocaleDateString(), icon: Calendar, color: 'text-slate-400' },
               ].map((item, i) => (
                 <div key={i} className="flex items-start gap-4">
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
                       <item.icon className={`size-4 ${item.color}`} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                       <p className="font-bold text-slate-900 leading-tight capitalize">{item.val}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          {/* Document Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 uppercase tracking-tighter">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                  <ShieldCheck className="size-4 text-emerald-600" />
                </div>
                Documents Repository
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lead.documents?.map((doc: any, i: number) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group/doc hover:border-emerald-200 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="size-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                      <FileText className="size-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{doc.documentType?.replace('_', ' ')}</p>
                      <p className="font-bold text-slate-900 truncate text-xs">{doc.name}</p>
                    </div>
                  </div>
                  <label className="cursor-pointer p-2 hover:bg-white rounded-lg transition-all shrink-0">
                    <input 
                       type="file" 
                       className="sr-only" 
                       onChange={(e) => e.target.files?.[0] && handleInitialFileUpload(doc.documentType, e.target.files[0])}
                       disabled={!!uploading}
                    />
                    {uploading === doc.documentType ? <Loader2 className="size-4 animate-spin text-primary" /> : <PencilLine className="size-4 text-slate-400" />}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Requested Documents Section */}
          {lead.requestedDocuments && lead.requestedDocuments.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-primary/20 shadow-sm p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 uppercase tracking-tighter">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Info className="size-4 text-primary" />
                  </div>
                  Action Required
                </h2>
                {lead.requestedDocuments.some((d: any) => d.status === 'pending') && (
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="size-4" /> Pending Action
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lead.requestedDocuments.map((doc: any, i: number) => (
                  <div key={i} className={`p-4 rounded-xl border transition-all ${
                    doc.status === 'uploaded' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-lg flex items-center justify-center ${
                          doc.status === 'uploaded' ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-400'
                        }`}>
                          {doc.status === 'uploaded' ? <CheckCircle2 className="size-5" /> : <FileText className="size-5" />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{doc.name}</p>
                          <p className={`text-[9px] font-black uppercase tracking-widest ${doc.status === 'uploaded' ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {doc.status === 'uploaded' ? 'Received' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {doc.status !== 'uploaded' ? (
                      <label className="relative cursor-pointer block">
                        <input 
                          type="file" 
                          className="sr-only" 
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(doc.name, e.target.files[0])}
                          disabled={!!uploading}
                        />
                        <div className="w-full py-2.5 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-primary/95 transition-all disabled:opacity-50">
                          {uploading === doc.name ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                          {uploading === doc.name ? 'Uploading' : 'Upload Now'}
                        </div>
                      </label>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                         <div className="text-emerald-600 font-black text-[9px] uppercase tracking-widest">Verified Logged</div>
                         <label className="cursor-pointer">
                           <input type="file" className="sr-only" onChange={(e) => e.target.files?.[0] && handleFileUpload(doc.name, e.target.files[0])} />
                           <div className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-primary">
                             <PencilLine className="size-3.5" />
                           </div>
                         </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
            <h2 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tighter">
              <div className="p-1.5 bg-amber-500/10 rounded-lg">
                <Clock className="size-4 text-amber-600" />
              </div>
              Activity Timeline
            </h2>

            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-4 before:h-full before:w-[1.5px] before:bg-slate-100 pb-2">
               {loadingHistory ? (
                 <div className="flex justify-center p-6"><Loader2 className="animate-spin text-slate-300" /></div>
               ) : history.length === 0 ? (
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center py-10">No status updates yet</p>
               ) : (
                 <>
                   {(showAllHistory ? history : history.slice(0, 3)).map((h, idx) => {
                     const configs: Record<string, any> = {
                        LEAD_CREATED: { color: 'emerald', text: 'Application Received', icon: Rocket },
                        LEAD_ASSIGNED: { color: 'indigo', text: 'Executive Assigned', icon: User },
                        STATUS_UPDATED: { color: 'blue', text: 'Status Change', icon: RotateCcw },
                        DOCUMENT_REQUESTED: { color: 'amber', text: 'Doc Requested', icon: AlertCircle },
                        DOCUMENT_UPLOADED: { color: 'emerald', text: 'Doc Uploaded', icon: CheckCircle2 },
                        INITIAL_DOCUMENT_UPDATED: { color: 'teal', text: 'File Updated', icon: FileText }
                     };
                     const config = configs[h.action] || { color: 'slate', text: 'System Update', icon: Info };
                     const Icon = config.icon;
                     
                     return (
                       <div key={idx} className="relative flex items-start gap-5 pl-10">
                          <div className={`absolute left-0 size-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${
                            config.color === 'emerald' ? 'bg-emerald-500 text-white' :
                            config.color === 'blue' ? 'bg-blue-500 text-white' :
                            config.color === 'amber' ? 'bg-amber-500 text-white' :
                            config.color === 'indigo' ? 'bg-indigo-600 text-white' :
                            config.color === 'teal' ? 'bg-teal-600 text-white' :
                            'bg-slate-500 text-white'
                          }`}>
                             <Icon size={12} strokeWidth={3} />
                          </div>
                          <div className="min-w-0">
                             <div className="flex items-center justify-between gap-4">
                               <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{config.text}</p>
                               <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">{new Date(h.createdAt).toLocaleDateString()}</span>
                             </div>
                             {h.details?.note && <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic bg-slate-50 border border-slate-100 p-2 rounded-xl mt-2">"{h.details.note}"</p>}
                             {h.details?.newStatus && (
                               <div className="flex items-center gap-1.5 mt-1.5">
                                 <span className="text-[9px] font-black uppercase text-slate-400">New Status:</span>
                                 <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[8px] font-black uppercase tracking-wider">{h.details.newStatus}</span>
                               </div>
                             )}
                          </div>
                       </div>
                     );
                   })}

                   {history.length > 3 && (
                     <div className="relative z-10 pl-10 pt-2">
                        <button 
                          onClick={() => setShowAllHistory(!showAllHistory)}
                          className="text-[10px] font-black text-primary hover:text-blue-700 uppercase tracking-[0.2em] transition-all flex items-center gap-2 group"
                        >
                          {showAllHistory ? 'Show Less Activities' : `Show All (${history.length})`}
                          <ChevronDown className={`size-3 transition-transform ${showAllHistory ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
                        </button>
                     </div>
                   )}
                 </>
               )}
            </div>
          </div>

          <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-900/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
               <ShieldCheck className="size-20" />
            </div>
            <h4 className="text-lg font-black mb-2 relative z-10 tracking-tight leading-tight">Need Help?</h4>
            <p className="text-xs text-slate-400 font-medium mb-6 relative z-10 leading-relaxed">Our verification experts are processing your file.</p>
            <button onClick={() => toast.success('Connecting to Support...')} className="w-full py-3 bg-white text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

