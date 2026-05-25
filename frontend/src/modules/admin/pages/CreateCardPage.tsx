import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, Image, Palette, Info, Settings, HelpCircle, TriangleAlert, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { getCardById, createCard, updateCard } from '../../../api/card.api';
import type { CardModel } from '../../../types';

export default function CreateCardPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(isEdit);
  const [initialFormData, setInitialFormData] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<Partial<CardModel>>({
    cardName: '',
    bank: '',
    type: 'credit',
    category: [],
    network: ['Visa'],
    fees: { joiningFee: 0, annualFee: 0, reloadFee: '', joiningFeeNote: '' },
    eligibility: { age: '18-60', minIncomeMonthly: 20000, creditScore: 700, documentsRequired: [], note: '' },
    features: [],
    tags: [],
    score: { travel: 0, shopping: 0, fuel: 0, lifestyle: 0, dining: 0, premium: 0, forex: 0, business: 0, beginner: 0, secured: 0 },
    bestFor: [],
    description: '',
    imageUrl: '',
    gradient: 'from-slate-700 to-slate-900'
  });

  const hasChanges = initialFormData !== JSON.stringify(formData);

  useEffect(() => {
    if (isEdit) {
      async function fetchCard() {
        try {
          const response = await getCardById(id!);
          if (response.success) {
            setFormData(response.data);
            setInitialFormData(JSON.stringify(response.data));
          }
        } catch (error) {
          console.error('Error fetching card:', error);
        } finally {
          setIsLoading(false);
        }
      }
      fetchCard();
    } else {
      setInitialFormData(JSON.stringify(formData));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let response;
      if (isEdit) {
        response = await updateCard(id!, formData);
      } else {
        response = await createCard(formData);
      }
      if (response.success) {
        navigate('/admin/cards');
      }
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Failed to save card. Check console for details.');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof CardModel] as any),
        [field]: value
      }
    }));
  };

  const handleArrayToggle = (field: string, value: string) => {
    setFormData(prev => {
      const arr = (prev[field as keyof CardModel] as string[]) || [];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(i => i !== value) };
      }
      return { ...prev, [field]: [...arr, value] };
    });
  };

  const handleAddField = (field: string, value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...((prev[field as keyof CardModel] as string[]) || []), value]
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: ((prev[field as keyof CardModel] as string[]) || []).filter((_, i) => i !== index)
    }));
  };

  if (isLoading) return <div className="p-20 text-center font-black animate-pulse uppercase tracking-[0.3em] text-slate-300">Synchronizing Data...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10 pb-32">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link to="/admin/cards" className="size-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{isEdit ? 'Refine Logic' : 'Provision Asset'}</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">{isEdit ? 'Re-calibrating financial product parameters' : 'Initializing new credit card entry in marketplace'}</p>
          </div>
        </div>
      </header>

      {/* Compact Floating Save */}
      <div className="fixed bottom-8 right-6 z-[90]">
        <AnimatePresence>
          {hasChanges && (
            <motion.button 
               initial={{ opacity: 0, scale: 0.8, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.8, y: 20 }}
               type="button"
               onClick={() => setShowConfirm(true)}
               className="px-5 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-2.5 border border-white/10"
            >
              <Save className="size-4" /> 
              <span>Save Progress</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              {/* Background gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-10 -mt-10" />
              
              <div className="relative z-10 text-center space-y-6">
                <div className="size-20 bg-amber-50 dark:bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto border border-amber-100 dark:border-amber-500/20">
                  <TriangleAlert className="size-10 text-amber-500" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Confirm Deployment</h3>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                    You are about to committed these changes to the financial network. This will override existing parameters.
                  </p>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Cancel Request
                  </button>
                  <button 
                    onClick={(e) => {
                      handleSubmit(e as any);
                      setShowConfirm(false);
                    }}
                    className="flex-1 px-6 py-4 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Confirm Update
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
           {/* Section 1: Core Identity */}
           <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                       <Info className="size-4" />
                    </div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase">Card Identity</h2>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Card Name</label>
                       <input 
                         type="text" 
                         required
                         value={formData.cardName}
                         onChange={(e) => handleInputChange('cardName', e.target.value)}
                         placeholder="e.g. Infinia Metal Edition"
                         className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Issuing Bank</label>
                       <input 
                         type="text" 
                         required
                         value={formData.bank}
                         onChange={(e) => handleInputChange('bank', e.target.value)}
                         placeholder="e.g. HDFC Bank"
                         className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Product Type</label>
                       <div className="flex gap-2">
                          {['credit', 'debit', 'prepaid'].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleInputChange('type', t)}
                              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.type === t ? 'bg-primary text-white border-primary shadow-lg shadow-primary/10' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}
                            >
                              {t}
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Payment Network</label>
                       <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                          {['Visa', 'MasterCard', 'Amex', 'RuPay'].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => handleInputChange('network', [n])}
                              className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.network?.[0] === n ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}
                            >
                              {n}
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Section 2: Economics */}
           <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Palette className="size-4" />
                 </div>
                 <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase">Financials</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="grid grid-cols-2 gap-4 h-fit">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Joining Fee</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                          <input 
                            type="number" 
                            value={formData.fees?.joiningFee}
                            onChange={(e) => handleNestedInputChange('fees', 'joiningFee', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-8 pr-4 font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Annual Fee</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                          <input 
                            type="number" 
                            value={formData.fees?.annualFee}
                            onChange={(e) => handleNestedInputChange('fees', 'annualFee', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-8 pr-4 font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                       </div>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Fee Notes</label>
                    <textarea 
                      value={formData.fees?.joiningFeeNote}
                      onChange={(e) => handleNestedInputChange('fees', 'joiningFeeNote', e.target.value)}
                      placeholder="e.g. Free if annual spend > ₹1.5L"
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-xs"
                    />
                 </div>
              </div>
           </div>

           {/* Section 3: Performance Matrix & Categories */}
           <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Settings className="size-4" />
                 </div>
                 <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase">Rankings (0-10)</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                 {Object.keys(formData.score || {}).map((key) => (
                    <div key={key} className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors hover:border-primary/20">
                       <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block text-center leading-none truncate">{key}</label>
                       <input 
                         type="number" 
                         step="0.1"
                         max="10"
                         min="0"
                         value={(formData.score as any)[key]}
                         onChange={(e) => handleNestedInputChange('score', key, parseFloat(e.target.value))}
                         className="w-full bg-transparent border-none rounded-lg py-1 text-center font-black text-primary text-base selection:bg-primary/20"
                       />
                    </div>
                 ))}
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Target Categories</label>
                 <div className="flex flex-wrap gap-2">
                    {['travel', 'shopping', 'fuel', 'lifestyle', 'dining', 'premium', 'forex', 'business', 'beginner', 'secured'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleArrayToggle('category', cat)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.category?.includes(cat) ? 'bg-primary text-white border-primary shadow-lg shadow-primary/10 scale-105' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}
                      >
                        {cat}
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* Features & Tags */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                 <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Key Features</h3>
                 <div className="flex gap-2">
                    <input id="new-feature" type="text" placeholder="Add perk..." className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddField('features', (e.target as any).value), (e.target as any).value = "")} />
                    <button type="button" onClick={() => { const input = document.getElementById('new-feature') as HTMLInputElement; handleAddField('features', input.value); input.value = ""; }} className="size-11 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"><Plus size={20} /></button>
                 </div>
                 <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {formData.features?.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group border border-transparent hover:border-slate-100">
                         <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{f}</span>
                         <button type="button" onClick={() => removeArrayItem('features', i)} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-600"><Trash2 size={14} /></button>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                 <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Audience Segments</h3>
                 <div className="flex gap-2">
                    <input id="new-bestfor" type="text" placeholder="Add segment..." className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddField('bestFor', (e.target as any).value), (e.target as any).value = "")} />
                    <button type="button" onClick={() => { const input = document.getElementById('new-bestfor') as HTMLInputElement; handleAddField('bestFor', input.value); input.value = ""; }} className="size-11 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20"><Plus size={20} /></button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {formData.bestFor?.map((b, i) => (
                      <span key={i} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-2">
                        {b}
                        <button type="button" onClick={() => removeArrayItem('bestFor', i)} className="text-emerald-400 hover:text-emerald-700">×</button>
                      </span>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: Visual Elements */}
        <div className="lg:col-span-4 sticky top-6 space-y-8">
           <div className="bg-slate-900 dark:bg-black text-white rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl shadow-slate-900/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px]" />
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/10">
                       <Image className="size-4" />
                    </div>
                    <h2 className="text-sm font-black tracking-widest uppercase">Visual Preview</h2>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Asset Source URL</label>
                       <input 
                         type="text" 
                         value={formData.imageUrl}
                         onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                         placeholder="https://..."
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-[11px] font-bold text-white outline-none focus:bg-white/10 transition-all"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Fallback Gradient</label>
                       <input 
                         type="text" 
                         value={formData.gradient}
                         onChange={(e) => handleInputChange('gradient', e.target.value)}
                         placeholder="from-blue-600 to-indigo-700"
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-[10px] font-mono font-bold text-white outline-none focus:bg-white/10 transition-all"
                       />
                    </div>
                 </div>

                 <div className="pt-8 border-t border-white/10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Live Canvas</p>
                    <div className="relative aspect-[1.58/1] rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-slate-800">
                       {formData.imageUrl ? (
                         <img src={formData.imageUrl} className="w-full h-full object-cover" onError={(e) => (e.target as any).style.display='none'} />
                       ) : (
                         <div className={`w-full h-full bg-gradient-to-br ${formData.gradient}`} />
                       )}
                       <div className="absolute inset-0 bg-black/30" />
                       <div className="absolute top-4 left-4 size-7 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10">
                          <span className="material-symbols-outlined text-[10px] font-black">contactless</span>
                       </div>
                       <div className="absolute bottom-5 left-5 right-5">
                          <h4 className="text-base font-black leading-tight uppercase tracking-tight text-white line-clamp-1">{formData.cardName || 'Portfoliio Entry'}</h4>
                          <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em] mt-1">{formData.bank || 'Issuing Institution'}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                 <HelpCircle className="size-4 text-slate-400" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-200">System Guidelines</h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Ensure all financial yields (0-10) are calibrated against marketplace averages. Annual fees must include applicable taxes where noted.
              </p>
           </div>
        </div>
      </form>
    </div>
  );
}

