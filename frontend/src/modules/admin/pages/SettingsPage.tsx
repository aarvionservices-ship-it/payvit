import { useState, useEffect } from 'react';
import { 
  Settings, 
  Bell, 
  Mail, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  RefreshCw,
  Layout,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSettings, updateSettings } from '../../../api/settings.api';

type TabType = 'general' | 'ui' | 'communication' | 'notification' | 'email';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [originalSettings, setOriginalSettings] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await getSettings();
        if (response.success) {
          setSettings(response.data);
          setOriginalSettings(response.data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const hasChanges = settings && originalSettings && JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await updateSettings(settings);
      if (response.success) {
        setOriginalSettings(settings);
        setShowConfirmModal(false);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = (section: string, field: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const addCategory = () => {
    const newCat = {
      id: `new-category-${Date.now()}`,
      name: 'New Category',
      theme: 'from-blue-600 to-indigo-700',
      icon: 'auto_awesome',
      imageUrl: '',
      quote: 'Add a professional quote here...',
      color: 'text-blue-600'
    };
    setSettings((prev: any) => ({
      ...prev,
      ui: {
        ...prev.ui,
        categories: [...(prev.ui.categories || []), newCat]
      }
    }));
  };

  const deleteCategory = (id: string) => {
    setSettings((prev: any) => ({
      ...prev,
      ui: {
        ...prev.ui,
        categories: prev.ui.categories.filter((c: any) => c.id !== id)
      }
    }));
  };

  const updateCategory = (id: string, field: string, value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      ui: {
        ...prev.ui,
        categories: prev.ui.categories.map((c: any) => c.id === id ? { ...c, [field]: value } : c)
      }
    }));
  };

  if (isLoading) return <div className="p-20 text-center font-black animate-pulse text-slate-300 uppercase tracking-widest">Accessing Core Config...</div>;

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'ui', label: 'UI & UX', icon: Layout },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'notification', label: 'Notifications', icon: Bell },
    { id: 'email', label: 'Email Engine', icon: Mail },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-10 pb-32">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 leading-none uppercase italic">Architectural Logic</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3">Platform Orchestration & Global Configuration</p>
        </div>
      </header>

      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-10 right-10 z-[80]"
          >
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isSaving}
              className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all flex items-center gap-3 border-4 border-white dark:border-slate-900"
            >
              {isSaving ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-5" />}
              Deploy Strategic Sync
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-3xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Core Identity</h3>
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Platform Alias</label>
                        <input 
                          type="text" 
                          value={settings.general?.platformName || ''}
                          onChange={(e) => handleUpdate('general', 'platformName', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-5 py-4 font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                     </div>
                     <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">Auto Assignment</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase font-black uppercase tracking-[0.1em]">Round-robin Lead Logic</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={settings.general?.autoLeadAssignment} 
                            onChange={(e) => handleUpdate('general', 'autoLeadAssignment', e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                     </div>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Marketplace Economics</h3>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Base Commission (%)</label>
                        <input 
                          type="number" 
                          value={settings.general?.defaultCommissionRate || 0}
                          onChange={(e) => handleUpdate('general', 'defaultCommissionRate', parseFloat(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-5 py-4 font-black text-primary text-xl outline-none"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Payout Floor (₹)</label>
                        <input 
                          type="number" 
                          value={settings.general?.minPayoutThreshold || 0}
                          onChange={(e) => handleUpdate('general', 'minPayoutThreshold', parseFloat(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-5 py-4 font-black text-slate-900 dark:text-white text-xl outline-none"
                        />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'ui' && (
            <div className="space-y-8">
               <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Marketplace DNA</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configuring Categories, Visual Themes & Hero Assets</p>
                  </div>
                  <button 
                    onClick={addCategory}
                    className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus className="size-5" />
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {settings.ui?.categories?.map((cat: any) => (
                    <div key={cat.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all group">
                       <div className="flex items-center justify-between mb-6">
                          <input 
                            value={cat.icon || ''} 
                            onChange={(e) => updateCategory(cat.id, 'icon', e.target.value)}
                            className="bg-primary/5 text-primary text-[10px] font-black uppercase px-2 py-1 rounded border border-primary/10 w-24 outline-none"
                            placeholder="icon name"
                          />
                          <button onClick={() => deleteCategory(cat.id)} className="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Trash2 size={16} />
                          </button>
                       </div>
                       <div className="space-y-4">
                          <input 
                            value={cat.name || ''} 
                            onChange={(e) => updateCategory(cat.id, 'name', e.target.value)}
                            className="block w-full text-xl font-black text-slate-900 dark:text-white border-none bg-transparent p-0 focus:ring-0 outline-none"
                          />
                          <input 
                            value={cat.quote || ''} 
                            onChange={(e) => updateCategory(cat.id, 'quote', e.target.value)}
                            className="block w-full text-[10px] font-bold italic text-slate-400 border-none bg-transparent p-0 focus:ring-0 outline-none"
                            placeholder="Category quote..."
                          />
                          <div className="pt-4 space-y-2">
                             <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Visual Asset URL</label>
                             <input 
                               value={cat.imageUrl || ''} 
                               onChange={(e) => updateCategory(cat.id, 'imageUrl', e.target.value)}
                               className="block w-full text-[9px] font-mono bg-slate-50 dark:bg-slate-800 rounded-lg p-2 outline-none"
                               placeholder="Image URL"
                             />
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'communication' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-10">
               <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                     <Mail className="size-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Signal Channels</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Support Email</label>
                     <input 
                       type="email" 
                       value={settings.communication?.supportEmail || ''}
                       onChange={(e) => handleUpdate('communication', 'supportEmail', e.target.value)}
                       className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-5 py-4 font-bold text-slate-800 dark:text-white outline-none"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hotline</label>
                     <input 
                       type="text" 
                       value={settings.communication?.supportPhone || ''}
                       onChange={(e) => handleUpdate('communication', 'supportPhone', e.target.value)}
                       className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-5 py-4 font-bold text-slate-800 dark:text-white outline-none"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Regional Headquarters</label>
                     <input 
                       type="text" 
                       value={settings.communication?.address || ''}
                       onChange={(e) => handleUpdate('communication', 'address', e.target.value)}
                       className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-5 py-4 font-bold text-slate-800 dark:text-white outline-none"
                     />
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'notification' && (
             <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                <div className="flex items-center justify-between pb-8 border-b border-slate-100 dark:border-slate-800">
                   <div>
                     <p className="text-lg font-black text-slate-900 dark:text-white leading-none">Global Broadcasts</p>
                     <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">Sync summaries & critical alerts</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.notification?.enableEmail} 
                        onChange={(e) => handleUpdate('notification', 'enableEmail', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-14 h-7 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                   </label>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                         <Mail className="size-5" />
                      </div>
                      <div className="flex-1">
                         <p className="text-sm font-black text-slate-900 dark:text-white">Admin Distribution List</p>
                         <input 
                            type="text" 
                            placeholder="admin@payvit.com, security@payvit.com"
                            value={settings.notification?.adminEmails?.join(', ') || ''}
                            onChange={(e) => handleUpdate('notification', 'adminEmails', e.target.value.split(',').map(s => s.trim()))}
                            className="w-full mt-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                         />
                      </div>
                   </div>
                </div>
             </div>
          )}

           {activeTab === 'email' && (
              <div className="space-y-8">
                 <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                       <div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Transmission Protocol</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select the primary email delivery engine</p>
                       </div>
                       <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                          <button 
                            onClick={() => handleUpdate('emailConfig', 'provider', 'nodemailer')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              settings.emailConfig?.provider === 'nodemailer' 
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                             Nodemailer (SMTP)
                          </button>
                          <button 
                            onClick={() => handleUpdate('emailConfig', 'provider', 'resend')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              settings.emailConfig?.provider === 'resend' 
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                             Resend (API)
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Sender Name</label>
                          <input 
                            type="text" 
                            placeholder="PayVit"
                            value={settings.emailConfig?.fromName || ''}
                            onChange={(e) => handleUpdate('emailConfig', 'fromName', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-5 py-4 font-bold text-slate-800 dark:text-white outline-none"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Sender Email</label>
                          <input 
                            type="email" 
                            placeholder="noreply@payvit.com"
                            value={settings.emailConfig?.fromEmail || ''}
                            onChange={(e) => handleUpdate('emailConfig', 'fromEmail', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-5 py-4 font-bold text-slate-800 dark:text-white outline-none"
                          />
                       </div>
                    </div>
                 </div>

                 {settings.emailConfig?.provider === 'resend' ? (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8"
                   >
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Resend Integration</h3>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">API Key</label>
                         <input 
                           type="password" 
                           placeholder="re_..."
                           value={settings.emailConfig?.resendApiKey || ''}
                           onChange={(e) => handleUpdate('emailConfig', 'resendApiKey', e.target.value)}
                           className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-5 py-4 font-mono text-slate-800 dark:text-white outline-none"
                         />
                         <p className="text-[9px] text-slate-400 mt-2 italic font-medium px-1">Generate your key at resend.com/api-keys</p>
                      </div>
                   </motion.div>
                 ) : (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8"
                   >
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">SMTP Gateway</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Host Address</label>
                               <input 
                                 type="text" 
                                 placeholder="smtp.gmail.com"
                                 value={settings.emailConfig?.smtpHost || ''}
                                 onChange={(e) => handleUpdate('emailConfig', 'smtpHost', e.target.value)}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-5 py-4 font-bold text-slate-800 dark:text-white outline-none"
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Port</label>
                               <input 
                                 type="number" 
                                 placeholder="587"
                                 value={settings.emailConfig?.smtpPort || 587}
                                 onChange={(e) => handleUpdate('emailConfig', 'smtpPort', parseInt(e.target.value))}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-5 py-4 font-bold text-slate-800 dark:text-white outline-none"
                               />
                            </div>
                         </div>
                         <div className="space-y-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Username / Auth User</label>
                               <input 
                                 type="text" 
                                 placeholder="user@example.com"
                                 value={settings.emailConfig?.smtpUser || ''}
                                 onChange={(e) => handleUpdate('emailConfig', 'smtpUser', e.target.value)}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-5 py-4 font-bold text-slate-800 dark:text-white outline-none"
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Password / App Key</label>
                               <input 
                                 type="password" 
                                 placeholder="••••••••••••"
                                 value={settings.emailConfig?.smtpPass || ''}
                                 onChange={(e) => handleUpdate('emailConfig', 'smtpPass', e.target.value)}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-5 py-4 font-bold text-slate-800 dark:text-white outline-none"
                               />
                            </div>
                         </div>
                      </div>
                   </motion.div>
                 )}
              </div>
           )}
        </motion.div>
      </AnimatePresence>

      {/* Save Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 text-center"
            >
               <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 shadow-inner">
                  <ShieldCheck className="size-10" />
               </div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic mb-2">Deploy Configuration?</h2>
               <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">
                  Are you sure you want to commit these architectural changes to the production environment? This will affect global marketplace behavior.
               </p>

               <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Abort
                  </button>
                  <button 
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-[2] bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <RefreshCw className="size-4 animate-spin" /> : 'Confirm Deployment'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

