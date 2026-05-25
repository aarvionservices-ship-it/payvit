import { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  Landmark, 
  CreditCard,
  ArrowLeft,
  Loader2,
  Check,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { getUsersRequest, createCustomerRequest } from '../../../api/user.api';
import { createLeadRequest } from '../../../api/lead.api';
import { getLoans } from '../../../api/loan.api';
import { getCards } from '../../../api/card.api';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../../store/auth.store';

type WorkflowStep = 'customer' | 'lead' | 'success';

export default function CreateLeadPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState<WorkflowStep>('customer');
  const [loading, setLoading] = useState(false);
  const [customerMode, setCustomerMode] = useState<'search' | 'new'>('search');
  const [triedToSubmit, setTriedToSubmit] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    password: 'Password@123'
  });

  const [leadData, setLeadData] = useState<any>({
    loanType: 'personal',
    productType: 'loan',
    productId: '',
    productName: '',
    source: 'employee_referral',
    notes: ''
  });

  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (customerMode === 'search' && searchQuery.length >= 3) {
      const timer = setTimeout(handleSearch, 500);
      return () => clearTimeout(timer);
    } else if (searchQuery.length < 3) {
      setSearchResults([]);
    }
  }, [searchQuery, customerMode]);

  useEffect(() => {
    if (step === 'lead') {
      fetchProducts();
    }
  }, [leadData.loanType, leadData.productType, step]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      if (leadData.productType === 'loan') {
        const response = await getLoans({ loanType: leadData.loanType });
        if (response.success) {
          const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
          setAvailableProducts(data);
        }
      } else {
        const response = await getCards({ type: 'credit' });
        if (response.success) {
          const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
          setAvailableProducts(data);
        }
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      setAvailableProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await getUsersRequest({ search: searchQuery, role: 'customer' });
      if (response.success) {
        setSearchResults(response.data.data || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const validateCustomerStep = () => {
    if (customerMode === 'search') {
      if (!selectedCustomer) {
        toast.error('Identity required');
        return false;
      }
    } else {
      if (!newCustomer.name || !newCustomer.phone || !newCustomer.email) {
        toast.error('Incomplete identity');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email)) {
        toast.error('Invalid email');
        return false;
      }
      if (!/^\d{10}$/.test(newCustomer.phone)) {
        toast.error('Invalid phone');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCustomerStep()) setStep('lead');
  };

  const handleSubmit = async () => {
    setTriedToSubmit(true);
    if (!leadData.productId) {
      toast.error('Asset selection required');
      return;
    }
    if (!leadData.notes?.trim()) {
      toast.error('Operational context required');
      return;
    }
    try {
      setLoading(true);
      let customerId = selectedCustomer?.userId;

      if (customerMode === 'new') {
        const custResponse = await createCustomerRequest(newCustomer);
        if (custResponse.success) {
          customerId = custResponse.data.userId;
        } else throw new Error('Customer sync failed');
      }

      await createLeadRequest({
        customerId,
        customerName: customerMode === 'new' ? newCustomer.name : selectedCustomer.name,
        phone: customerMode === 'new' ? newCustomer.phone : selectedCustomer.phone,
        email: customerMode === 'new' ? newCustomer.email : selectedCustomer.email,
        loanType: leadData.loanType,
        productType: leadData.productType,
        productId: leadData.productId,
        source: leadData.source,
        note: leadData.notes,
        assignedEmployee: user?.userId 
      });
      setStep('success');
    } catch (error: any) {
      toast.error(error.message || 'Workflow dispatch failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20 pt-4 px-3 sm:px-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => step === 'customer' ? navigate('/employee/leads') : setStep('customer')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">Abort</span>
        </button>

        <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((num) => (
              <div 
                key={num} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  (num === 1 && step === 'customer') || 
                  (num === 2 && step === 'lead') ||
                  (num === 3 && step === 'success') 
                    ? 'w-8 bg-primary' : 'w-3 bg-slate-200 dark:bg-slate-800'
                }`} 
              />
            ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'customer' && (
          <motion.div
            key="customer-step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic leading-none">Bridge</h2>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Lead Identity Control</p>
              </div>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                 <button 
                   onClick={() => setCustomerMode('search')}
                   className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${customerMode === 'search' ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   Search
                 </button>
                 <button 
                   onClick={() => setCustomerMode('new')}
                   className={`px-4 py-2 rounded-lg text-[9px) font-black uppercase transition-all ${customerMode === 'new' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   New
                 </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
              <AnimatePresence mode="wait">
                {customerMode === 'search' ? (
                  <motion.div 
                    key="s-view" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="space-y-4"
                  >
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="NAME, MOBILE OR ID..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3.5 pl-11 pr-5 text-xs font-bold uppercase focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                      {searchResults.map((cust) => (
                        <div 
                          key={cust.userId}
                          onClick={() => setSelectedCustomer(cust)}
                          className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between ${selectedCustomer?.userId === cust.userId ? 'bg-primary/5 border-primary' : 'bg-transparent border-slate-50 dark:border-slate-800 hover:bg-slate-50'}`}
                        >
                           <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[10px] text-slate-500">
                                {cust.name[0].toUpperCase()}
                              </div>
                              <div className="overflow-hidden">
                                 <p className="text-[11px] font-black text-slate-900 dark:text-white truncate leading-none">{cust.name}</p>
                                 <p className="text-[8px] font-bold text-slate-400 mt-1">{cust.phone}</p>
                              </div>
                           </div>
                           {selectedCustomer?.userId === cust.userId && <CheckCircle2 className="size-4 text-primary shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="n-view" 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                      <div className="space-y-1.5">
                         <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Name</label>
                         <input 
                           type="text" 
                           value={newCustomer.name}
                           onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 px-4 text-xs font-bold outline-none" 
                           placeholder="John Doe"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone</label>
                         <input 
                           type="text" 
                           value={newCustomer.phone}
                           onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 px-4 text-xs font-bold outline-none" 
                           placeholder="9876543210"
                         />
                      </div>
                      <div className="sm:col-span-2 space-y-1.5">
                         <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Email</label>
                         <input 
                           type="email" 
                           value={newCustomer.email}
                           onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 px-4 text-xs font-bold outline-none" 
                           placeholder="email@domain.com"
                         />
                      </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={handleNextStep}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="size-4" />
            </button>
          </motion.div>
        )}

        {step === 'lead' && (
          <motion.div
            key="lead-step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="px-1">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic leading-none">Market</h2>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Target Configuration</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 space-y-5 shadow-sm">
               <div className="grid grid-cols-2 gap-2">
                 {[
                   { id: 'loan', label: 'Loan', icon: Landmark, color: 'emerald' },
                   { id: 'card', label: 'Card', icon: CreditCard, color: 'indigo' },
                 ].map((t) => (
                   <button
                     key={t.id}
                     onClick={() => setLeadData({...leadData, productType: t.id, loanType: t.id === 'card' ? 'credit_card' : 'personal', productId: '', productName: ''})}
                     className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${leadData.productType === t.id ? `bg-${t.color === 'indigo' ? 'indigo' : 'emerald'}-500/5 border-${t.color === 'indigo' ? 'indigo' : 'emerald'}-500 text-${t.color === 'indigo' ? 'indigo' : 'emerald'}-600` : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400'}`}
                   >
                     <t.icon className="size-5" />
                     <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                   </button>
                 ))}
               </div>

               {leadData.productType === 'loan' && (
                  <div className="flex gap-1.5 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-x-auto hide-scrollbar">
                    {['personal', 'business', 'home'].map((lp) => (
                      <button
                        key={lp}
                        onClick={() => setLeadData({...leadData, loanType: lp, productId: '', productName: ''})}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${leadData.loanType === lp ? 'bg-white dark:bg-slate-900 shadow-sm text-primary' : 'text-slate-400'}`}
                      >
                        {lp}
                      </button>
                    ))}
                  </div>
               )}

               <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Select Asset</span>
                    {loadingProducts && <Loader2 className="size-3 animate-spin text-primary" />}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                     {availableProducts.length > 0 ? (
                       availableProducts.map((p) => {
                         const name = p.loanName || p.cardName || p.name;
                         const bank = p.bankName || p.issuer || p.provider;
                         const id = p._id || p.id;
                         const isSel = leadData.productId === id;
                         const style = leadData.productType === 'card' ? 'indigo' : 'emerald';
                         
                         return (
                           <div 
                             key={id}
                             onClick={() => setLeadData({...leadData, productId: id, productName: name})}
                             className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${isSel ? `bg-${style === 'indigo' ? 'indigo' : 'emerald'}-600 border-${style === 'indigo' ? 'indigo' : 'emerald'}-600 text-white px-4` : 'bg-slate-50 dark:bg-slate-800/30 border-transparent text-slate-800 dark:text-slate-200'}`}
                           >
                              <div className="overflow-hidden py-3">
                                 <p className="text-[10px] font-black uppercase truncate leading-none">{name}</p>
                                 <p className={`text-[8px] font-bold mt-1 truncate ${isSel ? 'text-white/60' : 'text-slate-400'}`}>{bank}</p>
                              </div>
                              {isSel && <CheckCircle2 className="size-4 shrink-0" />}
                           </div>
                         );
                       })
                     ) : !loadingProducts && (
                       <p className="text-center py-6 text-[8px] font-black text-slate-400 uppercase tracking-widest text-slate-300">Portfolios loading...</p>
                     )}
                  </div>
               </div>

               <div className="space-y-1.5 px-1">
                  <div className="flex items-center justify-between">
                    <label className={`text-[8px] font-black uppercase tracking-widest transition-colors ${triedToSubmit && !leadData.notes?.trim() ? 'text-red-500' : 'text-slate-400'}`}>Operational Remarks</label>
                    {triedToSubmit && !leadData.notes?.trim() && <span className="text-[7px] font-black text-red-500 uppercase italic">Required context</span>}
                  </div>
                  <textarea 
                    value={leadData.notes}
                    onChange={(e) => setLeadData({...leadData, notes: e.target.value})}
                    rows={2}
                    placeholder="ENTER PERSISTENT REMARK"
                    className={`w-full bg-slate-50 dark:bg-slate-800 border-2 rounded-xl py-3 px-5 text-[10px] font-bold outline-none resize-none uppercase transition-all ${triedToSubmit && !leadData.notes?.trim() ? 'border-red-500/50 bg-red-50/10' : 'border-transparent focus:bg-white dark:focus:bg-slate-800'}`}
                  />
               </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading || !leadData.productId}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />}
              {loading ? 'Executing...' : 'Deploy Lead'}
            </button>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center space-y-6 py-12"
          >
             <div className="size-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl">
               <Check className="size-10 stroke-[4]" />
             </div>
             <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Engaged</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tracking-widest">Syndication success</p>
             </div>
             <div className="flex flex-col gap-2 w-full max-w-xs">
               <button onClick={() => navigate('/employee/leads')} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest">Terminal</button>
               <button 
                onClick={() => {
                   setStep('customer');
                   setCustomerMode('search');
                   setSelectedCustomer(null);
                   setNewCustomer({ name: '', phone: '', email: '', password: 'Password@123' });
                   setLeadData({ loanType: 'personal', productType: 'loan', productId: '', productName: '', source: 'employee_referral', notes: '' });
                }}
                className="w-full py-4 text-slate-400 text-[9px] font-black uppercase"
               >
                 New Dispatch
               </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

