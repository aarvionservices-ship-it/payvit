import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Briefcase, 
  FileText, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  Upload,
  Loader2,
  Building,
  MapPin,
  Calendar,
  CreditCard,
  Banknote
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useAuthStore } from '../../../store/auth.store';
import { getLoanById } from '../../../api/loan.api';
import { createLeadRequest } from '../../../api/lead.api';
import type { LoanModel } from '../../../types';

const STEPS = [
  { id: 'personal', label: 'Personal Details', icon: User },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'review', label: 'Review', icon: CheckCircle },
];

export default function ApplyLoanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loan, setLoan] = useState<LoanModel | null>(null);
  const [loadingLoan, setLoadingLoan] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    // Personal
    fullName: user?.name || '',
    phone: (user as any)?.phone || '',
    email: user?.email || '',
    dob: '',
    address: '',
    city: '',
    
    // Employment
    employmentType: 'Salaried',
    companyName: '',
    monthlyIncome: '',
    workExperience: '',
    
    // Documents
    aadhaarFile: null as File | null,
    panFile: null as File | null,
    bankStatementFile: null as File | null,
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchLoan() {
      if (!id) return;
      try {
        const res = await getLoanById(id);
        if (res.success && res.data && isMounted) {
          setLoan(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoadingLoan(false);
      }
    }
    fetchLoan();
    return () => { isMounted = false; };
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (name === "phone") {
      value = value.replace(/[^0-9]/g, '').slice(0, 10);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, [fieldName]: e.target.files![0] }));
    }
  };

  const nextStep = () => {
    // Basic validation
    if (currentStep === 0) {
      if (!formData.fullName || !formData.phone || !formData.email) {
        toast.error('Please fill all required personal details');
        return;
      }
      if (!/^[0-9]{10}$/.test(formData.phone)) {
        toast.error('Phone number must be exactly 10 digits and contain only numbers');
        return;
      }
    } else if (currentStep === 1) {
      if (!formData.companyName || !formData.monthlyIncome) {
        toast.error('Please fill required employment details');
        return;
      }
    } else if (currentStep === 2) {
      // Mock validation for files
      if (!formData.aadhaarFile) {
        toast.error('Please upload required documents (Aadhaar Card)');
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      };

      const documents = [];
      if (formData.aadhaarFile) {
        documents.push({
          name: formData.aadhaarFile.name,
          url: await fileToBase64(formData.aadhaarFile),
          documentType: 'aadhaar'
        });
      }
      if (formData.panFile) {
        documents.push({
          name: formData.panFile.name,
          url: await fileToBase64(formData.panFile),
          documentType: 'pan'
        });
      }
      if (formData.bankStatementFile) {
        documents.push({
          name: formData.bankStatementFile.name,
          url: await fileToBase64(formData.bankStatementFile),
          documentType: 'bank_statement'
        });
      }

      const payload = {
        productId: id,
        productType: 'loan',
        customerName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        loanType: 'personal', 
        source: 'direct',
        documents
      };

      const response = await createLeadRequest(payload);
      
      if (response && response.success !== false) {
        toast.success('Loan application submitted successfully!');
        navigate('/customer/applications');
      } else {
         toast.error(response.message || 'Failed to submit application');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingLoan) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="size-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Loan details not found.
      </div>
    );
  }

  const StepIcon = STEPS[currentStep].icon;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={`/customer/offers/${id}`} className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Apply for Loan</h1>
            <p className="text-sm font-medium text-slate-500">{loan.bankName} - {loan.loanName}</p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hidden md:block">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
                 style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
               />
            </div>
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                  <div className={`size-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                    isActive ? 'border-blue-100 bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 
                    isCompleted ? 'border-emerald-100 bg-emerald-500 text-white' : 
                    'border-slate-50 bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle className="size-5" /> : <Icon className="size-5" />}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Progress */}
        <div className="md:hidden flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-3">
             <div className="size-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
               <StepIcon className="size-5" />
             </div>
             <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {currentStep + 1} of {STEPS.length}</p>
               <h3 className="text-sm font-bold text-slate-900">{STEPS[currentStep].label}</h3>
             </div>
           </div>
           <div className="text-blue-600 font-black text-lg">
             {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
           </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
          <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step 1: Personal Details */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                       <User className="size-5 text-blue-500" /> Personal Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                          <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900" placeholder="John Doe" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number *</label>
                        <div className="flex gap-2">
                          <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-medium focus:outline-none cursor-pointer">
                            <option value="+91">+91 (IN)</option>
                            <option value="+1">+1 (US)</option>
                            <option value="+44">+44 (UK)</option>
                            <option value="+971">+971 (AE)</option>
                          </select>
                          <div className="relative flex-1">
                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900" placeholder="9876543210" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address *</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900" placeholder="john@example.com" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Birth</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                          <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900" />
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-4 size-4 text-slate-400" />
                          <textarea name="address" value={formData.address} onChange={handleInputChange} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900" placeholder="Enter your full residential address" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">City</label>
                        <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900" placeholder="Mumbai" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Employment Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                       <Briefcase className="size-5 text-indigo-500" /> Employment Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employment Type *</label>
                        <select name="employmentType" value={formData.employmentType} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-900 appearance-none">
                          <option value="Salaried">Salaried</option>
                          <option value="Self-Employed">Self-Employed</option>
                          <option value="Business Owner">Business Owner</option>
                          <option value="Professional">Professional</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company/Business Name *</label>
                        <div className="relative">
                           <Building className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                           <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-900" placeholder="TCS / Your Business" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Net Income *</label>
                        <div className="relative">
                           <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                           <input type="number" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-900" placeholder="50000" />
                           <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">INR</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Work Experience (Years)</label>
                        <input type="number" name="workExperience" value={formData.workExperience} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-900" placeholder="e.g. 5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Document Uploads */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-2">
                       <FileText className="size-5 text-amber-500" /> Upload Documents
                    </h2>
                    <p className="text-sm font-medium text-slate-500 mb-6 pb-4 border-b border-slate-100">Please provide clear copies of the following documents to speed up your verification process.</p>
                    
                    <div className="space-y-4">
                       {/* Aadhaar */}
                       <div className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between bg-slate-50 group hover:border-amber-200 transition-all">
                         <div className="flex items-center gap-4">
                           <div className="size-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-amber-500">
                             <CreditCard className="size-5" />
                           </div>
                           <div>
                             <h4 className="text-sm font-bold text-slate-900">Aadhaar Card *</h4>
                             <p className="text-xs font-medium text-slate-500">{formData.aadhaarFile ? formData.aadhaarFile.name : 'Front & Back side properly visible'}</p>
                           </div>
                         </div>
                         <div>
                           <label className="cursor-pointer px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-all shadow-sm flex items-center gap-2">
                             <Upload className="size-4" /> {formData.aadhaarFile ? 'Change' : 'Upload'}
                             <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'aadhaarFile')} />
                           </label>
                         </div>
                       </div>

                       {/* PAN */}
                       <div className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between bg-slate-50 group hover:border-amber-200 transition-all">
                         <div className="flex items-center gap-4">
                           <div className="size-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-amber-500">
                             <FileText className="size-5" />
                           </div>
                           <div>
                             <h4 className="text-sm font-bold text-slate-900">PAN Card</h4>
                             <p className="text-xs font-medium text-slate-500">{formData.panFile ? formData.panFile.name : 'Clear photo of PAN card'}</p>
                           </div>
                         </div>
                         <div>
                           <label className="cursor-pointer px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-all shadow-sm flex items-center gap-2">
                             <Upload className="size-4" /> {formData.panFile ? 'Change' : 'Upload'}
                             <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'panFile')} />
                           </label>
                         </div>
                       </div>

                       {/* Bank Statement */}
                       <div className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between bg-slate-50 group hover:border-amber-200 transition-all">
                         <div className="flex items-center gap-4">
                           <div className="size-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-amber-500">
                             <Building className="size-5" />
                           </div>
                           <div>
                             <h4 className="text-sm font-bold text-slate-900">Bank Statement (Last 6 Months)</h4>
                             <p className="text-xs font-medium text-slate-500">{formData.bankStatementFile ? formData.bankStatementFile.name : 'PDF format preferred'}</p>
                           </div>
                         </div>
                         <div>
                           <label className="cursor-pointer px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-all shadow-sm flex items-center gap-2">
                             <Upload className="size-4" /> {formData.bankStatementFile ? 'Change' : 'Upload'}
                             <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileChange(e, 'bankStatementFile')} />
                           </label>
                         </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                       <div className="size-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                         <CheckCircle className="size-8" />
                       </div>
                       <h2 className="text-2xl font-extrabold text-slate-900">Review Application</h2>
                       <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto mt-2">Please double check your details before submitting to ensure a smooth approval process.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><User className="size-3.5" /> Personal</h3>
                         <dl className="space-y-2">
                           <div className="flex justify-between"><dt className="text-sm font-medium text-slate-500">Name:</dt><dd className="text-sm font-bold text-slate-900">{formData.fullName}</dd></div>
                           <div className="flex justify-between"><dt className="text-sm font-medium text-slate-500">Phone:</dt><dd className="text-sm font-bold text-slate-900">+91 {formData.phone}</dd></div>
                           <div className="flex justify-between"><dt className="text-sm font-medium text-slate-500">Email:</dt><dd className="text-sm font-bold text-slate-900">{formData.email}</dd></div>
                           <div className="flex justify-between"><dt className="text-sm font-medium text-slate-500">City:</dt><dd className="text-sm font-bold text-slate-900">{formData.city || '-'}</dd></div>
                         </dl>
                       </div>

                       <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50">
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Briefcase className="size-3.5" /> Employment</h3>
                         <dl className="space-y-2">
                           <div className="flex justify-between"><dt className="text-sm font-medium text-slate-500">Type:</dt><dd className="text-sm font-bold text-slate-900">{formData.employmentType}</dd></div>
                           <div className="flex justify-between"><dt className="text-sm font-medium text-slate-500">Company:</dt><dd className="text-sm font-bold text-slate-900">{formData.companyName}</dd></div>
                           <div className="flex justify-between"><dt className="text-sm font-medium text-slate-500">Income:</dt><dd className="text-sm font-bold text-emerald-600">₹{formData.monthlyIncome}/mo</dd></div>
                           <div className="flex justify-between"><dt className="text-sm font-medium text-slate-500">Experience:</dt><dd className="text-sm font-bold text-slate-900">{formData.workExperience ? `${formData.workExperience} years` : '-'}</dd></div>
                         </dl>
                       </div>

                       <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50 md:col-span-2">
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><FileText className="size-3.5" /> Documents</h3>
                         <div className="flex flex-wrap gap-3">
                           {formData.aadhaarFile && <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-sm"><CheckCircle className="size-3.5 text-emerald-500" /> Aadhaar Attached</span>}
                           {formData.panFile && <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-sm"><CheckCircle className="size-3.5 text-emerald-500" /> PAN Attached</span>}
                           {formData.bankStatementFile && <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-sm"><CheckCircle className="size-3.5 text-emerald-500" /> Statement Attached</span>}
                         </div>
                       </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Form Actions Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
             <button 
               onClick={prevStep}
               disabled={currentStep === 0 || submitting}
               className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-0 disabled:invisible text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 shadow-sm"
             >
               <ChevronLeft className="size-4" /> Back
             </button>

             {currentStep < STEPS.length - 1 ? (
               <button 
                 onClick={nextStep}
                 className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 ml-auto"
               >
                 Next Step <ChevronRight className="size-4" />
               </button>
             ) : (
               <button 
                 onClick={handleSubmit}
                 disabled={submitting}
                 className="px-8 py-3 rounded-xl font-extrabold text-sm flex items-center gap-2 transition-all text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 ml-auto disabled:opacity-70"
               >
                 {submitting ? <><Loader2 className="size-4 animate-spin" /> Submitting...</> : <><CheckCircle className="size-4" /> Submit Application</>}
               </button>
             )}
          </div>
        </div>

      </main>
    </div>
  );
}

