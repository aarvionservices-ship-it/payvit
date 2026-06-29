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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Profile Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your identity and authentication settings</p>
        </div>
        <AnimatePresence>
          {isDirty && (
            <motion.button 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={handleSubmit(onSubmit)}
              disabled={loading || fetching}
              className="bg-emerald-650 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} 
              Save Changes
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {fetching ? (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-emerald-650" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Sidebar */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
              <div className="relative mb-5 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="size-24 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
                ) : (
                  <div className="size-24 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-2xl border border-slate-200 dark:border-slate-700 shadow-sm uppercase">
                    {authUser?.name?.substring(0, 2) || 'E'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Camera className="size-6 text-white" />
                 </div>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept="image/*" 
                   onChange={handleImageChange} 
                 />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight mb-1">{authUser?.name || 'Authorized User'}</h2>
              <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-5 capitalize">{authUser?.role || 'authorized_staff'}</p>
              
              <div className="w-full">
                <button 
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-850 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Key className="size-4" /> Reset Security
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 space-y-2">
              <div className="flex items-center gap-3 text-xs font-medium text-slate-505 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850/50 p-2.5 rounded-lg border border-slate-100/50 dark:border-slate-800">
                <Shield className="size-4 text-emerald-650 shrink-0" />
                <span className="capitalize">Role Class: <strong className="text-slate-900 dark:text-white">{authUser?.role}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-505 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850/50 p-2.5 rounded-lg border border-slate-100/50 dark:border-slate-800">
                <Mail className="size-4 text-emerald-650 shrink-0" />
                <span className="truncate w-full block"><strong>Email:</strong> <span className="text-slate-900 dark:text-white">{email}</span></span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-105 dark:border-slate-800 pb-4">
                <div className="size-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-650 shrink-0">
                  <User className="size-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Identity Details</h2>
                  <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">Manage full legal name and mobile connectivity identifiers</p>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-550 dark:text-slate-400 ml-0.5">Full Legal Name</label>
                    <input 
                      type="text" 
                      {...register("name")}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-850 rounded-xl py-2.5 px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                    {errors.name && <p className="text-xs font-semibold text-rose-550 mt-1 uppercase tracking-wide">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-550 dark:text-slate-400 ml-0.5">Mobile Phone Number</label>
                    <div className="flex gap-2">
                      <select className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-850 rounded-xl px-3 py-2.5 text-xs font-medium outline-none cursor-pointer">
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+971">+971 (AE)</option>
                      </select>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input 
                          type="tel" 
                          {...register("phone", {
                            onChange: (e) => {
                              e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                            }
                          })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                        />
                      </div>
                    </div>
                    {errors.phone && <p className="text-xs font-semibold text-rose-550 mt-1 uppercase tracking-wide">{errors.phone.message}</p>}
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
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl relative z-10 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Key className="size-4.5" />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-405"
                  >
                    <X className="size-4.5" />
                  </button>
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 leading-tight">Reset Password</h2>
                <p className="text-xs text-slate-450 dark:text-slate-400 mb-6">Enter current credentials to verify your identity</p>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-0.5">Current Password</label>
                    <input 
                      type="password" 
                      {...register("currentPassword")}
                      placeholder="Enter current password"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-850 rounded-xl py-2.5 px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                    {errors.currentPassword && <p className="text-xs font-semibold text-rose-550 mt-1 uppercase tracking-wide">{errors.currentPassword.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-0.5">New Password</label>
                    <input 
                      type="password" 
                      {...register("newPassword")}
                      placeholder="Enter new password"
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-850 rounded-xl py-2.5 px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                    {errors.newPassword && <p className="text-xs font-semibold text-rose-550 mt-1 uppercase tracking-wide">{errors.newPassword.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-0.5">Verify New Password</label>
                    <input 
                      type="password" 
                      {...register("confirmPassword")}
                      placeholder="Confirm new password"
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-850 rounded-xl py-2.5 px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                    {errors.confirmPassword && <p className="text-xs font-semibold text-rose-550 mt-1 uppercase tracking-wide">{errors.confirmPassword.message}</p>}
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button 
                    type="button"
                    disabled={loading}
                    onClick={handleSubmit(async (data) => {
                       if (!data.newPassword) return toast.error("New protocol required");
                       await onSubmit(data);
                    })}
                    className="w-full bg-emerald-650 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
                    Update Security Password
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Cancel
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

