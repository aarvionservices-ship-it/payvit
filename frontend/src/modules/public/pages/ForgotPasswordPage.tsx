import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { forgotPasswordRequest } from '../../../api/auth.api';
import toast from 'react-hot-toast';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPasswordRequest(email);
            setIsSubmitted(true);
            toast.success('Reset link sent to your email');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center border border-slate-100">
                    <div className="size-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <CheckCircle2 className="size-10" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight mb-4">Transmission Successful</h1>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8">
                        If an account exists for <span className="font-bold text-slate-900">{email}</span>, you will receive a password reset sequence shortly.
                    </p>
                    <Link 
                        to="/login"
                        className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:gap-4 transition-all"
                    >
                        <ArrowLeft className="size-4" /> Return to Command Center
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="mb-10 text-center">
                    <Link to="/" className="inline-block mb-8">
                        <div className="flex items-center gap-2">
                            <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <span className="font-black text-xl italic">A</span>
                            </div>
                            <span className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">PayVit</span>
                        </div>
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight">Identity Recovery</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">Initiate Password Reset Protocol</p>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-10 border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Registered Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Send className="size-4" /> Transmit Reset Link
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Remember your credentials? {' '}
                    <Link to="/login" className="text-primary hover:underline">
                        Secure Authentication
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;

