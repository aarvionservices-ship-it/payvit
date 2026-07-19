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
  Loader2,
  Database,
  Download,
  Upload,
  TriangleAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSettings, updateSettings } from '../../../api/settings.api';
import { exportBackup, restoreBackup, getCleanupPreview, executeCleanup } from '../../../api/backup.api';

type TabType = 'general' | 'ui' | 'communication' | 'notification' | 'email' | 'backup';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [originalSettings, setOriginalSettings] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<any>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [backupConfirmed, setBackupConfirmed] = useState(false);

  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [cleanupPreviewData, setCleanupPreviewData] = useState<any>(null);
  const [isQueryingPreview, setIsQueryingPreview] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupConfirmText, setCleanupConfirmText] = useState('');
  const [cleanupResult, setCleanupResult] = useState<any>(null);

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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await exportBackup();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-leads-history-${new Date().toISOString().split('T')[0]}.json.gz`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Export failed:', error);
      alert('Failed to generate backup: ' + (error.message || 'Server error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestore = async () => {
    if (!backupFile) {
      setRestoreError('Please select a backup file first.');
      return;
    }
    if (!backupConfirmed) {
      setRestoreError('You must confirm that this will overwrite existing records.');
      return;
    }

    try {
      setIsRestoring(true);
      setRestoreError(null);
      setRestoreSuccess(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(',')[1];
          const response = await restoreBackup(base64);
          if (response.success) {
            setRestoreSuccess(response.data);
            setBackupFile(null);
            setBackupConfirmed(false);
          } else {
            setRestoreError(response.message || 'Restore failed');
          }
        } catch (err: any) {
          setRestoreError(err.message || 'Failed to send restore request');
        } finally {
          setIsRestoring(false);
        }
      };
      reader.readAsDataURL(backupFile);
    } catch (error: any) {
      setRestoreError(error.message || 'Failed to read file');
      setIsRestoring(false);
    }
  };

  const handleCleanupPreview = async () => {
    if (selectedStatuses.length === 0) {
      alert('Please select at least one lead state.');
      return;
    }

    try {
      setIsQueryingPreview(true);
      setCleanupResult(null);
      setCleanupConfirmText('');
      const response = await getCleanupPreview(selectedStatuses);
      if (response.success) {
        setCleanupPreviewData(response.data);
        setShowCleanupModal(true);
      } else {
        alert(response.message || 'Failed to fetch deletion preview');
      }
    } catch (error: any) {
      console.error('Preview failed:', error);
      alert('Error fetching preview data: ' + (error.message || 'Server error'));
    } finally {
      setIsQueryingPreview(false);
    }
  };

  const handleExecuteCleanup = async () => {
    if (cleanupConfirmText !== 'PURGE') {
      alert('Confirmation word does not match.');
      return;
    }

    try {
      setIsCleaningUp(true);
      const response = await executeCleanup(selectedStatuses);
      if (response.success) {
        setCleanupResult(response.data);
        setShowCleanupModal(false);
        setCleanupPreviewData(null);
        setSelectedStatuses([]);
      } else {
        alert(response.message || 'Deletion execution failed');
      }
    } catch (error: any) {
      console.error('Purge execution failed:', error);
      alert('Error purging lead records: ' + (error.message || 'Server error'));
    } finally {
      setIsCleaningUp(false);
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
    { id: 'backup', label: 'Backup & Restore', icon: Database },
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
          {activeTab === 'backup' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-800 dark:text-slate-100">
                  {/* Export Panel */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                        <div className="size-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center animate-pulse">
                          <Database className="size-4.5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Export Database Backup</h3>
                      </div>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                        Generate a compact and compressed binary backup file of the platform's core data. This file can be used to perfectly restore the system state later.
                      </p>
                      
                      <div className="bg-slate-50 dark:bg-slate-800/20 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-2">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">Included Modules:</p>
                        <ul className="text-xs text-slate-500 dark:text-slate-400 list-disc list-inside space-y-1">
                          <li>Leads & Applications Data</li>
                          <li>Lead Audit Trail & Action History</li>
                          <li>Agent Communication Logs & Timelines</li>
                          <li>Customer & System Interaction Notes</li>
                        </ul>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleExport}
                      disabled={isExporting}
                      className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Generating Gzip Archive...</span>
                        </>
                      ) : (
                        <>
                          <Download className="size-4" />
                          <span>Download Gzipped Backup</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Restore Panel */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                        <div className="size-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 flex items-center justify-center">
                          <Upload className="size-4.5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Restore Database Backup</h3>
                      </div>

                      <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/50 rounded-xl p-4 text-rose-800 dark:text-rose-455 flex gap-3 mb-4">
                        <TriangleAlert className="size-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold">Destructive Operation</p>
                          <p className="text-[11px] leading-relaxed">
                            Restoring a backup will overwrite the current Leads, History, Communication Logs, and Notes database records. This is permanent. Please proceed with absolute caution.
                          </p>
                        </div>
                      </div>

                      {/* File Upload Zone */}
                      <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition-colors relative">
                        <input
                          type="file"
                          accept=".gz"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setBackupFile(file);
                              setRestoreError(null);
                              setRestoreSuccess(null);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Upload className="size-8 text-slate-400 mx-auto mb-2" />
                        {backupFile ? (
                          <div>
                            <p className="text-xs font-bold text-slate-850 dark:text-white truncate max-w-full">
                              {backupFile.name}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {(backupFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                              Click to upload or drag & drop
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Only .json.gz files are accepted
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Overwrite Confirmation */}
                      <div className="flex items-start gap-2.5 mt-4">
                        <input
                          type="checkbox"
                          id="backup-confirm-chk"
                          checked={backupConfirmed}
                          onChange={(e) => setBackupConfirmed(e.target.checked)}
                          className="mt-0.5 size-3.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="backup-confirm-chk" className="text-[11px] font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                          I understand that restoring will erase all current Leads and History records and replace them with the backup content.
                        </label>
                      </div>

                      {/* Status Messages */}
                      {restoreError && (
                        <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-955/10 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
                          <TriangleAlert className="size-4 shrink-0" />
                          <span>{restoreError}</span>
                        </div>
                      )}

                      {restoreSuccess && (
                        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-955/10 border border-emerald-100 dark:border-emerald-900/30 text-emerald-750 dark:text-emerald-400 rounded-xl text-xs space-y-1">
                          <p className="font-bold">Restore Complete!</p>
                          <p className="text-[11px] opacity-90">
                            Restored {restoreSuccess.leadsCount} leads, {restoreSuccess.leadHistoriesCount} histories, {restoreSuccess.communicationLogsCount} communication logs, and {restoreSuccess.leadNotesCount} notes.
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleRestore}
                      disabled={isRestoring || !backupFile || !backupConfirmed}
                      className="mt-6 w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-105 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white py-3 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      {isRestoring ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Extracting & Restoring...</span>
                        </>
                      ) : (
                        <>
                          <Database className="size-4" />
                          <span>Restore Platform Database</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              {/* Database Cleanup Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="size-8 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 flex items-center justify-center animate-pulse">
                      <Trash2 className="size-4.5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Database Cleanup & Lead Purging</h3>
                      <p className="text-[11px] text-slate-505 dark:text-slate-400 mt-0.5">Filter leads by statuses to permanently delete their records and associated logs.</p>
                    </div>
                  </div>

                  {/* Checkbox Grid */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Select Lead States to Purge:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'new', label: 'New' },
                        { id: 'assigned', label: 'Assigned' },
                        { id: 'contacted', label: 'Contacted' },
                        { id: 'interested', label: 'Interested' },
                        { id: 'callback', label: 'Callback' },
                        { id: 'in-progress', label: 'In Progress' },
                        { id: 'converted', label: 'Converted' },
                        { id: 'rejected', label: 'Rejected' },
                      ].map((status) => {
                        const isChecked = selectedStatuses.includes(status.id);
                        return (
                          <label
                            key={status.id}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all ${
                              isChecked
                                ? 'bg-rose-50/40 dark:bg-rose-955/10 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400'
                                : 'bg-slate-50 dark:bg-slate-850/20 border-slate-205 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStatuses([...selectedStatuses, status.id]);
                                } else {
                                  setSelectedStatuses(selectedStatuses.filter((s) => s !== status.id));
                                }
                              }}
                              className="sr-only"
                            />
                            <div className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                              isChecked
                                ? 'bg-rose-600 border-rose-650 text-white'
                                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                            }`}>
                              {isChecked && (
                                <svg className="size-2.5 fill-current" viewBox="0 0 20 20">
                                  <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                                </svg>
                              )}
                            </div>
                            <span>{status.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback Action results */}
                  {cleanupResult && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-955/10 border border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-xl text-xs space-y-1.5 animate-in fade-in duration-200">
                      <p className="font-bold flex items-center gap-1.5">
                        <span>Purge Complete!</span>
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                        <div className="bg-white dark:bg-slate-850 p-2.5 rounded-lg border border-emerald-100/30 text-center">
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Leads Deleted</p>
                          <p className="text-base font-extrabold mt-0.5">{cleanupResult.leadsDeleted}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-850 p-2.5 rounded-lg border border-emerald-100/30 text-center">
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Histories Cleared</p>
                          <p className="text-base font-extrabold mt-0.5">{cleanupResult.historiesDeleted}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-850 p-2.5 rounded-lg border border-emerald-100/30 text-center">
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Logs Erased</p>
                          <p className="text-base font-extrabold mt-0.5">{cleanupResult.logsDeleted}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-850 p-2.5 rounded-lg border border-emerald-100/30 text-center">
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Notes Purged</p>
                          <p className="text-base font-extrabold mt-0.5">{cleanupResult.notesDeleted}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={handleCleanupPreview}
                      disabled={selectedStatuses.length === 0 || isQueryingPreview}
                      className="bg-rose-605 hover:bg-rose-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-[0.98]"
                    >
                      {isQueryingPreview ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      <span>Preview Deletion & Purge</span>
                    </button>
                  </div>
                </div>
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

      {/* Purge Deletion Confirmation Modal */}
      <AnimatePresence>
        {showCleanupModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCleanupModal(false)}
              className="absolute inset-0"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 p-6 text-center"
            >
               <div className="size-14 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-455 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 dark:border-slate-800 animate-bounce">
                  <TriangleAlert className="size-6" />
               </div>
               <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 font-sans">Purge Deletion Warning!</h2>
               
               <div className="text-left my-4 p-4 bg-slate-50 dark:bg-slate-850/50 rounded-xl border border-slate-202 dark:border-slate-800 space-y-2">
                 <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Items to delete:</p>
                 <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1.5 font-mono">
                   {cleanupPreviewData && Object.entries(cleanupPreviewData).map(([status, count]) => (
                     <li key={status}>
                       <span className="capitalize">{status}</span> leads: <span className="font-extrabold text-rose-600 dark:text-rose-400">{count as number}</span>
                     </li>
                   ))}
                 </ul>
                 <p className="text-[10px] text-slate-500 mt-2">
                   *All matching logs, histories, and notes will be permanently erased.
                 </p>
               </div>

               <div className="space-y-2 text-left mb-6 font-sans">
                 <label className="text-[10px] font-bold text-slate-500 uppercase block">Type "PURGE" to confirm:</label>
                 <input 
                   type="text"
                   value={cleanupConfirmText}
                   onChange={(e) => setCleanupConfirmText(e.target.value)}
                   placeholder="PURGE"
                   className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-center font-mono text-sm font-extrabold tracking-widest focus:ring-2 focus:ring-rose-500/20 outline-none uppercase"
                 />
               </div>

               <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowCleanupModal(false)}
                    className="flex-1 py-2 text-xs font-semibold text-slate-505 hover:text-slate-750 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleExecuteCleanup}
                    disabled={isCleaningUp || cleanupConfirmText !== 'PURGE'}
                    className="flex-[2] bg-rose-600 hover:bg-rose-700 disabled:bg-slate-105 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    {isCleaningUp ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    Confirm Purge
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
