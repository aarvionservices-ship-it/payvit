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
        toast.error('Phone number must be exactly 10 digits and contain only numbers');
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
    <div className="max-w-3xl mx-auto space-y-6 pb-20 pt-4 px-3 sm:px-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => step === 'customer' ? navigate('/employee/leads') : setStep('customer')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-semibold"
        >
          <ArrowLeft className="size-4" />
          <span>Cancel</span>
        </button>

        <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((num) => (
              <div 
                key={num} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  (num === 1 && step === 'customer') || 
                  (num === 2 && step === 'lead') ||
                  (num === 3 && step === 'success') 
                    ? 'w-8 bg-emerald-650' : 'w-3 bg-slate-200 dark:bg-slate-800'
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
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Customer Selection</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Link an existing customer account or create a new profile</p>
              </div>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                 <button 
                   onClick={() => setCustomerMode('search')}
                   className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${customerMode === 'search' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                 >
                   Search
                 </button>
                 <button 
                   onClick={() => setCustomerMode('new')}
                   className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${customerMode === 'new' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                 >
                   New Profile
                 </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
              <AnimatePresence mode="wait">
                {customerMode === 'search' ? (
                  <motion.div 
                    key="s-view" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="space-y-4"
                  >
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, mobile, or ID..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                      {searchResults.map((cust) => (
                        <div 
                          key={cust.userId}
                          onClick={() => setSelectedCustomer(cust)}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${selectedCustomer?.userId === cust.userId ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500' : 'bg-transparent border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        >
                           <div className="flex items-center gap-3">
                              <div className="size-8 rounded-lg bg-slate-105 dark:bg-slate-850 flex items-center justify-center font-semibold text-xs text-slate-500">
                                {cust.name[0].toUpperCase()}
                              </div>
                              <div className="overflow-hidden">
                                 <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-none">{cust.name}</p>
                                 <p className="text-[10px] text-slate-405 mt-1">{cust.phone}</p>
                              </div>
                           </div>
                           {selectedCustomer?.userId === cust.userId && <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />}
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
                         <label className="text-xs font-medium text-slate-500 dark:text-slate-400 pl-0.5">Name</label>
                         <input 
                           type="text" 
                           value={newCustomer.name}
                           onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-805 rounded-xl py-2.5 px-4 text-xs font-medium outline-none" 
                           placeholder="John Doe"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-xs font-medium text-slate-500 dark:text-slate-400 pl-0.5">Phone</label>
                         <div className="flex gap-2">
                           <select className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-805 rounded-xl px-2 py-2 text-xs font-semibold outline-none cursor-pointer text-slate-700 dark:text-slate-350">
                             <option value="+91">+91 (IN)</option>
                             <option value="+1">+1 (US)</option>
                             <option value="+44">+44 (UK)</option>
                             <option value="+971">+971 (AE)</option>
                           </select>
                           <div className="relative flex-1">
                             <input 
                               type="text" 
                               value={newCustomer.phone}
                               onChange={(e) => {
                                 const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                                 setNewCustomer({...newCustomer, phone: val});
                               }}
                               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-805 rounded-xl py-2.5 px-4 text-xs font-medium outline-none" 
                               placeholder="9876543210"
                             />
                           </div>
                         </div>
                      </div>
                      <div className="sm:col-span-2 space-y-1.5">
                         <label className="text-xs font-medium text-slate-500 dark:text-slate-400 pl-0.5">Email</label>
                         <input 
                           type="email" 
                           value={newCustomer.email}
                           onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-805 rounded-xl py-2.5 px-4 text-xs font-medium outline-none" 
                           placeholder="email@domain.com"
                         />
                      </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={handleNextStep}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
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
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Lead Details</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure the asset and details of the lead record</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 space-y-5 shadow-sm">
               <div className="grid grid-cols-2 gap-2">
                 {[
                   { id: 'loan', label: 'Loan', icon: Landmark, color: 'emerald' },
                   { id: 'card', label: 'Card', icon: CreditCard, color: 'indigo' },
                 ].map((t) => (
                   <button
                     key={t.id}
                     onClick={() => setLeadData({...leadData, productType: t.id, loanType: t.id === 'card' ? 'credit_card' : 'personal', productId: '', productName: ''})}
                     className={`flex items-center justify-center gap-2.5 p-2.5 rounded-xl border transition-all text-xs font-semibold ${leadData.productType === t.id ? 'bg-emerald-50/50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:text-slate-600'}`}
                   >
                     <t.icon className="size-4.5" />
                     <span>{t.label}</span>
                   </button>
                 ))}
               </div>

               {leadData.productType === 'loan' && (
                  <div className="flex gap-1.5 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-x-auto hide-scrollbar">
                    {['personal', 'business', 'home'].map((lp) => (
                      <button
                        key={lp}
                        onClick={() => setLeadData({...leadData, loanType: lp, productId: '', productName: ''})}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${leadData.loanType === lp ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {lp.charAt(0).toUpperCase() + lp.slice(1)}
                      </button>
                    ))}
                  </div>
               )}

               <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Select Asset</span>
                    {loadingProducts && <Loader2 className="size-3 animate-spin text-primary" />}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                     {availableProducts.length > 0 ? (
                       availableProducts.map((p) => {
                         const name = p.loanName || p.cardName || p.name;
                         const bank = p.bankName || p.issuer || p.provider;
                         const id = p._id || p.id;
                         const isSel = leadData.productId === id;
                         
                         return (
                           <div 
                             key={id}
                             onClick={() => setLeadData({...leadData, productId: id, productName: name})}
                             className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isSel ? 'bg-emerald-50/50 border-emerald-550 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-800 dark:text-slate-200 hover:bg-slate-100/50'}`}
                           >
                              <div className="overflow-hidden">
                                 <p className="text-xs font-semibold truncate leading-tight">{name}</p>
                                 <p className={`text-[10px] mt-1 truncate ${isSel ? 'text-emerald-600/70 dark:text-emerald-405' : 'text-slate-400'}`}>{bank}</p>
                              </div>
                              {isSel && <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />}
                           </div>
                         );
                       })
                     ) : !loadingProducts && (
                       <p className="text-center py-6 text-xs text-slate-400 uppercase tracking-wider">No products available...</p>
                     )}
                  </div>
               </div>

               <div className="space-y-1.5 px-1">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-medium transition-colors ${triedToSubmit && !leadData.notes?.trim() ? 'text-red-500' : 'text-slate-500'}`}>Operational Remarks</label>
                    {triedToSubmit && !leadData.notes?.trim() && <span className="text-[10px] font-semibold text-red-500 uppercase">Required</span>}
                  </div>
                  <textarea 
                    value={leadData.notes}
                    onChange={(e) => setLeadData({...leadData, notes: e.target.value})}
                    rows={2}
                    placeholder="Enter notes..."
                    className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl py-2 px-3 text-xs font-medium outline-none resize-none transition-all ${triedToSubmit && !leadData.notes?.trim() ? 'border-red-500/50 bg-red-50/10' : 'border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-slate-200'}`}
                  />
               </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading || !leadData.productId}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />}
              {loading ? 'Creating...' : 'Deploy Lead'}
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
             <div className="size-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
               <Check className="size-8 stroke-[3]" />
             </div>
             <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Lead Created</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">The lead was successfully created and assigned</p>
             </div>
             <div className="flex flex-col gap-2 w-full max-w-xs">
               <button onClick={() => navigate('/employee/leads')} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-semibold transition-colors">Go to Pipeline</button>
               <button 
                onClick={() => {
                   setStep('customer');
                   setCustomerMode('search');
                   setSelectedCustomer(null);
                   setNewCustomer({ name: '', phone: '', email: '', password: 'Password@123' });
                   setLeadData({ loanType: 'personal', productType: 'loan', productId: '', productName: '', source: 'employee_referral', notes: '' });
                }}
                className="w-full py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold transition-colors"
               >
                 Create Another Lead
               </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

