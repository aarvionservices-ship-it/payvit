// modules/public/pages/AdminLoginPage.tsx
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowRight, Shield, KeyRound, Loader2 } from "lucide-react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { loginRequest } from '../../../api/auth.api';
import { useAuthStore } from '../../../store/auth.store';
import { toast } from 'react-hot-toast';
import { roleRedirect } from '../../../utils/roleRedirect';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get('redirect');
    const login = useAuthStore((state) => state.login);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            setLoading(true);
            const response = await loginRequest(data);
            
            if (response.success) {
                const { accessToken, refreshToken, user } = response.data;
                if (user.role !== 'admin') {
                    toast.error('This portal is for admins only');
                    return;
                }
                login({ accessToken, refreshToken, user });
                toast.success('Admin login successful!');
                if (redirect) {
                    navigate(redirect);
                } else {
                    navigate(roleRedirect(user.role));
                }
            } else {
                toast.error(response.message || 'Login failed');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden">
            {/* background glow */}
            <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl p-8 space-y-8 text-white relative z-10">
                <div className="text-center">
                    <div className="size-16 bg-gradient-to-br from-purple-600 to-rose-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
                        <Shield className="size-8" />
                    </div>
                    <h1 className="text-3xl font-bold">Admin Access</h1>
                    <p className="text-slate-400 mt-2">Secure login for administrators</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="text-sm font-semibold flex gap-2 items-center text-slate-300">
                            <Mail className={`size-4 ${errors.email ? 'text-red-400' : 'text-purple-400'}`} /> Admin Email
                        </label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="admin@company.com"
                            className={`w-full mt-2 bg-slate-900 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                                errors.email ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-700 focus:ring-purple-500'
                            }`}
                        />
                        {errors.email && <p className="text-xs font-bold text-red-400 mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <div className="flex justify-between">
                            <label className="text-sm font-semibold flex gap-2 items-center text-slate-300">
                                <KeyRound className={`size-4 ${errors.password ? 'text-red-400' : 'text-purple-400'}`} /> Password
                            </label>
                            <Link to="/forgot-password" className="text-xs text-purple-400 font-semibold hover:text-purple-300 transition-colors">
                                Forgot?
                            </Link>
                        </div>
                        <input
                            {...register('password')}
                            type="password"
                            placeholder="Enter your password"
                            className={`w-full mt-2 bg-slate-900 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                                errors.password ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-700 focus:ring-purple-500'
                            }`}
                        />
                        {errors.password && <p className="text-xs font-bold text-red-400 mt-1">{errors.password.message}</p>}
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-rose-500 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-purple-900/40"
                    >
                        {loading ? (
                            <Loader2 className="size-5 animate-spin" />
                        ) : (
                            <>
                                Admin Login <ArrowRight className="size-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
}
