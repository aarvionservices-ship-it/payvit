import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Save, Camera, Key, ShieldCheck, Calendar, Briefcase, Loader2, X, AlertTriangle } from 'lucide-react';
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
  dob: z.string().optional().nullable().or(z.date()),
  gender: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  annualIncome: z.coerce.number().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  aadhaarNumber: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
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


export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { user: authUser, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<any>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      profileImage: null,
      dob: "",
      gender: "",
      occupation: "",
      annualIncome: 0,
      panNumber: "",
      aadhaarNumber: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
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
        const addr = data.addresses?.[0] || {};
        reset({
          name: data.name || "",
          phone: data.phone || "",
          profileImage: data.profileImage || null,
          dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : "",
          gender: data.gender || "",
          occupation: data.occupation || "",
          annualIncome: data.annualIncome || 0,
          panNumber: data.panNumber || "",
          aadhaarNumber: data.aadhaarNumber || "",
          street: addr.street || "",
          city: addr.city || "",
          state: addr.state || "",
          pincode: addr.pincode || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setEmail(data.email || "");
        if (data.createdAt) {
          setCreatedAt(new Date(data.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }));
        }
        if (data.profileImage) {
          setPreviewImage(data.profileImage);
        }
        setOriginalData(data); // Store for cancel functionality
      }
    } catch (error) {
      toast.error("Failed to load profile details");
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

  const handleSaveClick = (data: any) => {
    setPendingData(data);
    setShowConfirmModal(true);
  };

  const handleCancelChanges = () => {
    if (originalData) {
      const addr = originalData.addresses?.[0] || {};
      reset({
        name: originalData.name || "",
        phone: originalData.phone || "",
        profileImage: originalData.profileImage || null,
        dob: originalData.dob ? new Date(originalData.dob).toISOString().split('T')[0] : "",
        gender: originalData.gender || "",
        occupation: originalData.occupation || "",
        annualIncome: originalData.annualIncome || 0,
        panNumber: originalData.panNumber || "",
        aadhaarNumber: originalData.aadhaarNumber || "",
        street: addr.street || "",
        city: addr.city || "",
        state: addr.state || "",
        pincode: addr.pincode || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPreviewImage(originalData.profileImage || null);
      toast.success("Changes discarded");
    }
  };

  const onSubmit = async (data: any) => {
    setShowConfirmModal(false);
    try {
      setLoading(true);
      const payload: any = {
        name: data.name,
        phone: data.phone,
        profileImage: data.profileImage,
        dob: data.dob || null,
        gender: data.gender || null,
        occupation: data.occupation || null,
        annualIncome: data.annualIncome ? Number(data.annualIncome) : 0,
        panNumber: data.panNumber,
        aadhaarNumber: data.aadhaarNumber,
        addresses: [{
          street: data.street,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          type: "current"
        }]
      };

      const response = await updateProfileRequest(payload);
      if (response.success !== false) {
        toast.success("Profile updated successfully!");
        if (authUser) {
          setUser({ ...authUser, name: data.name, profileImage: data.profileImage || undefined });
        }
        // Update original data after successful save
        fetchProfile();
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onUpdatePassword = async (data: any) => {
    if (!data.currentPassword || !data.newPassword) {
      toast.error("Please fill all password fields");
      return;
    }
    
    try {
      setSavingSecurity(true);
      const payload = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      };

      const response = await updateProfileRequest(payload);
      if (response.success !== false) {
        toast.success("Password updated successfully!");
        setValue('currentPassword', '');
        setValue('newPassword', '');
        setValue('confirmPassword', '');
      } else {
        toast.error(response.message || "Failed to update password");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setSavingSecurity(false);
    }
  };

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 size-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 w-full flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <User className="size-8 text-blue-200" /> My Profile
            </h1>
            <p className="text-blue-100 mt-2 font-medium">Manage your personal information and security settings.</p>
          </div>
          {isDirty && (
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={handleCancelChanges}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border border-white/10 active:scale-95"
              >
                <X className="size-4" /> Cancel
              </button>
              <button 
                type="button"
                disabled={loading || fetching}
                onClick={handleSubmit(handleSaveClick)}
                className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-2.5 rounded-xl font-extrabold text-sm flex items-center gap-2 transition-all shadow-xl shadow-blue-900/20 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Change Indicator */}
      {isDirty && !showConfirmModal && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-700/50 backdrop-blur-xl">
             <div className="flex items-center gap-3">
               <div className="size-2 bg-blue-500 rounded-full animate-pulse shadow-glow shadow-blue-500/50"></div>
               <span className="text-sm font-bold tracking-tight">You have unsaved changes</span>
             </div>
             <div className="h-4 w-px bg-slate-700"></div>
             <div className="flex items-center gap-3">
                <button 
                  onClick={handleCancelChanges}
                  className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSubmit(handleSaveClick)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Save Now
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-slate-900/60 transition-all duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="size-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600 ring-8 ring-blue-50/50">
                <AlertTriangle className="size-10" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Save Changes?</h2>
                <p className="text-slate-500 mt-2 font-medium">Are you sure you want to update your profile with these changes? This action cannot be easily undone.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="py-3.5 px-6 rounded-2xl text-sm font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
                >
                  No, Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => onSubmit(pendingData)}
                  className="py-3.5 px-6 rounded-2xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex items-center justify-center gap-2"
                >
                   Yes, Update Profile
                </button>
              </div>
            </div>
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Safe & Secure Transactions</p>
            </div>
          </div>
        </div>
      )}

      {fetching ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="size-10 animate-spin text-blue-600" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-8 flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-100 to-indigo-50"></div>
              <div 
                className="relative mb-6 mt-4 cursor-pointer" 
                onClick={() => fileInputRef.current?.click()}
              >
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="size-28 rounded-full object-cover shadow-xl ring-4 ring-white relative z-10" />
                ) : (
                  <div className="size-28 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-4xl shadow-xl ring-4 ring-white relative z-10">
                    {authUser?.name?.substring(0, 2).toUpperCase() || 'CU'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                   <Camera className="size-6 text-white" />
                </div>
                <button 
                  type="button"
                  className="absolute bottom-0 right-0 p-2.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-lg group-hover:scale-110 transform duration-200 z-30"
                >
                  <Camera className="size-5" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">{authUser?.name || 'Customer'}</h2>
              <p className="text-sm font-medium text-slate-500 mb-4 flex items-center justify-center gap-1.5 capitalize">
                <Briefcase className="size-4" /> {authUser?.role || 'Customer'}
              </p>
              <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="size-4" /> Verified
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Account Snapshot</h3>
              <div className="flex items-center gap-4 text-sm text-slate-700 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <Mail className="size-4" />
                </div>
                <span className="truncate font-medium">{email}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-700 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                  <Calendar className="size-4" />
                </div>
                <span className="font-medium">Joined {createdAt || 'Recently'}</span>
              </div>
            </div>
          </div>

          {/* Profile Forms */}
          <div className="md:col-span-2 space-y-8">
            {/* Edit Profile */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <User className="size-5" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">Personal Details</h2>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                      <input 
                        type="text" 
                        {...register("name")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                      />
                    </div>
                    {errors.name && <p className="text-xs text-rose-500">{(errors.name as any).message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                      <input 
                        type="tel" 
                        {...register("phone")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-rose-500">{(errors.phone as any).message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                      <input 
                        type="date" 
                        {...register("dob")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gender</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                      <select 
                        {...register("gender")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 appearance-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                  <ShieldCheck className="size-5" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">Address Details</h2>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Street Address</label>
                  <input 
                    type="text" 
                    {...register("street")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">City</label>
                    <input 
                      type="text" 
                      {...register("city")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">State</label>
                    <input 
                      type="text" 
                      {...register("state")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pincode</label>
                    <input 
                      type="text" 
                      {...register("pincode")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Briefcase className="size-5" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">Additional Information</h2>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Occupation</label>
                    <input 
                      type="text" 
                      {...register("occupation")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Annual Income (₹)</label>
                    <input 
                      type="number" 
                      {...register("annualIncome")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">PAN Number</label>
                    <input 
                      type="text" 
                      {...register("panNumber")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aadhaar Number</label>
                    <input 
                      type="text" 
                      {...register("aadhaarNumber")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                  <Key className="size-5" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">Security Settings</h2>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                    <input 
                      type="password" 
                      {...register("currentPassword")}
                      placeholder="Enter current password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-900"
                    />
                  </div>
                  {errors.currentPassword && <p className="text-xs text-rose-500">{(errors.currentPassword as any).message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                      <input 
                        type="password" 
                        {...register("newPassword")}
                        placeholder="Enter new password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-900"
                      />
                    </div>
                    {errors.newPassword && <p className="text-xs text-rose-500">{(errors.newPassword as any).message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                      <input 
                        type="password" 
                        {...register("confirmPassword")}
                        placeholder="Confirm new password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-900"
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-rose-500">{(errors.confirmPassword as any).message}</p>}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-end">
                  <button
                    type="button"
                    disabled={savingSecurity || fetching}
                    onClick={handleSubmit(onUpdatePassword as any)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {savingSecurity ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </main>
  );
}

