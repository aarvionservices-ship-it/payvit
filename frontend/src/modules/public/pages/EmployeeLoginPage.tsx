// modules/public/pages/EmployeeLoginPage.tsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Briefcase, ShieldCheck, Loader2 } from "lucide-react";
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

export default function EmployeeLoginPage() {
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
                if (user.role !== 'employee') {
                    toast.error('This portal is for employees only');
                    return;
                }
                login({ accessToken, refreshToken, user });
                toast.success('Employee login successful!');
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
        <main className="min-h-screen flex items-center justify-center p-4 bg-emerald-50 relative overflow-hidden">
            {/* background glow */}
            <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border p-8 space-y-8 relative z-10">
                <div className="text-center">
                    <div className="size-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
                        <Briefcase className="size-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Employee Portal</h1>
                    <p className="text-slate-500 mt-2">Sign in to access your workspace</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="text-sm font-semibold text-slate-700 flex gap-2 items-center">
                            <Mail className={`size-4 ${errors.email ? 'text-red-500' : 'text-emerald-600'}`} /> Work Email
                        </label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="employee@company.com"
                            className={`w-full mt-2 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                                errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-emerald-500'
                            }`}
                        />
                        {errors.email && <p className="text-xs font-bold text-red-500 mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <div className="flex justify-between">
                            <label className="text-sm font-semibold text-slate-700 flex gap-2 items-center">
                                <Lock className={`size-4 ${errors.password ? 'text-red-500' : 'text-emerald-600'}`} /> Password
                            </label>
                            <a href="#" className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:text-emerald-700">
                                <ShieldCheck className="size-3" /> Forgot?
                            </a>
                        </div>
                        <input
                            {...register('password')}
                            type="password"
                            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                            className={`w-full mt-2 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                                errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-emerald-500'
                            }`}
                        />
                        {errors.password && <p className="text-xs font-bold text-red-500 mt-1">{errors.password.message}</p>}
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                    >
                        {loading ? (
                            <Loader2 className="size-5 animate-spin" />
                        ) : (
                            <>
                                Login <ArrowRight className="size-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
}
