// modules/public/pages/RegisterPage.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, UserPlus, Fingerprint, ShieldCheck, Phone, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { registerRequest } from '../../../api/auth.api';
import { toast } from 'react-hot-toast';
import { SEO } from '../../../components/shared/SEO';

const registerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setLoading(true);
      const response = await registerRequest(data);

      if (response.success) {
        toast.success('Registration successful! Please login.');
        navigate('/login');
      } else {
        toast.error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 my-8 bg-slate-50/50 relative overflow-hidden">
      <SEO 
        title="Create Account - Join PayVit"
        description="Join PayVit to access exclusive loan offers, credit cards, and smart financial tools. Start your journey towards financial freedom today."
      />
      {/* Decorative background elements */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-2xl p-8 space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <div className="size-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-6 shadow-lg shadow-emerald-500/30 transform -rotate-3 hover:rotate-0 transition-transform">
            <UserPlus className="size-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create an Account</h1>
          <p className="text-slate-500 font-medium">Join PayVit to apply for the best offers</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <User className="size-4 text-emerald-500" /> Full Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className={`size-5 transition-colors ${errors.name ? 'text-red-500' : 'text-slate-400 group-focus-within:text-emerald-500'}`} />
              </div>
              <input
                {...register('name')}
                type="text"
                placeholder="John Doe"
                className={`w-full bg-white border-2 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-4 transition-all shadow-sm ${errors.name
                    ? 'border-red-100 focus:ring-red-500/10 focus:border-red-500'
                    : 'border-slate-100 focus:ring-emerald-500/10 focus:border-emerald-500'
                  }`}
              />
            </div>
            {errors.name && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1"
              >
                <AlertCircle className="size-3" /> {errors.name.message}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Mail className="size-4 text-teal-500" /> Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className={`size-5 transition-colors ${errors.email ? 'text-red-500' : 'text-slate-400 group-focus-within:text-teal-500'}`} />
              </div>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className={`w-full bg-white border-2 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-4 transition-all shadow-sm ${errors.email
                    ? 'border-red-100 focus:ring-red-500/10 focus:border-red-500'
                    : 'border-slate-100 focus:ring-teal-500/10 focus:border-teal-500'
                  }`}
              />
            </div>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1"
              >
                <AlertCircle className="size-3" /> {errors.email.message}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Phone className="size-4 text-emerald-500" /> Phone Number
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className={`size-5 transition-colors ${errors.phone ? 'text-red-500' : 'text-slate-400 group-focus-within:text-emerald-500'}`} />
              </div>
              <input
                {...register('phone')}
                type="tel"
                placeholder="+91 9876543210"
                className={`w-full bg-white border-2 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-4 transition-all shadow-sm ${errors.phone
                    ? 'border-red-100 focus:ring-red-500/10 focus:border-red-500'
                    : 'border-slate-100 focus:ring-emerald-500/10 focus:border-emerald-500'
                  }`}
              />
            </div>
            {errors.phone && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1"
              >
                <AlertCircle className="size-3" /> {errors.phone.message}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Lock className="size-4 text-emerald-600" /> Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Fingerprint className={`size-5 transition-colors ${errors.password ? 'text-red-500' : 'text-slate-400 group-focus-within:text-emerald-600'}`} />
              </div>
              <input
                {...register('password')}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full bg-white border-2 rounded-2xl py-3.5 pl-12 pr-12 text-sm font-medium focus:outline-none focus:ring-4 transition-all shadow-sm ${errors.password
                    ? 'border-red-100 focus:ring-red-500/10 focus:border-red-500'
                    : 'border-slate-100 focus:ring-emerald-500/10 focus:border-emerald-600'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600 transition-colors"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-2">
              <ShieldCheck className="size-3 text-emerald-500" /> Must be at least 8 characters long
            </p>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1"
              >
                <AlertCircle className="size-3" /> {errors.password.message}
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                Create Account <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="pt-6 border-t border-slate-100">
          <p className="text-center text-sm font-medium text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-emerald-600 hover:text-teal-600 transition-colors">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

