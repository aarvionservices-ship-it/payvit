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
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits and contain only numbers').optional().or(z.literal('')),
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
    <form onSubmit={handleSubmit(onPreSubmit)} className="max-w-4xl mx-auto space-y-6 lg:space-y-8 pb-10">
      {/* Header section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your account information, profile image, and security settings.</p>
      </div>

      <AnimatePresence>
        {isDirty && !showPasswordModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-8 right-8 z-[80]"
          >
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all border border-transparent"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Profile
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {fetching ? (
        <div className="flex h-60 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
              <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="size-24 rounded-full object-cover border-4 border-slate-50 dark:border-slate-850" />
                ) : (
                  <div className="size-24 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center font-bold text-3xl border-4 border-slate-50 dark:border-slate-850">
                    {authUser?.name?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Camera className="size-6 text-white" />
                </div>
                <button 
                  type="button" 
                  className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors shadow-sm z-10"
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
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{authUser?.name || 'User'}</h2>
              <p className="text-sm text-slate-505 capitalize mt-1.5">{authUser?.role || 'Role'}</p>
              
              <div className="flex flex-col gap-2 w-full mt-5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 w-fit mx-auto mb-2 capitalize shadow-sm">
                  Active
                </span>
                
                <button 
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full py-2 px-4 bg-slate-955 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Key className="size-3.5" /> Reset Password
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3.5">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400 p-1.5 border-b border-slate-100 dark:border-slate-800/60 pb-2.5 last:border-0 last:pb-0">
                <Shield className="size-4 text-blue-600 shrink-0" />
                <span className="capitalize">Role: <strong className="text-slate-900 dark:text-white ml-1">{authUser?.role || 'Employee'}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-650 dark:text-slate-400 p-1.5 border-b border-slate-100 dark:border-slate-800/60 pb-2.5 last:border-0 last:pb-0">
                <Mail className="size-4 text-blue-600 shrink-0" />
                <span className="truncate w-full block">Email:<strong className="text-slate-900 dark:text-white font-medium ml-1">{email}</strong></span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center gap-2">
                <User className="size-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Personal Information</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Full Name</label>
                    <input 
                      type="text" 
                      {...register("name")}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <input 
                        type="email" 
                        disabled
                        value={email}
                        className="w-full bg-slate-100 dark:bg-slate-900/50 cursor-not-allowed border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all text-slate-500 font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Phone Number</label>
                    <div className="flex gap-2">
                      <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none cursor-pointer">
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+971">+971 (AE)</option>
                      </select>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input 
                          type="tel" 
                          {...register("phone", {
                            onChange: (e) => {
                              e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                            }
                          })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                        />
                      </div>
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="size-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center shadow-sm">
                    <Key className="size-5" />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Reset Password</h2>
                <p className="text-xs text-slate-500 mb-6">Update your account credentials to keep it secure.</p>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Current Password</label>
                    <input 
                      type="password" 
                      {...register("currentPassword")}
                      placeholder="Enter current password"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl py-2.5 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    {errors.currentPassword && <p className="text-xs text-red-500 mt-1">{errors.currentPassword.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 block mb-1">New Password</label>
                    <input 
                      type="password" 
                      {...register("newPassword")}
                      placeholder="Enter new password (min. 8 characters)"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl py-2.5 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Confirm Password</label>
                    <input 
                      type="password" 
                      {...register("confirmPassword")}
                      placeholder="Confirm new password"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl py-2.5 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-2 text-xs font-semibold text-slate-500 hover:text-slate-750 transition-colors"
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
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : 'Update Password'}
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
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-205 dark:border-slate-800 p-6 text-center"
            >
               <div className="size-14 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 dark:border-slate-800">
                  <Save className="size-6" />
               </div>
               <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">Save Changes?</h2>
               <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Are you sure you want to update your administrative profile settings?
               </p>

               <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-2 text-xs font-semibold text-slate-500 hover:text-slate-750 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleConfirmSave}
                    disabled={loading}
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : 'Confirm Save'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </form>
  );
}
