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
  Info,
  Loader2
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
            body = body.replace(regex, `<span class="bg-blue-105 text-blue-700 px-1 rounded">[${t.label}]</span>`);
        });
        return body;
    };

    return (
        <div className="space-y-6 lg:space-y-8 pb-10">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Email Templates</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create, test, and manage transactional email templates.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm w-fit"
                >
                    <Plus className="size-4" /> Add Template
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="size-8 text-blue-600 animate-spin" />
                    <p className="text-sm font-medium text-slate-500">Loading email templates...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div key={template._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-5">
                                    <div className="size-10 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm group-hover:scale-105 transition-transform">
                                        <Mail className="size-5" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleOpenModal(template)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                                        >
                                            <Edit2 className="size-4.5" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(template._id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                                        >
                                            <Trash2 className="size-4.5" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 capitalize group-hover:text-blue-600 transition-colors">{template.name}</h3>
                                <p className="text-xs text-slate-500 line-clamp-1 mb-5">{template.subject}</p>
                                
                                <div className="flex items-center gap-2.5 mt-4">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm capitalize ${template.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-550 border-slate-100'}`}>
                                        {template.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <code className="text-xs text-slate-400 font-mono font-medium">{template.slug}</code>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleOpenModal(template)}
                                className="w-full py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-t border-slate-200 dark:border-slate-800 text-xs font-semibold text-blue-650 hover:text-blue-700 transition-all flex items-center justify-center gap-1"
                            >
                                Edit Settings <span className="text-xs font-normal">&rarr;</span>
                            </button>
                        </div>
                    ))}

                    {templates.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            <div className="size-16 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center mb-5">
                                <Mail className="size-8" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Email Templates Found</h3>
                            <p className="text-xs text-slate-500 mt-1">Setup email formats for transaction status updates.</p>
                            <button
                                onClick={() => handleOpenModal()}
                                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
                            >
                                Create First Template
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Template editor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-250 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-955 text-white">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                    <Mail className="size-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">
                                        {editingTemplate?._id ? 'Edit Template settings' : 'Create New Template'}
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Design communication formats and define variables injection.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                {editingTemplate?._id && (
                                    <button
                                        onClick={() => setIsTestModalOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-350 hover:bg-white/10 hover:text-white rounded-lg transition-all border border-slate-705"
                                    >
                                        <Send className="size-3.5" /> Send Test
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-all"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-955/20">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Form controls */}
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-550 block mb-1">Template Name</label>
                                            <input
                                                type="text"
                                                value={editingTemplate?.name}
                                                onChange={e => setEditingTemplate({ ...editingTemplate!, name: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                placeholder="e.g. Welcome Email"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-550 block mb-1">Subject Title</label>
                                            <input
                                                type="text"
                                                value={editingTemplate?.subject}
                                                onChange={e => setEditingTemplate({ ...editingTemplate!, subject: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                placeholder="e.g. Welcome to PayVit, {{username}}!"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3.5">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-xs font-semibold text-slate-550 flex items-center gap-1.5">
                                                <Code className="size-4 text-blue-600" /> HTML Editor
                                            </label>
                                            <div className="flex bg-slate-105 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <button 
                                                    onClick={() => setPreviewMode(false)}
                                                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${!previewMode ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                                >
                                                    Code
                                                </button>
                                                <button 
                                                    onClick={() => setPreviewMode(true)}
                                                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${previewMode ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm' : 'text-slate-550 hover:text-slate-800'}`}
                                                >
                                                    Visual Preview
                                                </button>
                                            </div>
                                        </div>

                                        {previewMode ? (
                                            <div className="w-full min-h-[360px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden p-6 shadow-inner">
                                                <div dangerouslySetInnerHTML={{ __html: renderedBody() }} className="prose dark:prose-invert max-w-none text-xs" />
                                            </div>
                                        ) : (
                                            <textarea
                                                value={editingTemplate?.body}
                                                onChange={e => setEditingTemplate({ ...editingTemplate!, body: e.target.value })}
                                                className="w-full h-[360px] p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-xs leading-relaxed"
                                                placeholder="Type HTML email body content here..."
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2.5 px-1">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={editingTemplate?.isActive}
                                                onChange={e => setEditingTemplate({ ...editingTemplate!, isActive: e.target.checked })}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-9 h-5 bg-slate-202 dark:bg-slate-808 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                        <span className="text-xs font-semibold text-slate-650 dark:text-slate-350">Active template protocol</span>
                                    </div>
                                </div>

                                {/* Tokens sidebar */}
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="bg-white dark:bg-slate-905 border border-slate-202 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                                        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm mb-4">
                                            <Info className="size-4.5 text-blue-600" />
                                            Data Injections
                                        </div>
                                        <p className="text-xs text-slate-500 mb-6 leading-relaxed">Map these variables into your template body. They will be automatically replaced with live customer data variables during transmission.</p>
                                        
                                        <div className="grid grid-cols-2 gap-2">
                                            {availableTokens.map((token) => (
                                                <button
                                                    key={token.key}
                                                    onClick={() => insertToken(token.key)}
                                                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-650 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-all group"
                                                >
                                                    <span>{token.key}</span>
                                                    <Plus className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">Guidelines</h4>
                                            <ul className="text-xs text-slate-500 space-y-2.5 leading-relaxed">
                                                <li className="flex gap-2">
                                                    <span className="size-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                                                    Use inline styles for optimal cross-client rendering.
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="size-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                                                    Wrap token variables exactly in {'{{var_name}}'} notation.
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end items-center gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-xs font-semibold text-slate-550 hover:text-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
                            >
                                <Save className="size-4" /> Save Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Email Modal */}
            {isTestModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 text-center">
                            <div className="size-12 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Send className="size-5.5" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Transmit Test Email</h3>
                            <p className="text-xs text-slate-500 mt-1">Send a live template render to verify layout output.</p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 block mb-1">Recipient Address</label>
                                <input
                                    type="email"
                                    value={testEmail}
                                    onChange={e => setTestEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-202 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium outline-none transition-all"
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                            <button
                                onClick={() => setIsTestModalOpen(false)}
                                className="flex-1 py-2 text-xs font-semibold text-slate-500 hover:text-slate-750 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleTestEmail}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
                            >
                                <Send className="size-3.5" /> Transmit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
