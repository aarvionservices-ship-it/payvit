import { useState, useEffect, useRef } from 'react';
import { User, Mail, Shield, Key, Save, Camera, Loader2, Phone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';

import { getProfileRequest, updateProfileRequest } from '../../../api/user.api';
import { useAuthStore } from '../../../store/auth.store';

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15).optional().or(z.literal('')),
  profileImage: z.string().optional().nullable(),
  currentPassword: z.string().optional().or(z.literal('')),
  newPassword: z.string().min(8, "Minimum 8 characters").optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine(data => {
  if (data.newPassword && !data.currentPassword) return false;
  return true;
}, {
  message: "Current password is required",
  path: ["currentPassword"]
}).refine(data => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) return false;
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { user: authUser, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      profileImage: null,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setFetching(true);
      const response = await getProfileRequest();
      if (response && response.success !== false) {
        const data = response.data || response;
        reset({
          name: data.name || "",
          phone: data.phone || "",
          profileImage: data.profileImage || null,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setEmail(data.email || "");
        if (data.profileImage) {
          setPreviewImage(data.profileImage);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch profile");
    } finally {
      setFetching(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewImage(base64);
      setValue('profileImage', base64, { shouldDirty: true });
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setLoading(true);
      const payload: any = {
        name: data.name,
        phone: data.phone,
        profileImage: data.profileImage,
      };

      if (data.newPassword) {
        payload.currentPassword = data.currentPassword;
        payload.newPassword = data.newPassword;
        payload.confirmPassword = data.confirmPassword;
      }

      const response = await updateProfileRequest(payload);
      if (response.success !== false) {
        toast.success(data.newPassword ? "Security updated successfully!" : "Profile updated successfully!");
        if (authUser) {
          setUser({ ...authUser, name: data.name, profileImage: data.profileImage || undefined });
        }
        
        reset({
          name: data.name,
          phone: data.phone,
          profileImage: data.profileImage,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordModal(false);
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 uppercase italic">My Profile</h1>
        <AnimatePresence>
          {isDirty && (
            <motion.button 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={handleSubmit(onSubmit)}
              disabled={loading || fetching}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} 
              Commit Changes
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {fetching ? (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center relative overflow-hidden">
              <div className="relative mb-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="size-28 rounded-[2rem] object-cover border-4 border-slate-50 shadow-xl shadow-slate-200/50" />
                ) : (
                  <div className="size-28 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-3xl border-4 border-slate-50 shadow-xl shadow-slate-200/50 uppercase">
                    {authUser?.name?.substring(0, 2) || 'E'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Camera className="size-8 text-white" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">{authUser?.name || 'Authorized User'}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 capitalize">{authUser?.role || 'authorized_staff'}</p>
              
              <div className="flex flex-col gap-2 w-full">
                <button 
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full py-3 px-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
                >
                  <Key className="size-4" /> Reset Security
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-3">
              <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <Shield className="size-4 text-emerald-500" />
                <span className="capitalize">Role Class: <strong className="text-slate-900">{authUser?.role}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <Mail className="size-4 text-emerald-500" />
                <span className="truncate w-full block"><strong>Email:</strong> <span className="text-slate-900">{email}</span></span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-8 space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="size-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <User className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase italic leading-none">Identity</h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Personal Record Management</p>
                </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                    <input 
                      type="text" 
                      {...register("name")}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none"
                    />
                    {errors.name && <p className="text-[9px] font-black text-rose-500 mt-1 uppercase italic">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Connectivity Identifier</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <input 
                        type="tel" 
                        {...register("phone")}
                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-5 text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none"
                      />
                    </div>
                    {errors.phone && <p className="text-[9px] font-black text-rose-500 mt-1 uppercase italic">{errors.phone.message}</p>}
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/5">
                    <Key className="size-6" />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight uppercase italic">Security Shield</h2>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mb-8">Credential Dispatch Protocol</p>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Password</label>
                    <input 
                      type="password" 
                      {...register("currentPassword")}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3.5 px-4 text-[11px] font-black uppercase focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none"
                    />
                    {errors.currentPassword && <p className="text-[9px] font-black text-rose-500 mt-1 uppercase italic">{errors.currentPassword.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">New Protocol</label>
                    <input 
                      type="password" 
                      {...register("newPassword")}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3.5 px-4 text-[11px] font-black uppercase focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none"
                    />
                    {errors.newPassword && <p className="text-[9px] font-black text-rose-500 mt-1 uppercase italic">{errors.newPassword.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Verify Protocol</label>
                    <input 
                      type="password" 
                      {...register("confirmPassword")}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3.5 px-4 text-[11px] font-black uppercase focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none"
                    />
                    {errors.confirmPassword && <p className="text-[9px] font-black text-rose-500 mt-1 uppercase italic">{errors.confirmPassword.message}</p>}
                  </div>
                </div>

                <div className="mt-8">
                  <button 
                    type="button"
                    disabled={loading}
                    onClick={handleSubmit(async (data) => {
                       if (!data.newPassword) return toast.error("New protocol required");
                       await onSubmit(data);
                    })}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
                    Update Security
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

