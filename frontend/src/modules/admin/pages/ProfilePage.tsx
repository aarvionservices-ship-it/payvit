import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Shield, Key, Save, Camera, Loader2, X } from 'lucide-react';
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

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingData, setPendingData] = useState<ProfileFormValues | null>(null);

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

  const onPreSubmit = (data: ProfileFormValues) => {
    setPendingData(data);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (pendingData) {
      await onSubmit(pendingData);
      setShowConfirmModal(false);
      setPendingData(null);
    }
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
        toast.success("Profile updated successfully!");
        if (authUser) {
          setUser({ ...authUser, name: data.name });
        }
        reset({
          name: data.name,
          phone: data.phone,
          profileImage: data.profileImage,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
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
    <form onSubmit={handleSubmit(onPreSubmit)} className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 uppercase italic">My Profile</h1>
      </div>

      <AnimatePresence>
        {isDirty && !showPasswordModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-10 right-10 z-[80]"
          >
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all flex items-center gap-3 border-4 border-white dark:border-slate-900"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Synchronize Data
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {fetching ? (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
              <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="size-24 rounded-full object-cover border-4 border-slate-50" />
                ) : (
                  <div className="size-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-3xl border-4 border-slate-50">
                    {authUser?.name?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Camera className="size-6 text-white" />
                </div>
                <button 
                  type="button" 
                  className="absolute bottom-0 right-0 p-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm z-10"
                >
                  <Camera className="size-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{authUser?.name || 'User'}</h2>
              <p className="text-sm text-slate-500 mb-4 capitalize">{authUser?.role || 'Role'}</p>
              
              <div className="flex flex-col gap-2 w-full">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 mb-2 w-fit mx-auto">
                  Account Active
                </span>
                
                <button 
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full py-2.5 px-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                >
                  <Key className="size-3.5" /> Reset Password
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
              <div className="flex items-center gap-3 text-sm text-slate-600 p-2">
                <Shield className="size-4 text-slate-400" />
                <span className="capitalize">Role: <strong>{authUser?.role || 'Employee'}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 p-2">
                <Mail className="size-4 text-slate-400" />
                <span className="truncate w-full block"><strong>Email:</strong> {email}</span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
                <User className="size-5 text-slate-500" />
                <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <input 
                      type="text" 
                      {...register("name")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2 gap-6 sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <input 
                        type="email" 
                        disabled
                        value={email}
                        className="w-full bg-slate-100 cursor-not-allowed border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none transition-all text-slate-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <input 
                        type="tel" 
                        {...register("phone")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                  </div>
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

                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight">Secure Reset</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-8">Update your administrative credentials</p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Password</label>
                    <input 
                      type="password" 
                      {...register("currentPassword")}
                      placeholder="Enter current password"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {errors.currentPassword && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.currentPassword.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</label>
                    <input 
                      type="password" 
                      {...register("newPassword")}
                      placeholder="Enter new password"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {errors.newPassword && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.newPassword.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm Password</label>
                    <input 
                      type="password" 
                      {...register("confirmPassword")}
                      placeholder="Confirm new password"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {errors.confirmPassword && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.confirmPassword.message}</p>}
                  </div>
                </div>

                <div className="mt-10 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    disabled={loading}
                    onClick={handleSubmit(async (data) => {
                       if (!data.newPassword) return toast.error("New password is required");
                       await onSubmit(data);
                       setShowPasswordModal(false);
                    })}
                    className="flex-[2] bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : 'Update Security'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 text-center"
            >
               <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 shadow-inner">
                  <Save className="size-10" />
               </div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic mb-2">Commit Changes?</h2>
               <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">
                  Are you sure you want to synchronize these administrative profile updates to the master record?
               </p>

               <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Abort
                  </button>
                  <button 
                    type="button"
                    onClick={handleConfirmSave}
                    disabled={loading}
                    className="flex-[2] bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : 'Confirm Sync'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </form>
  );
}

