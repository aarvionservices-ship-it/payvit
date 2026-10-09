import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
    User, 
    MapPin, 
    Briefcase, 
    IdCard, 
    ChevronRight, 
    ChevronLeft, 
    CheckCircle2,
    Calendar,
    CircleDollarSign,
    Target,
    Camera
} from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import api from "../../../api/axios"
import { useAuthStore } from "../../../store/auth.store"

const profileSchema = z.object({
    profileImage: z.string().optional().nullable(),
    dob: z.union([z.date(), z.string()]).refine((val) => val instanceof Date || (typeof val === 'string' && val.length > 0), "Date of birth is required"),
    gender: z.enum(["male", "female", "other"]),
    occupation: z.string().min(1, "Occupation is required"),
    annualIncome: z.number({ message: "Income must be a number" }).min(0, "Income must be a positive number"),
    panNumber: z.string().optional().refine((val) => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), "Invalid PAN format"),
    aadhaarNumber: z.string().regex(/^[2-9]{1}[0-9]{11}$/, "Invalid Aadhaar format"),
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().regex(/^[1-9]{1}[0-9]{5}$/, "Invalid Pincode"),
})

type ProfileFormData = z.infer<typeof profileSchema>

const steps = [
    { id: "personal", title: "Personal", icon: User },
    { id: "financial", title: "Financial", icon: CircleDollarSign },
    { id: "identity", title: "Identity", icon: IdCard },
    { id: "address", title: "Address", icon: MapPin },
]

