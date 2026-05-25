import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, Image, Landmark, IndianRupee, Zap, Target, Smartphone, Globe, ShieldCheck, PieChart, Activity } from 'lucide-react';
import { getLoanById, updateLoan } from '../../../api/loan.api';
import type { LoanModel } from '../../../types';
import toast from 'react-hot-toast';

export default function EditLoanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<LoanModel>>({
    loanName: '',
    bankName: '',
    provider: '',
    loanType: 'Unsecured',
    category: 'Personal Loan',
    interestRate: { min: 10.5, max: 22, type: 'reducing_balance', notes: '' },
    loanAmount: { min: 50000, max: 4000000, recommendedRange: '' },
    tenure: { minMonths: 12, maxMonths: 60, flexibility: '' },
    feesAndCharges: {
        processingFee: { percentage: 2, maxAmount: 5000, notes: '' },
        foreclosureCharges: { percentage: 4, allowedAfterMonths: 6 },
        partPaymentCharges: { percentage: 2, allowedAfterMonths: 6, conditions: '' },
        latePaymentFee: { percentage: 2, type: 'per_month', description: '' },
        bounceCharges: 500
    },
    eligibility: {
        employmentType: ['Salaried'],
        age: { min: 21, max: 60 },
        minimumIncomeMonthly: { salaried: 25000 },
        creditScore: { minimum: 700, preferred: 750 },
        workExperience: { totalYears: 2, currentJobMonths: 6 },
        residency: 'Indian Citizen',
        cityRequirement: 'Tier 1 & Tier 2 Cities'
    },
    repayment: {
        emiCalculation: 'Reducing Balance',
        modes: ['NACH', 'Auto Debit', 'Post Dated Cheques'],
        partPaymentAllowed: true,
        foreclosureAllowed: true
    },
    disbursal: { time: '24-48 Hours', mode: 'Direct Bank Transfer' },
    documentsRequired: {
        identityProof: ['Aadhaar', 'PAN'],
        addressProof: ['Aadhaar', 'Utility Bill'],
        incomeProof: { salaried: ['3 Months Payslip', '6 Months Bank Statement'] },
    },
    features: [],
    specialOffers: [],
    pros: [],
    cons: [],
    contact: { website: '', customerCare: '' },
    imageUrl: '',
    gradient: 'from-blue-600 to-indigo-700'
  });

  useEffect(() => {
    if (id) {
      async function fetchLoan() {
        try {
          const response = await getLoanById(id!);
          if (response.success) {
            // merge response data carefully
            setFormData(prev => ({ ...prev, ...response.data }));
          } else {
            toast.error(response.message || 'Failed to fetch loan tracking definitions');
            navigate('/admin/loans');
          }
        } catch (error) {
          console.error('Error fetching loan:', error);
        } finally {
          setIsLoading(false);
        }
      }
      fetchLoan();
    }
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.loanName || !formData.bankName || !formData.provider) {
      toast.error('Identity configurations are incomplete');
      return;
    }

    setIsSubmitting(true);
    try {
      const { _id, __v, createdAt, updatedAt, lastUpdated, ...submitData } = formData as any;
      const response = await updateLoan(id!, submitData);
      if (response.success) {
        toast.success('System configuration patched safely');
        navigate('/admin/loans');
      } else {
        toast.error(response.message || 'Constraint violations in payload');
      }
    } catch (error) {
      console.error('Error updating loan:', error);
      toast.error('Data pipeline fault detected');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const setDeepValue = (obj: any, path: string[], value: any): any => {
    if (path.length === 1) return { ...obj, [path[0]]: value };
    const key = path[0];
    return { ...obj, [key]: setDeepValue(obj[key] || {}, path.slice(1), value) };
  };

  const handleDeepInputChange = (path: string[], value: any) => {
    setFormData(prev => setDeepValue(prev, path, value));
  };
  
  const addArrayItem = (field: string, value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...((prev[field as keyof LoanModel] as string[]) || []), value]
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: ((prev[field as keyof LoanModel] as string[]) || []).filter((_, i) => i !== index)
    }));
  };

  if (isLoading) return <div className="p-20 text-center font-black animate-pulse uppercase tracking-[0.3em] text-slate-300">Synchronizing Master Config...</div>;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-10 pb-32">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link to="/admin/loans" className="size-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-none tracking-tight uppercase">Refine Asset Logic</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Constraint Configuration & Matrix Editing #{id?.slice(-6)}</p>
          </div>
        </div>
        <button 
           onClick={handleSubmit}
           disabled={isSubmitting}
           className="px-8 py-4 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2Icon className="size-4 animate-spin" /> : <Save className="size-4" />}
          Deploy Parameter Patch
        </button>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 flex flex-col gap-10">
           {/* Section 1: Core Identity */}
           <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-[#0055ff]/5 -mr-20 blur-[100px] pointer-events-none" />
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                       <Landmark className="size-4" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Identity & Connectivity</h2>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Product Designation (*)</label>
                       <input 
                         type="text" 
                         required
                         value={formData.loanName}
                         onChange={(e) => handleInputChange('loanName', e.target.value)}
                         placeholder="e.g. Imperial Personal Loan"
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Issuing Body (*)</label>
                       <input 
                         type="text" 
                         required
                         value={formData.bankName}
                         onChange={(e) => handleInputChange('bankName', e.target.value)}
                         placeholder="e.g. HDFC Bank"
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Provisioning Vendor (*)</label>
                       <input 
                         type="text" 
                         required
                         value={formData.provider}
                         onChange={(e) => handleInputChange('provider', e.target.value)}
                         placeholder="e.g. HDFC Ltd"
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Asset Category (*)</label>
                       <select 
                         value={formData.category}
                         onChange={(e) => handleInputChange('category', e.target.value)}
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all outline-none appearance-none"
                       >
                         <option>Personal Loan</option>
                         <option>Home Loan</option>
                         <option>Business Loan</option>
                         <option>Car Loan</option>
                         <option>Education Loan</option>
                         <option>Gold Loan</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100/50">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Official Resource Link</label>
                        <div className="relative">
                            <Globe className="absolute left-6 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input 
                            type="text" 
                            value={formData.contact?.website}
                            onChange={(e) => handleDeepInputChange(['contact', 'website'], e.target.value)}
                            placeholder="https://"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 font-bold text-slate-800 outline-none text-sm"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Support Channel</label>
                        <div className="relative">
                            <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input 
                            type="text" 
                            value={formData.contact?.customerCare}
                            onChange={(e) => handleDeepInputChange(['contact', 'customerCare'], e.target.value)}
                            placeholder="+91..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 font-bold text-slate-800 outline-none text-sm"
                            />
                        </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Section 2: Economics */}
           <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-10">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <IndianRupee className="size-4" />
                 </div>
                 <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Yield & Economics</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-8">
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                       <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 pl-1">Standard Interest Vectors (%)</p>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Minimum</label>
                             <input type="number" step="0.01" value={formData.interestRate?.min} onChange={e => handleDeepInputChange(['interestRate', 'min'], parseFloat(e.target.value))} className="w-full bg-white rounded-xl px-4 py-3 font-black text-slate-800 text-sm border border-slate-100" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Maximum</label>
                             <input type="number" step="0.01" value={formData.interestRate?.max} onChange={e => handleDeepInputChange(['interestRate', 'max'], parseFloat(e.target.value))} className="w-full bg-white rounded-xl px-4 py-3 font-black text-slate-800 text-sm border border-slate-100" />
                          </div>
                       </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                       <p className="text-[10px] font-black uppercase tracking-widest text-primary pl-1">Exposure Range (₹)</p>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Floor</label>
                             <input type="number" value={formData.loanAmount?.min} onChange={e => handleDeepInputChange(['loanAmount', 'min'], parseInt(e.target.value))} className="w-full bg-white rounded-xl px-4 py-3 font-black text-slate-800 text-sm border border-slate-100" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Ceiling</label>
                             <input type="number" value={formData.loanAmount?.max} onChange={e => handleDeepInputChange(['loanAmount', 'max'], parseInt(e.target.value))} className="w-full bg-white rounded-xl px-4 py-3 font-black text-slate-800 text-sm border border-slate-100" />
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Calculation Method</label>
                       <div className="flex gap-2">
                          {['reducing_balance', 'fixed', 'floating'].map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => handleDeepInputChange(['interestRate', 'type'], type)}
                              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.interestRate?.type === type ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                            >
                              {type.replace('_', ' ')}
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Tenure Logic (Months)</label>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <input type="number" placeholder="Min" value={formData.tenure?.minMonths} onChange={e => handleDeepInputChange(['tenure', 'minMonths'], parseInt(e.target.value))} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-black text-slate-800 border-none outline-none text-sm" />
                          </div>
                          <div className="space-y-2">
                             <input type="number" placeholder="Max" value={formData.tenure?.maxMonths} onChange={e => handleDeepInputChange(['tenure', 'maxMonths'], parseInt(e.target.value))} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-black text-slate-800 border-none outline-none text-sm" />
                          </div>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Strategic Economic Notes</label>
                       <textarea 
                         rows={4}
                         value={formData.interestRate?.notes}
                         onChange={e => handleDeepInputChange(['interestRate', 'notes'], e.target.value)}
                         placeholder="Describe logic context..."
                         className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-slate-800 outline-none focus:bg-white transition-all resize-none italic text-sm"
                       />
                    </div>
                 </div>
              </div>
           </div>

           {/* Section 3: Fees & Charges */}
           <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-10">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                    <PieChart className="size-4" />
                 </div>
                 <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Monetization & Fees</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Processing Fee %</label>
                    <input type="number" step="0.1" value={formData.feesAndCharges?.processingFee?.percentage} onChange={e => handleDeepInputChange(['feesAndCharges', 'processingFee', 'percentage'], parseFloat(e.target.value))} className="w-full bg-white rounded-xl px-4 py-3 font-black text-slate-800 text-sm border border-slate-100" />
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pt-2">Max Capping (₹)</label>
                    <input type="number" value={formData.feesAndCharges?.processingFee?.maxAmount} onChange={e => handleDeepInputChange(['feesAndCharges', 'processingFee', 'maxAmount'], parseInt(e.target.value))} className="w-full bg-white rounded-xl px-4 py-3 font-black text-slate-800 text-sm border border-slate-100" />
                </div>
                <div className="space-y-2 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Foreclosure %</label>
                    <input type="number" step="0.1" value={formData.feesAndCharges?.foreclosureCharges?.percentage} onChange={e => handleDeepInputChange(['feesAndCharges', 'foreclosureCharges', 'percentage'], parseFloat(e.target.value))} className="w-full bg-white rounded-xl px-4 py-3 font-black text-slate-800 text-sm border border-slate-100" />
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pt-2">Lock-in Period (Months)</label>
                    <input type="number" value={formData.feesAndCharges?.foreclosureCharges?.allowedAfterMonths} onChange={e => handleDeepInputChange(['feesAndCharges', 'foreclosureCharges', 'allowedAfterMonths'], parseInt(e.target.value))} className="w-full bg-white rounded-xl px-4 py-3 font-black text-slate-800 text-sm border border-slate-100" />
                </div>
                <div className="space-y-2 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Part Payment %</label>
                    <input type="number" step="0.1" value={formData.feesAndCharges?.partPaymentCharges?.percentage} onChange={e => handleDeepInputChange(['feesAndCharges', 'partPaymentCharges', 'percentage'], parseFloat(e.target.value))} className="w-full bg-white rounded-xl px-4 py-3 font-black text-slate-800 text-sm border border-slate-100" />
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pt-2">Lock-in Period (Months)</label>
                    <input type="number" value={formData.feesAndCharges?.partPaymentCharges?.allowedAfterMonths} onChange={e => handleDeepInputChange(['feesAndCharges', 'partPaymentCharges', 'allowedAfterMonths'], parseInt(e.target.value))} className="w-full bg-white rounded-xl px-4 py-3 font-black text-slate-800 text-sm border border-slate-100" />
                </div>
              </div>
           </div>

           {/* Section 4: Eligibility Logic */}
           <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <ShieldCheck className="size-4" />
                 </div>
                 <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Security & Eligibility Rule-engine</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="space-y-2 p-4 bg-slate-50 rounded-2xl">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center block">CIBIL Benchmark</label>
                    <input type="number" value={formData.eligibility?.creditScore?.minimum} onChange={e => handleDeepInputChange(['eligibility', 'creditScore', 'minimum'], parseInt(e.target.value))} className="w-full bg-white border-none rounded-xl text-center font-black text-indigo-600 py-3 shadow-sm text-lg" />
                 </div>
                 <div className="space-y-2 p-4 bg-slate-50 rounded-2xl">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center block">Min Pay (Salaried)</label>
                    <input type="number" value={formData.eligibility?.minimumIncomeMonthly?.salaried} onChange={e => handleDeepInputChange(['eligibility', 'minimumIncomeMonthly', 'salaried'], parseInt(e.target.value))} className="w-full bg-white border-none rounded-xl text-center font-black text-indigo-600 py-3 shadow-sm text-lg" />
                 </div>
                 <div className="space-y-2 p-4 bg-slate-50 rounded-2xl">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center block">Experience (Yrs)</label>
                    <input type="number" value={formData.eligibility?.workExperience?.totalYears || 2} onChange={e => handleDeepInputChange(['eligibility', 'workExperience', 'totalYears'], parseInt(e.target.value))} className="w-full bg-white border-none rounded-xl text-center font-black text-indigo-600 py-3 shadow-sm text-lg" />
                 </div>
                 <div className="space-y-2 p-4 bg-slate-50 rounded-2xl">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center block">Age Range</label>
                    <div className="flex items-center gap-2 mt-2">
                        <input type="number" value={formData.eligibility?.age?.min} onChange={e => handleDeepInputChange(['eligibility', 'age', 'min'], parseInt(e.target.value))} className="w-1/2 bg-white border-none rounded-lg text-center font-bold text-slate-700 py-2 shadow-sm text-sm" />
                        <span className="text-slate-300 font-bold">-</span>
                        <input type="number" value={formData.eligibility?.age?.max} onChange={e => handleDeepInputChange(['eligibility', 'age', 'max'], parseInt(e.target.value))} className="w-1/2 bg-white border-none rounded-lg text-center font-bold text-slate-700 py-2 shadow-sm text-sm" />
                    </div>
                 </div>
              </div>
           </div>

           {/* Features & Metrics */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
                 <div className="flex items-center gap-3">
                    <Zap className="size-5 text-purple-500" />
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Privileges</h3>
                 </div>
                 <div className="flex gap-2">
                    <input id="new-feature" type="text" placeholder="Add perk..." className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold outline-none" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addArrayItem('features', (e.target as any).value), (e.target as any).value = "")} />
                    <button type="button" onClick={() => { const input = document.getElementById('new-feature') as HTMLInputElement; addArrayItem('features', input.value); input.value = ""; }} className="p-3 bg-primary text-white rounded-xl"><Plus size={18} /></button>
                 </div>
                 <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar text-sm">
                    {formData.features?.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-[1rem] group hover:bg-slate-100 transition-colors">
                         <span className="text-xs font-bold text-slate-600 truncate mr-4">{f}</span>
                         <button type="button" onClick={() => removeArrayItem('features', i)} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
                 <div className="flex items-center gap-3">
                     <Target className="size-5 text-primary" />
                     <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Strategic Offers</h3>
                 </div>
                 <div className="flex gap-2">
                    <input id="new-offer" type="text" placeholder="Add offer..." className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[10px] font-bold outline-none" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addArrayItem('specialOffers', (e.target as any).value), (e.target as any).value = "")} />
                    <button type="button" onClick={() => { const input = document.getElementById('new-offer') as HTMLInputElement; addArrayItem('specialOffers', input.value); input.value = ""; }} className="p-2 bg-primary/5 text-primary rounded-lg"><Plus size={14} /></button>
                 </div>
                 <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar text-sm">
                    {formData.specialOffers?.map((o, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-[1rem] group hover:bg-slate-100 transition-colors">
                         <span className="text-[10px] font-bold text-slate-600 truncate mr-4">{o}</span>
                         <button type="button" onClick={() => removeArrayItem('specialOffers', i)} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
           {/* Visual Config */}
           <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 space-y-8 sticky top-28 shadow-2xl shadow-slate-900/40 overflow-hidden text-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0055ff]/30 blur-[80px]" />
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-white/10 text-white flex items-center justify-center border border-white/10">
                       <Image className="size-4" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight uppercase leading-none">Visual Deck</h2>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Resource Image URL</label>
                    <input 
                      type="text" 
                      value={formData.imageUrl}
                      onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                      placeholder="https://cloud.com/asset.png"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold text-white text-[11px] outline-none focus:bg-white/10 transition-all shadow-inner"
                    />
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Primary Gradient Profile</label>
                    <input 
                      type="text" 
                      value={formData.gradient}
                      onChange={(e) => handleInputChange('gradient', e.target.value)}
                      placeholder="from-slate-800 to-black"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-black text-white text-[10px] outline-none focus:bg-white/10 transition-all font-mono"
                    />
                 </div>

                 <div className="pt-6 border-t border-white/10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Real-time Sandbox</p>
                    <div className={`relative aspect-[16/10] rounded-3xl overflow-hidden shadow-xl border border-white/10 group bg-slate-800`}>
                       {formData.imageUrl ? (
                         <img src={formData.imageUrl} className="w-full h-full object-cover" onError={(e) => (e.target as any).style.display='none'} />
                       ) : (
                         <div className={`w-full h-full bg-gradient-to-br ${formData.gradient || 'from-slate-800 to-slate-900'}`} />
                       )}
                       <div className="absolute inset-0 bg-black/40" />
                       <div className="absolute top-4 right-4 text-white/50">
                          <Landmark className="size-6 opacity-30" />
                       </div>
                       <div className="absolute bottom-6 left-6 pr-4">
                          <h4 className="text-lg font-black leading-tight uppercase tracking-tight">{formData.loanName || 'Product Identity'}</h4>
                          <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mt-1">{formData.bankName || 'Issuing Authority'}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                 <Activity className="size-5 text-amber-500" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Compliance & Flow</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-bold italic">
                All parameters mapping to <strong className="text-slate-700">Fees</strong> and <strong className="text-slate-700">Eligibility</strong> bypass direct validation hooks on backend. Verify thresholds prior to strategic rollout.
              </p>
           </div>
        </div>
      </form>
    </div>
  );
}

function Loader2Icon({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

