// modules/public/pages/LoginPage.tsx
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Zap, Fingerprint, Loader2, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { loginRequest } from '../../../api/auth.api';
import { useAuthStore } from '../../../store/auth.store';
import { toast } from 'react-hot-toast';
import { roleRedirect } from '../../../utils/roleRedirect';
import { SEO } from '../../../components/shared/SEO';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        login({ accessToken, refreshToken, user });
        toast.success('Login successful!');
        
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
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50/50 relative overflow-hidden">
      <SEO 
        title="Login - Access Your Account"
        description="Sign in to your PayVit account to manage your loans, credit cards, and investments. Secure and fast access to your financial dashboard."
      />
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-2xl p-8 space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <div className="size-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-6 shadow-lg shadow-blue-500/30 transform rotate-3 hover:rotate-0 transition-transform">
            <Zap className="size-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 font-medium">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Mail className="size-4 text-blue-500" /> Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className={`size-5 transition-colors ${errors.email ? 'text-red-500' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
              </div>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className={`w-full bg-white border-2 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-4 transition-all shadow-sm ${
                  errors.email 
                    ? 'border-red-100 focus:ring-red-500/10 focus:border-red-500' 
                    : 'border-slate-100 focus:ring-blue-500/10 focus:border-blue-500'
                }`}
              />
            </div>
            {errors.email && <p className="text-xs font-bold text-red-500 ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Lock className="size-4 text-indigo-500" /> Password
              </label>
              <Link to="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <ShieldCheck className="size-3" /> Forgot password?
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Fingerprint className={`size-5 transition-colors ${errors.password ? 'text-red-500' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
              </div>
              <input
                {...register('password')}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full bg-white border-2 rounded-2xl py-3.5 pl-12 pr-12 text-sm font-medium focus:outline-none focus:ring-4 transition-all shadow-sm ${
                  errors.password 
                    ? 'border-red-100 focus:ring-red-500/10 focus:border-red-500' 
                    : 'border-slate-100 focus:ring-indigo-500/10 focus:border-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs font-bold text-red-500 ml-1">{errors.password.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                Login to Dashboard <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="pt-6 border-t border-slate-100">
          <p className="text-center text-sm font-medium text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:text-indigo-600 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

