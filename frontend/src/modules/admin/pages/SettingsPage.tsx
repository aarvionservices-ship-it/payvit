import { useState, useEffect } from 'react';
import { 
  Settings, 
  Bell, 
  Mail, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Layout,
  MessageSquare,
  Loader2
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

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="size-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading settings...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'ui', label: 'UI & UX', icon: Layout },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'notification', label: 'Notifications', icon: Bell },
    { id: 'email', label: 'Email Engine', icon: Mail },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 lg:space-y-8 pb-32">
      {/* Header section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage platform identity, categories, contact points, and notification settings.</p>
      </div>

      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-8 right-8 z-[80]"
          >
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all border border-transparent"
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4.5" />}
              Save Settings
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl w-fit border border-slate-200 dark:border-slate-700/60 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-slate-955 text-blue-600 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="size-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3">Core Identity</h3>
                  <div className="space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-505 block mb-1">Platform Name</label>
                        <input 
                          type="text" 
                          value={settings.general?.platformName || ''}
                          onChange={(e) => handleUpdate('general', 'platformName', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-202 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                     </div>
                     <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-800/60 mt-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Auto Assignment</p>
                          <p className="text-xs text-slate-500 mt-1">Assign leads to agents via round-robin allocation</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={settings.general?.autoLeadAssignment} 
                            onChange={(e) => handleUpdate('general', 'autoLeadAssignment', e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                     </div>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3">Economic Thresholds</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-505 block mb-1">Base Commission (%)</label>
                        <input 
                          type="number" 
                          value={settings.general?.defaultCommissionRate || 0}
                          onChange={(e) => handleUpdate('general', 'defaultCommissionRate', parseFloat(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-202 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-505 block mb-1">Payout Limit (₹)</label>
                        <input 
                          type="number" 
                          value={settings.general?.minPayoutThreshold || 0}
                          onChange={(e) => handleUpdate('general', 'minPayoutThreshold', parseFloat(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-202 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'ui' && (
            <div className="space-y-6">
               <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Platform Categories</h3>
                    <p className="text-xs text-slate-505 mt-0.5">Manage offering types and hero descriptions.</p>
                  </div>
                  <button 
                    onClick={addCategory}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Plus className="size-4" /> Add Category
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {settings.ui?.categories?.map((cat: any) => (
                    <div key={cat.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group relative">
                       <div className="flex items-center justify-between mb-4">
                          <input 
                            value={cat.icon || ''} 
                            onChange={(e) => updateCategory(cat.id, 'icon', e.target.value)}
                            className="bg-slate-55 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-24 outline-none"
                            placeholder="icon alias"
                          />
                          <button onClick={() => deleteCategory(cat.id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                             <Trash2 size={16} />
                          </button>
                       </div>
                       <div className="space-y-4">
                          <input 
                            value={cat.name || ''} 
                            onChange={(e) => updateCategory(cat.id, 'name', e.target.value)}
                            className="block w-full text-base font-bold text-slate-900 dark:text-white border-b border-dashed border-slate-200 dark:border-slate-800 bg-transparent py-1.5 focus:ring-0 outline-none"
                            placeholder="Name"
                          />
                          <textarea 
                            value={cat.quote || ''} 
                            onChange={(e) => updateCategory(cat.id, 'quote', e.target.value)}
                            className="block w-full text-xs italic text-slate-500 border border-slate-100 dark:border-slate-800/80 rounded-lg p-2.5 bg-slate-55 dark:bg-slate-800/10 focus:ring-0 outline-none h-16 resize-none"
                            placeholder="Category description quote..."
                          />
                          <div className="pt-2 space-y-1.5">
                             <label className="text-[11px] font-semibold text-slate-500 block">Illustration URL</label>
                             <input 
                               value={cat.imageUrl || ''} 
                               onChange={(e) => updateCategory(cat.id, 'imageUrl', e.target.value)}
                               className="block w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 outline-none"
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
               <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="size-8 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 flex items-center justify-center">
                     <Mail className="size-4.5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Signal Channels</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-slate-555 block mb-1">Support Email</label>
                     <input 
                       type="email" 
                       value={settings.communication?.supportEmail || ''}
                       onChange={(e) => handleUpdate('communication', 'supportEmail', e.target.value)}
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-202 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-slate-555 block mb-1">Hotline Phone</label>
                     <input 
                       type="text" 
                       value={settings.communication?.supportPhone || ''}
                       onChange={(e) => handleUpdate('communication', 'supportPhone', e.target.value)}
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-202 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-slate-555 block mb-1">Office Address</label>
                     <input 
                       type="text" 
                       value={settings.communication?.address || ''}
                       onChange={(e) => handleUpdate('communication', 'address', e.target.value)}
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-202 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                     />
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'notification' && (
             <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                   <div>
                     <p className="text-base font-bold text-slate-900 dark:text-white">Broadcast Alerts</p>
                     <p className="text-xs text-slate-505 mt-1">Configure automated logs and summary emails</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.notification?.enableEmail} 
                        onChange={(e) => handleUpdate('notification', 'enableEmail', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-202 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                   </label>
                </div>

                <div className="space-y-6">
                   <div className="flex items-start gap-3">
                      <div className="size-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-450 flex items-center justify-center shrink-0 shadow-sm">
                         <Mail className="size-4.5" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                         <p className="text-xs font-semibold text-slate-900 dark:text-white">Moderator Distribution List</p>
                         <p className="text-xs text-slate-500">Provide comma-separated emails to receive system notifications</p>
                         <input 
                            type="text" 
                            placeholder="admin@payvit.com, security@payvit.com"
                            value={settings.notification?.adminEmails?.join(', ') || ''}
                            onChange={(e) => handleUpdate('notification', 'adminEmails', e.target.value.split(',').map(s => s.trim()))}
                            className="w-full mt-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                         />
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'email' && (
              <div className="space-y-6">
                 <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                       <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">Delivery Provider</h3>
                          <p className="text-xs text-slate-505 mt-0.5">Select the active transactional email engine.</p>
                       </div>
                       <div className="flex bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <button 
                            type="button"
                            onClick={() => handleUpdate('emailConfig', 'provider', 'nodemailer')}
                            className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${
                              settings.emailConfig?.provider === 'nodemailer' 
                                ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-white shadow-sm' 
                                : 'text-slate-505 hover:text-slate-800'
                            }`}
                          >
                             SMTP Gateway
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleUpdate('emailConfig', 'provider', 'resend')}
                            className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${
                              settings.emailConfig?.provider === 'resend' 
                                ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-white shadow-sm' 
                                : 'text-slate-505 hover:text-slate-800'
                            }`}
                          >
                             Resend API
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                       <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-505 block mb-1">Sender Name</label>
                          <input 
                            type="text" 
                            placeholder="PayVit"
                            value={settings.emailConfig?.fromName || ''}
                            onChange={(e) => handleUpdate('emailConfig', 'fromName', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-202 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-505 block mb-1">Sender Email Address</label>
                          <input 
                            type="email" 
                            placeholder="noreply@payvit.com"
                            value={settings.emailConfig?.fromEmail || ''}
                            onChange={(e) => handleUpdate('emailConfig', 'fromEmail', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-202 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                       </div>
                    </div>
                 </div>

                 {settings.emailConfig?.provider === 'resend' ? (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                   >
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Resend Integration</h3>
                      <div className="space-y-1.5">
                         <label className="text-xs font-semibold text-slate-505 block mb-1">API Key</label>
                         <input 
                           type="password" 
                           placeholder="re_..."
                           value={settings.emailConfig?.resendApiKey || ''}
                           onChange={(e) => handleUpdate('emailConfig', 'resendApiKey', e.target.value)}
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-202 dark:border-slate-750 rounded-xl px-4 py-2.5 font-mono text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                         />
                         <p className="text-xs text-slate-500 mt-1.5">Generate your key in the integrations console at resend.com</p>
                      </div>
                   </motion.div>
                 ) : (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
                   >
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">SMTP Gateway</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-4">
                            <div className="space-y-1.5">
                               <label className="text-xs font-semibold text-slate-505 block mb-1">SMTP Host</label>
                               <input 
                                 type="text" 
                                 placeholder="smtp.gmail.com"
                                 value={settings.emailConfig?.smtpHost || ''}
                                 onChange={(e) => handleUpdate('emailConfig', 'smtpHost', e.target.value)}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-202 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                               />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-xs font-semibold text-slate-505 block mb-1">SMTP Port</label>
                               <input 
                                 type="number" 
                                 placeholder="587"
                                 value={settings.emailConfig?.smtpPort || 587}
                                 onChange={(e) => handleUpdate('emailConfig', 'smtpPort', parseInt(e.target.value))}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-202 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                               />
                            </div>
                         </div>
                         <div className="space-y-4">
                            <div className="space-y-1.5">
                               <label className="text-xs font-semibold text-slate-505 block mb-1">Username / Auth Account</label>
                               <input 
                                 type="text" 
                                 placeholder="user@example.com"
                                 value={settings.emailConfig?.smtpUser || ''}
                                 onChange={(e) => handleUpdate('emailConfig', 'smtpUser', e.target.value)}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-202 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                               />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-xs font-semibold text-slate-505 block mb-1">Password / App Access Code</label>
                               <input 
                                 type="password" 
                                 placeholder="••••••••••••"
                                 value={settings.emailConfig?.smtpPass || ''}
                                 onChange={(e) => handleUpdate('emailConfig', 'smtpPass', e.target.value)}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-202 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
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
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-205 dark:border-slate-800 p-6 text-center"
            >
               <div className="size-14 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 dark:border-slate-800">
                  <ShieldCheck className="size-6" />
               </div>
               <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">Save Changes?</h2>
               <p className="text-xs text-slate-505 mb-6 leading-relaxed">
                  Are you sure you want to deploy these configuration updates? This will affect global platform functionality.
               </p>

               <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-2 text-xs font-semibold text-slate-505 hover:text-slate-750 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    {isSaving ? <Loader2 className="size-4 animate-spin" /> : 'Confirm Save'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
