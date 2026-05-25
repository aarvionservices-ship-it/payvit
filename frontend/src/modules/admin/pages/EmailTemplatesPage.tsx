import { useState, useEffect } from 'react';
import { 
  Plus, 
  Mail, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Send,
  Code,
  Info
} from 'lucide-react';
import { emailTemplateApi } from '../../../api/emailTemplate.api';
import toast from 'react-hot-toast';

interface EmailTemplate {
    _id: string;
    name: string;
    slug: string;
    subject: string;
    body: string;
    tokens: string[];
    isActive: boolean;
}

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);

    const availableTokens = [
        { key: 'username', label: 'User Name' },
        { key: 'phone', label: 'Phone Number' },
        { key: 'email', label: 'Email Address' },
        { key: 'loanAmount', label: 'Loan Amount' },
        { key: 'cardName', label: 'Card Name' },
        { key: 'rechargeAmount', label: 'Recharge Amount' },
        { key: 'otp', label: 'OTP Code' },
        { key: 'link', label: 'Action Link' },
    ];

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await emailTemplateApi.getAll();
            setTemplates(res.data);
        } catch (error) {
            toast.error('Failed to fetch templates');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (template?: EmailTemplate) => {
        if (template) {
            setEditingTemplate(template);
        } else {
            setEditingTemplate({
                name: '',
                subject: '',
                body: '',
                tokens: ['username', 'email'],
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (!editingTemplate?.name || !editingTemplate?.subject || !editingTemplate?.body) {
                toast.error('Please fill all required fields');
                return;
            }

            if (editingTemplate._id) {
                await emailTemplateApi.update(editingTemplate._id, editingTemplate);
                toast.success('Template updated successfully');
            } else {
                await emailTemplateApi.create(editingTemplate);
                toast.success('Template created successfully');
            }
            setIsModalOpen(false);
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to save template');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await emailTemplateApi.delete(id);
            toast.success('Template deleted successfully');
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    const insertToken = (token: string) => {
        if (!editingTemplate) return;
        const newToken = `{{${token}}}`;
        setEditingTemplate({
            ...editingTemplate,
            body: (editingTemplate.body || '') + newToken
        });
    };

    const handleTestEmail = async () => {
        if (!testEmail || !editingTemplate?._id) {
            toast.error('Recipient email is required');
            return;
        }

        try {
            await emailTemplateApi.test(editingTemplate._id, testEmail, {
                username: 'Test User',
                loanAmount: '50,000',
                otp: '123456'
            });
            toast.success('Test email sent successfully');
            setIsTestModalOpen(false);
        } catch (error) {
            toast.error('Failed to send test email');
        }
    };

    const renderedBody = () => {
        if (!editingTemplate?.body) return '';
        let body = editingTemplate.body;
        availableTokens.forEach(t => {
            const regex = new RegExp(`{{${t.key}}}`, 'g');
            body = body.replace(regex, `<span class="bg-blue-100 text-blue-700 px-1 rounded">[${t.label}]</span>`);
        });
        return body;
    };

    return (
        <div className="space-y-6 lg:space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Email Orchestration</h1>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.4em] mt-1">Transactional Communication Grid</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                    <Plus className="size-4" />
                    Initialize Template
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Syncing communication protocols...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div key={template._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden hover:shadow-xl transition-all group relative">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="size-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-white dark:border-slate-800 shadow-md group-hover:rotate-12 transition-transform">
                                        <Mail className="size-6" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleOpenModal(template)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                        >
                                            <Edit2 className="size-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(template._id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">{template.name}</h3>
                                <p className="text-[11px] font-bold text-slate-500 line-clamp-1 mb-6">{template.subject}</p>
                                
                                <div className="flex items-center gap-3">
                                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${template.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        {template.isActive ? 'Active Protocol' : 'Offline'}
                                    </div>
                                    <code className="text-[9px] text-slate-400 font-mono tracking-tighter">{template.slug}</code>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleOpenModal(template)}
                                className="w-full py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all"
                            >
                                Customize Architecture &rarr;
                            </button>
                        </div>
                    ))}

                    {templates.length === 0 && (
                        <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                            <div className="size-20 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center mb-6">
                                <Mail className="size-10" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Zero Templates Detected</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Initial communication protocols not established</p>
                            <button
                                onClick={() => handleOpenModal()}
                                className="mt-8 px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20"
                            >
                                Generate First Protocol
                            </button>
                        </div>
                    )}
                </div>
            ) }

            {/* Template editor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight text-primary">
                                    {editingTemplate?._id ? 'Modify Protocol' : 'Initialize Protocol'}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Design communication architecture & dynamic injection</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {editingTemplate?._id && (
                                    <button
                                        onClick={() => setIsTestModalOpen(true)}
                                        className="flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
                                    >
                                        <Send className="size-4" /> Trigger Test
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-all"
                                >
                                    <X className="size-6" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 dark:bg-slate-950/30">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* Form */}
                                <div className="lg:col-span-7 space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Protocol Alias</label>
                                            <input
                                                type="text"
                                                value={editingTemplate?.name}
                                                onChange={e => setEditingTemplate({ ...editingTemplate!, name: e.target.value })}
                                                className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold"
                                                placeholder="e.g. Welcome Email"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Subject Header</label>
                                            <input
                                                type="text"
                                                value={editingTemplate?.subject}
                                                onChange={e => setEditingTemplate({ ...editingTemplate!, subject: e.target.value })}
                                                className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold"
                                                placeholder="e.g. Welcome to PayVit, {{username}}!"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Code className="size-4 text-primary" /> Logic Construction (HTML)
                                            </label>
                                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                                <button 
                                                    onClick={() => setPreviewMode(false)}
                                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!previewMode ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                                                >
                                                    Terminal
                                                </button>
                                                <button 
                                                    onClick={() => setPreviewMode(true)}
                                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${previewMode ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                                                >
                                                    Visualizer
                                                </button>
                                            </div>
                                        </div>

                                        {previewMode ? (
                                            <div className="w-full min-h-[450px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden p-10 shadow-inner">
                                                <div dangerouslySetInnerHTML={{ __html: renderedBody() }} className="prose dark:prose-invert max-w-none" />
                                            </div>
                                        ) : (
                                            <textarea
                                                value={editingTemplate?.body}
                                                onChange={e => setEditingTemplate({ ...editingTemplate!, body: e.target.value })}
                                                className="w-full h-[450px] p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-mono text-xs leading-relaxed scrollbar-hide"
                                                placeholder="Initiate HTML sequence..."
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 px-1">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={editingTemplate?.isActive}
                                                onChange={e => setEditingTemplate({ ...editingTemplate!, isActive: e.target.checked })}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Active System Implementation</span>
                                    </div>
                                </div>

                                {/* Sidebar / Tokens */}
                                <div className="lg:col-span-5 space-y-8">
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                                        <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black uppercase italic mb-6">
                                            <Info className="size-5 text-primary" />
                                            Data Injections
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 mb-8 uppercase tracking-[0.1em] leading-relaxed">Map these variables into your protocol. They will be automatically replaced with high-fidelity customer intelligence.</p>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            {availableTokens.map((token) => (
                                                <button
                                                    key={token.key}
                                                    onClick={() => insertToken(token.key)}
                                                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all group"
                                                >
                                                    {token.key}
                                                    <Plus className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mt-10 pt-8 border-t border-slate-50 dark:border-slate-800">
                                            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Engineering Guidelines</h4>
                                            <ul className="text-[10px] font-bold text-slate-400 space-y-3 leading-relaxed">
                                                <li className="flex gap-2">
                                                    <div className="size-1.5 rounded-full bg-primary mt-1 shrink-0"></div>
                                                    Use standard HTML/CSS architecture.
                                                </li>
                                                <li className="flex gap-2">
                                                    <div className="size-1.5 rounded-full bg-primary mt-1 shrink-0"></div>
                                                    Inline styles are mandatory for cross-inbox logic.
                                                </li>
                                                <li className="flex gap-2">
                                                    <div className="size-1.5 rounded-full bg-primary mt-1 shrink-0"></div>
                                                    Synthetic tokens: {'{{token}}'} format.
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="bg-primary rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary/30 overflow-hidden relative group">
                                        <div className="absolute -right-4 -top-4 size-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                                        <div className="relative z-10">
                                            <h4 className="font-black uppercase italic tracking-widest mb-3">Tactical Advantage</h4>
                                            <p className="text-[10px] font-bold text-blue-100 leading-relaxed uppercase tracking-wide">
                                                Always verify protocol integrity using the test sequence before committing to global customer grid.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end items-center gap-6">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                Abort
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/30 active:scale-95 border-b-4 border-primary/20"
                            >
                                <Save className="size-4" /> Deploy Protocol
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Email Modal */}
            {isTestModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xl">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 text-center">
                            <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                                <Send className="size-8" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Handshake Initialization</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">Transmit test sequence to target destination</p>
                        </div>
                        <div className="p-8 pb-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Destination Address</label>
                                <input
                                    type="email"
                                    value={testEmail}
                                    onChange={e => setTestEmail(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>
                        <div className="p-8 flex gap-4">
                            <button
                                onClick={() => setIsTestModalOpen(false)}
                                className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                Abort
                            </button>
                            <button
                                onClick={handleTestEmail}
                                className="flex-1 flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-primary/20"
                            >
                                <Send className="size-4" /> Transmit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

