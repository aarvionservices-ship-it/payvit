import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { resetPasswordRequest, validateResetTokenRequest } from '../../../api/auth.api';
import toast from 'react-hot-toast';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(false);

    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    React.useEffect(() => {
        const validateToken = async () => {
            if (!token || !userId) {
                setIsValidating(false);
                return;
            }
            try {
                await validateResetTokenRequest(userId, token);
                setIsTokenValid(true);
            } catch (error) {
                setIsTokenValid(false);
                toast.error('This reset link has expired or already been used');
            } finally {
                setIsValidating(false);
            }
        };
        validateToken();
    }, [token, userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token || !userId) {
            toast.error('Invalid or missing reset token');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await resetPasswordRequest({ userId, token, password });
            toast.success('Password updated successfully');
            navigate('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (isValidating) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 flex flex-col items-center">
                    <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                    <h2 className="text-xl font-black text-slate-900 uppercase italic mb-2">Verifying Protocol</h2>
                    <p className="text-sm text-slate-500">Establishing secure connection to Identity Server...</p>
                </div>
            </div>
        );
    }

    if (!token || !userId || !isTokenValid) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
                    <div className="size-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Lock className="size-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 uppercase italic mb-2">Protocol Expired</h2>
                    <p className="text-sm text-slate-500 mb-8">This reset sequence is no longer valid or has already been deployed. Please initiate a new identity recovery protocol.</p>
                    <button onClick={() => navigate('/forgot-password')} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                        Request New Sequence
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="mb-10 text-center">
                    <div className="flex justify-center mb-8">
                        <div className="size-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-lg shadow-emerald-500/10">
                            <ShieldCheck className="size-8" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight">Access Restoration</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">Update Credentials for Identity {userId.slice(-6)}</p>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-10 border border-slate-100 relative">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">New Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-14 pr-14 py-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900"
                                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Confirm New Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900"
                                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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
                                    Complete Restoration <ArrowRight className="size-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;