export default function CompleteProfilePage() {
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const navigate = useNavigate()
    const { user, setUser } = useAuthStore()

    const {
        register,
        handleSubmit,
        trigger,
        control,
        setValue,
        formState: { errors },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        mode: "onChange"
    })

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

    const nextStep = async () => {
        const fields = getFieldsForStep(currentStep)
        const isValid = await trigger(fields as any)
        if (isValid) {
            if (currentStep < steps.length - 1) {
                setCurrentStep(prev => prev + 1)
            }
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const getFieldsForStep = (step: number) => {
        switch (step) {
            case 0: return ["dob", "gender", "profileImage"]
            case 1: return ["occupation", "annualIncome"]
            case 2: return ["panNumber", "aadhaarNumber"]
            case 3: return ["street", "city", "state", "pincode"]
            default: return []
        }
    }

    const onSubmit = async (data: ProfileFormData) => {
        setIsSubmitting(true)
        try {
            const formattedData = {
                profileImage: data.profileImage,
                dob: data.dob,
                gender: data.gender,
                occupation: data.occupation,
                annualIncome: data.annualIncome,
                panNumber: data.panNumber,
                aadhaarNumber: data.aadhaarNumber,
                addresses: [{
                    street: data.street,
                    city: data.city,
                    state: data.state,
                    pincode: data.pincode,
                    type: "current"
                }]
            }

            const res = await api.post("/users/customer-profile/update", formattedData)
            
            if (res.data.success) {
                toast.success("Profile completed successfully!")
                // Update auth store user
                if (user) {
                    setUser({ ...user, isProfileComplete: true })
                }
                navigate("/customer")
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save profile")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="max-w-2xl w-full text-center mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-4"
                >
                    <Target className="w-4 h-4" />
                    Complete Your Profile
                </motion.div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Almost there!</h1>
                <p className="text-slate-500">Provide a few more details to unlock all features of PayVit.</p>
            </div>

            <div className="max-w-2xl w-full">
                {/* Stepper */}
                <div className="flex justify-between mb-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
                    {steps.map((step, index) => {
                        const Icon = step.icon
                        const isActive = index <= currentStep
                        const isCurrent = index === currentStep

                        return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                                <motion.div
                                    animate={{
                                        backgroundColor: isActive ? "#2563EB" : "#FFFFFF",
                                        borderColor: isActive ? "#2563EB" : "#E2E8F0",
                                        scale: isCurrent ? 1.1 : 1
                                    }}
                                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-colors shadow-sm`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                                </motion.div>
                                <span className={`text-xs font-medium ${isActive ? "text-blue-600" : "text-slate-400"}`}>
                                    {step.title}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Form Card */}
                <motion.div
                    layout
                    className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8"
                >
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {currentStep === 0 && (
                                    <div className="space-y-8">
                                        {/* Avatar Upload */}
                                        <div className="flex flex-col items-center gap-4 py-4">
                                            <div 
                                                className="relative group cursor-pointer"
                                                onClick={() => (document.getElementById('profile-upload') as HTMLInputElement)?.click()}
                                            >
                                                <div className="size-28 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400 group-hover:bg-blue-50">
                                                    {previewImage ? (
                                                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="text-center p-4">
                                                            <User className="size-8 text-slate-400 mx-auto mb-2" />
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Photo</span>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Camera className="size-6 text-white" />
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 border-2 border-white transition-transform group-hover:scale-110"
                                                >
                                                    <Camera className="size-4" />
                                                </button>
                                                <input 
                                                    id="profile-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleImageChange}
                                                />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-sm font-bold text-slate-900">Profile Photo</h3>
                                                <p className="text-xs text-slate-500 mt-1">Recommended: Square image, max 2MB</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-blue-500" />
                                                    Date of Birth
                                                </label>
                                                <Controller
                                                    control={control}
                                                    name="dob"
                                                    render={({ field }) => (
                                                        <DatePicker
                                                            selected={field.value ? (field.value instanceof Date ? field.value : new Date(field.value)) : null}
                                                            onChange={(date: Date | null) => field.onChange(date)}
                                                            dateFormat="dd/MM/yyyy"
                                                            showMonthDropdown
                                                            showYearDropdown
                                                            dropdownMode="select"
                                                            placeholderText="Select Date of Birth"
                                                            maxDate={new Date()}
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                                                            wrapperClassName="w-full"
                                                        />
                                                    )}
                                                />
                                                {errors.dob && <p className="text-xs text-red-500">{(errors.dob as any).message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <User className="w-4 h-4 text-blue-500" />
                                                    Gender
                                                </label>
                                                <select
                                                    {...register("gender")}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white"
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="other">Other</option>
                                                </select>
                                                {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4 text-blue-500" />
                                                    Occupation
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Software Engineer"
                                                    {...register("occupation")}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                                {errors.occupation && <p className="text-xs text-red-500">{errors.occupation.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <CircleDollarSign className="w-4 h-4 text-blue-500" />
                                                    Annual Income (₹)
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="500000"
                                                    {...register("annualIncome", { valueAsNumber: true })}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                                {errors.annualIncome && <p className="text-xs text-red-500">{errors.annualIncome.message}</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <IdCard className="w-4 h-4 text-blue-500" />
                                                    PAN Number
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="ABCDE1234F"
                                                    {...register("panNumber")}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase"
                                                />
                                                {errors.panNumber && <p className="text-xs text-red-500">{errors.panNumber.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <IdCard className="w-4 h-4 text-blue-500" />
                                                    Aadhaar Number
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="234567890123"
                                                    {...register("aadhaarNumber")}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                                {errors.aadhaarNumber && <p className="text-xs text-red-500">{errors.aadhaarNumber.message}</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-blue-500" />
                                                Street Address
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="123, Blue Street"
                                                {...register("street")}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            />
                                            {errors.street && <p className="text-xs text-red-500">{errors.street.message}</p>}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">City</label>
                                                <input
                                                    type="text"
                                                    placeholder="Mumbai"
                                                    {...register("city")}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                                {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">State</label>
                                                <input
                                                    type="text"
                                                    placeholder="Maharashtra"
                                                    {...register("state")}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                                {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Pincode</label>
                                                <input
                                                    type="text"
                                                    placeholder="400001"
                                                    {...register("pincode")}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                                {errors.pincode && <p className="text-xs text-red-500">{errors.pincode.message}</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="mt-12 flex justify-between gap-4">
                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                                    currentStep === 0
                                        ? "text-slate-300 cursor-not-allowed"
                                        : "text-slate-600 hover:bg-slate-50 active:scale-95"
                                }`}
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Back
                            </button>

                            {currentStep === steps.length - 1 ? (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-10 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Saving..." : "Complete Profile"}
                                    {!isSubmitting && <CheckCircle2 className="w-5 h-5" />}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex items-center gap-2 px-10 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
                                >
                                    Next Step
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </form>
                </motion.div>
                
                {/* Security Footer */}
                <div className="mt-8 flex items-center justify-center gap-6 text-slate-400 text-sm">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        SSL Encrypted
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Safe & Secure
                    </div>
                </div>
            </div>
        </div>
    )
}

