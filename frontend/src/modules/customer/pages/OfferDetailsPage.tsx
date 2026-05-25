import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Heart, Percent, Banknote, Calendar, CreditCard, FileText, Info, MapPin, User, Briefcase, FileImage, Loader2 } from 'lucide-react';
import { getLoanById } from '../../../api/loan.api';
import type { LoanModel } from '../../../types';

export default function OfferDetailsPage() {
  const { id } = useParams();
  const [loan, setLoan] = useState<LoanModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLoan() {
      if (!id) return;
      try {
        const response = await getLoanById(id);
        if (response.success) {
          setLoan(response.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLoan();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="size-8 animate-spin text-blue-500" /></div>;
  }

  if (!loan) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-500 font-bold">Offer not found.</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <Link to="/customer/offers" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors group">
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" /> Back to Offers
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden relative">
          {/* Decorative Top Gradient */}
          <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${loan.gradient || 'from-blue-500 via-indigo-500 to-purple-500'}`}></div>

          {/* Header */}
          <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="flex items-center gap-6 relative z-10">
              <div className={`size-16 rounded-2xl bg-gradient-to-br ${loan.gradient || 'from-blue-500 to-indigo-600'} flex items-center justify-center text-white font-bold text-2xl shadow-lg shrink-0 transform transition-transform hover:scale-105`}>
                {loan.bankName?.charAt(0).toUpperCase() || 'L'}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-tight">{loan.loanName}</h1>
                </div>
                <p className="text-slate-500 font-medium flex items-center gap-2">
                  <Banknote className="size-4 text-slate-400" /> {loan.bankName}
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] uppercase font-bold tracking-widest text-slate-500">{loan.category}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
              <button className="w-full sm:w-auto px-6 py-3.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center gap-2 group shadow-sm">
                <Heart className="size-4 group-hover:fill-rose-500 group-hover:text-rose-500 transition-colors" /> Add to Favorites
              </button>
              <Link to={`/customer/apply/${loan._id}`} className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all hover:-translate-y-0.5 flex items-center justify-center">
                Apply Now
              </Link>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
            <div className="p-6 text-center group hover:bg-white transition-colors">
              <div className="inline-flex items-center justify-center size-10 rounded-full bg-blue-100 text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                <Percent className="size-5" />
              </div>
              <p className="text-sm text-slate-500 mb-1 font-medium">Interest Rate</p>
              <p className="text-xl font-bold text-slate-900">{loan.interestRate?.min || 'Varies'}% p.a.</p>
            </div>
            <div className="p-6 text-center group hover:bg-white transition-colors">
              <div className="inline-flex items-center justify-center size-10 rounded-full bg-indigo-100 text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                <CreditCard className="size-5" />
              </div>
              <p className="text-sm text-slate-500 mb-1 font-medium">Processing Fee</p>
              <p className="text-xl font-bold text-slate-900">Up to {loan.feesAndCharges?.processingFee?.percentage || 0}%</p>
            </div>
            <div className="p-6 text-center group hover:bg-white transition-colors">
              <div className="inline-flex items-center justify-center size-10 rounded-full bg-emerald-100 text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
                <Banknote className="size-5" />
              </div>
              <p className="text-sm text-slate-500 mb-1 font-medium">Max Amount</p>
              <p className="text-xl font-bold text-slate-900">₹{(loan.loanAmount?.max / 100000).toFixed(1)} Lakhs</p>
            </div>
            <div className="p-6 text-center group hover:bg-white transition-colors">
              <div className="inline-flex items-center justify-center size-10 rounded-full bg-purple-100 text-purple-600 mb-3 group-hover:scale-110 transition-transform">
                <Calendar className="size-5" />
              </div>
              <p className="text-sm text-slate-500 mb-1 font-medium">Tenure</p>
              <p className="text-xl font-bold text-slate-900">{loan.tenure?.minMonths} - {loan.tenure?.maxMonths} Mos</p>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 space-y-10">
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Info className="size-5 text-blue-500" /> Description
              </h2>
              <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100/50">
                <p className="text-slate-600 leading-relaxed">
                  {loan.features?.[0] || `Get a ${loan.loanName} from ${loan.bankName} to meet your diverse financial needs.`}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-500" /> Eligibility Criteria
              </h2>
              <ul className="grid sm:grid-cols-2 gap-4">
                <li className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-emerald-200 transition-colors group">
                  <div className="bg-emerald-100 rounded-full p-2 mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                    <MapPin className="size-4 text-emerald-600" />
                  </div>
                  <span className="text-slate-700 font-medium mt-1">Must be an {loan.eligibility?.residency || 'Indian Resident'}.</span>
                </li>
                <li className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-emerald-200 transition-colors group">
                  <div className="bg-emerald-100 rounded-full p-2 mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                    <User className="size-4 text-emerald-600" />
                  </div>
                  <span className="text-slate-700 font-medium mt-1">Age should be between {loan.eligibility?.age?.min || 21} and {loan.eligibility?.age?.max || 60} years.</span>
                </li>
                <li className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-emerald-200 transition-colors group">
                  <div className="bg-emerald-100 rounded-full p-2 mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                    <Banknote className="size-4 text-emerald-600" />
                  </div>
                  <span className="text-slate-700 font-medium mt-1">Minimum net monthly income of ₹{loan.eligibility?.minimumIncomeMonthly?.salaried?.toLocaleString() || '25,000'}.</span>
                </li>
                <li className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-emerald-200 transition-colors group">
                  <div className="bg-emerald-100 rounded-full p-2 mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                    <Briefcase className="size-4 text-emerald-600" />
                  </div>
                  <span className="text-slate-700 font-medium mt-1">Credit Score of {loan.eligibility?.creditScore?.minimum || 700}+ required.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="size-5 text-indigo-500" /> Documents Required
              </h2>
              <ul className="grid sm:grid-cols-2 gap-4">
                {(loan.documentsRequired?.identityProof || ['Aadhaar', 'PAN']).map((doc: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50 hover:border-indigo-200 transition-colors group">
                    <div className="bg-indigo-100 rounded-full p-2 mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                        <FileImage className="size-4 text-indigo-600" />
                    </div>
                    <span className="text-slate-700 font-medium mt-1">{doc}</span>
                    </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

