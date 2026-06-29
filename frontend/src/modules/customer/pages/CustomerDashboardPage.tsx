import { useState, useEffect } from 'react';
import { 
    Wallet, 
    FileText, 
    CheckCircle2, 
    Star, 
    ArrowRight, 
    Loader2, 
    ArrowDownLeft, 
    ArrowUpRight, 
    Send, 
    Plus 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLeadsRequest } from '../../../api/lead.api';
import { getWalletRequest } from '../../../api/wallet.api';
import { useAuthStore } from '../../../store/auth.store';

export default function CustomerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [wallet, setWallet] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [walletRes, leadsRes] = await Promise.all([
          getWalletRequest(),
          getLeadsRequest()
        ]);
        
        if (walletRes.success) {
          setWallet(walletRes.data);
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
    balance: wallet?.balance || 0
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-4">
          <div className="size-12 lg:size-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 text-lg lg:text-xl font-bold uppercase">
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
        
        {/* Wallet Balance Card */}
        <Link to="/customer/wallet" className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wallet className="size-16 lg:size-24 text-indigo-600" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="size-10 lg:size-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
              <Wallet className="size-5 lg:size-7" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] lg:text-xs font-bold uppercase tracking-wider">Wallet Balance</p>
              <h3 className="text-2xl lg:text-3xl font-black mt-0.5 text-slate-900">₹ {stats.balance.toLocaleString("en-IN")}</h3>
            </div>
          </div>
        </Link>

        {/* Submitted Apps Card */}
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileText className="size-16 lg:size-24 text-blue-600" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="size-10 lg:size-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
              <FileText className="size-5 lg:size-7" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] lg:text-xs font-bold uppercase tracking-wider">Submitted Applications</p>
              <h3 className="text-2xl lg:text-3xl font-black mt-0.5 text-slate-900">{stats.submitted}</h3>
            </div>
          </div>
        </div>

        {/* Approved Apps Card */}
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle2 className="size-16 lg:size-24 text-emerald-600" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="size-10 lg:size-14 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="size-5 lg:size-7" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] lg:text-xs font-bold uppercase tracking-wider">Approved Applications</p>
              <h3 className="text-2xl lg:text-3xl font-black mt-0.5 text-slate-900">{stats.approved}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Transactions Section */}
      <section className="space-y-4 lg:space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Star className="size-5 fill-indigo-500 text-indigo-500" />
            </div>
            <h2 className="text-lg lg:text-xl font-extrabold text-slate-900">Recent Activity</h2>
          </div>
          <Link to="/customer/wallet" className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2">
            Go to Wallet <ArrowRight className="size-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12 text-indigo-500 bg-white border border-slate-100 rounded-2xl">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : !wallet || wallet.transactions?.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 flex flex-col items-center justify-center space-y-4">
            <p className="text-slate-500 font-bold">No recent transaction history found.</p>
            <div className="flex gap-3">
              <Link to="/customer/wallet" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm">
                <Plus className="size-3.5" /> Load Wallet
              </Link>
              <Link to="/customer/wallet" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5">
                <Send className="size-3.5" /> Send Tokens
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {wallet.transactions.slice(0, 3).map((tx: any) => {
              const isCredit = tx.type === "credit";
              return (
                <div key={tx._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col relative group">
                  <div className={`absolute top-0 left-0 w-full h-1 ${isCredit ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCredit 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : "bg-rose-50 text-rose-600 border-rose-100"
                      }`}>
                        {isCredit ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isCredit ? 'Credit' : 'Debit'}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {tx.transactionType === "deposit" 
                          ? "Wallet Deposit" 
                          : isCredit 
                            ? `Received from ${tx.peerName || "User"}` 
                            : `Transferred to ${tx.peerName || "User"}`
                        }
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">
                        {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                      {tx.description && (
                        <p className="text-[10px] font-semibold text-slate-500 italic truncate mt-1">"{tx.description}"</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase text-slate-400">Amount</span>
                      <span className={`text-base font-black ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
                        {isCredit ? "+" : "-"} {tx.amount.toLocaleString("en-IN")} Tokens
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
