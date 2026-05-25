import { useState, useEffect } from 'react';
import { Landmark, Percent, FileText, CheckCircle2, Heart, Star, ArrowRight, Banknote, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLoans } from '../../../api/loan.api';
import { getLeadsRequest } from '../../../api/lead.api';
import { useAuthStore } from '../../../store/auth.store';
import type { LoanModel } from '../../../types';

export default function CustomerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [recommendedLoans, setRecommendedLoans] = useState<LoanModel[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [loansRes, leadsRes] = await Promise.all([
          getLoans(),
          getLeadsRequest()
        ]);
        
        if (loansRes.success) {
          const loansData = loansRes.data?.data || (Array.isArray(loansRes.data) ? loansRes.data : []);
          setRecommendedLoans(loansData.slice(0, 3));
        }
        if (leadsRes.success) {
          const leadsData = leadsRes.data?.data || (Array.isArray(leadsRes.data) ? leadsRes.data : []);
          setApplications(leadsData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = {
    submitted: Array.isArray(applications) ? applications.length : 0,
    approved: Array.isArray(applications) ? applications.filter(a => ['approved', 'converted'].includes(a.status?.toLowerCase())).length : 0,
    favorites: user?.favoriteOffers?.length || 0
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-4">
          <div className="size-12 lg:size-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20 text-lg lg:text-xl font-bold uppercase">
            {user?.name?.[0] || 'U'}
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 leading-tight">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-[10px] lg:text-xs text-slate-500 font-medium uppercase tracking-wider">Financial Overview</p>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Link to="/customer/applications" className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileText className="size-16 lg:size-24 text-blue-600" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="size-10 lg:size-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
              <FileText className="size-5 lg:size-7" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] lg:text-xs font-bold uppercase tracking-wider">Submitted</p>
              <h3 className="text-2xl lg:text-3xl font-black mt-0.5 text-slate-900">{stats.submitted}</h3>
            </div>
          </div>
        </Link>

        <Link to="/customer/applications" className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle2 className="size-16 lg:size-24 text-emerald-600" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="size-10 lg:size-14 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="size-5 lg:size-7" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] lg:text-xs font-bold uppercase tracking-wider">Approved</p>
              <h3 className="text-2xl lg:text-3xl font-black mt-0.5 text-slate-900">{stats.approved}</h3>
            </div>
          </div>
        </Link>

        <Link to="/customer/favorites" className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Heart className="size-16 lg:size-24 text-rose-600" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="size-10 lg:size-14 bg-gradient-to-br from-rose-400 to-pink-500 text-white rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/30">
              <Heart className="size-5 lg:size-7" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] lg:text-xs font-bold uppercase tracking-wider">Favorites</p>
              <h3 className="text-2xl lg:text-3xl font-black mt-0.5 text-slate-900">{stats.favorites}</h3>
            </div>
          </div>
        </Link>
      </div>

      {/* Recommended Offers */}
      <section className="space-y-4 lg:space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Star className="size-5 fill-amber-500" />
            </div>
            <h2 className="text-lg lg:text-xl font-extrabold text-slate-900">Recommended</h2>
          </div>
          <Link to="/customer/offers" className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors flex items-center gap-2">
            View All <ArrowRight className="size-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12 text-blue-500">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : recommendedLoans.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <p className="text-slate-500 font-bold">No recommendations currently available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {recommendedLoans.map((loan, idx) => {
              const gradients = [
                'from-blue-500 to-indigo-500',
                'from-purple-500 to-pink-500',
                'from-emerald-500 to-teal-500'
              ];
              const gradient = loan.gradient || gradients[idx % gradients.length];

              return (
              <div key={loan._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col relative group">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient}`}></div>
                <div className="p-5 lg:p-6 flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="size-12 lg:size-14 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl flex items-center justify-center font-black text-slate-600 text-xs shadow-inner">
                      {loan.bankName?.substring(0, 4) || 'BANK'}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{loan.loanName}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1 truncate"><Landmark className="size-3" /> {loan.bankName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center sm:text-left">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center sm:justify-start gap-1"><Percent className="size-3" /> Interest</p>
                      <p className="font-bold text-blue-700 text-base">{loan.interestRate?.min || 'Varies'}%</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center sm:text-left">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center sm:justify-start gap-1"><Banknote className="size-3" /> Max Limit</p>
                      <p className="font-bold text-slate-900 text-base">₹{(loan.loanAmount?.max / 100000).toFixed(0)} L</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex gap-2">
                  <Link to={`/customer/offers/${loan._id}`} className="flex-1 text-center py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
                    Details
                  </Link>
                  <Link to={`/customer/apply/${loan._id}`} className="flex-1 text-center py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg transition-all shadow-md block leading-10">
                    Apply
                  </Link>
                </div>
              </div>
            )})}
          </div>
        )}
      </section>
    </div>
  );
}

