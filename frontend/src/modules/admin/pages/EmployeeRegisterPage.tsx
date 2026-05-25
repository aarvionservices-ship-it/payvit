// modules/admin/pages/EmployeeRegisterPage.tsx

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    User,
    Mail,
    ArrowRight,
    Briefcase,
    Phone,
    Loader2,
    ShieldCheck,
    KeyRound,
    ArrowLeft
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createEmployeeRequest, getEmployeeByIdRequest, updateEmployeeRequest } from "../../../api/admin.api";
import { toast } from "react-hot-toast";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits").max(10, "Phone number must be 10 digits"),
    password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal('')),
    isActive: z.boolean().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function EmployeeRegisterPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            password: "",
            isActive: true,
        }
    });

    useEffect(() => {
        if (isEditMode) {
            fetchEmployee();
        }
    }, [id]);

    const fetchEmployee = async () => {
        try {
            setFetching(true);
            const response = await getEmployeeByIdRequest(id!);
            if (response.success) {
                const { name, email, phone, isActive } = response.data;
                reset({ name, email, phone, password: "", isActive });
            }
        } catch (error) {
            toast.error("Failed to fetch employee details");
            navigate("/admin/employees");
        } finally {
            setFetching(false);
        }
    };

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            setLoading(true);
            
            // For updates, if password is empty, don't send it
            const payload = { ...data };
            if (isEditMode && !payload.password) {
                delete payload.password;
            }

            const response = isEditMode 
                ? await updateEmployeeRequest(id!, payload)
                : await createEmployeeRequest(data);

            if (response.success) {
                toast.success(isEditMode ? "Employee updated successfully!" : "Employee registered successfully!");
                navigate("/admin/employees");
            } else {
                toast.error(response.message || (isEditMode ? "Update failed" : "Registration failed"));
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                >
                    <ArrowLeft className="size-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {isEditMode ? "Edit Employee" : "Add New Employee"}
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        {isEditMode ? "Update staff account details" : "Create a new staff account for PayVit"}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-2xl relative">
                {fetching && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <Loader2 className="size-8 animate-spin text-blue-600" />
                    </div>
                )}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Briefcase className="size-5" />
                        </div>
                        <h2 className="font-bold text-slate-800">Employee Information</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <User className="size-4 text-slate-400" /> Full Name
                            </label>

                            <input
                                {...register("name")}
                                type="text"
                                placeholder="e.g. Rahul Sharma"
                                className="w-full border-2 border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                            />

                            {errors.name && (
                                <p className="text-xs font-bold text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Mail className="size-4 text-slate-400" /> Work Email
                            </label>

                            <input
                                {...register("email")}
                                type="email"
                                placeholder="rahul@PayVit.com"
                                className="w-full border-2 border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                            />

                            {errors.email && (
                                <p className="text-xs font-bold text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Phone className="size-4 text-slate-400" /> Phone Number
                            </label>

                            <input
                                {...register("phone")}
                                type="tel"
                                placeholder="10-digit mobile number"
                                className="w-full border-2 border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                            />

                            {errors.phone && (
                                <p className="text-xs font-bold text-red-500">{errors.phone.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <KeyRound className="size-4 text-slate-400" /> {isEditMode ? "Change Password (Optional)" : "Temporary Password"}
                            </label>

                            <input
                                {...register("password")}
                                type="password"
                                placeholder={isEditMode ? "Leave blank to keep current" : "Minimum 8 characters"}
                                className="w-full border-2 border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                            />

                            {errors.password && (
                                <p className="text-xs font-bold text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Status - Only in Edit Mode */}
                        {isEditMode && (
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input
                                        {...register("isActive")}
                                        type="checkbox"
                                        className="size-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Active Account</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Uncheck to disable this employee's access</p>
                                    </div>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-60 shadow-lg shadow-blue-500/20"
                        >
                            {loading ? (
                                <Loader2 className="size-5 animate-spin" />
                            ) : (
                                <>
                                    {isEditMode ? "Update Staff Account" : "Create Staff Account"}
                                    <ArrowRight className="size-5" />
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/admin/employees")}
                            className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-2xl flex items-start gap-3">
                <ShieldCheck className="size-5 text-amber-600 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-amber-900">Important Note</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                        Please provide a valid work email. The employee will use this email and the temporary password to log in for the first time.
                    </p>
                </div>
            </div>
        </div>
    );
}

