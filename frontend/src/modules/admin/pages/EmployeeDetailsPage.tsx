
import { Mail, Phone, MapPin, Calendar, Target, TrendingUp, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function EmployeeDetailsPage() {
  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Employee Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="size-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-3xl mb-4">
              AK
            </div>
            <h2 className="text-xl font-bold text-slate-900">Amit Kumar</h2>
            <p className="text-sm text-slate-500 mb-2">Senior Sales Executive</p>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-700">
              Active
            </span>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Mail className="size-4 text-slate-400" />
              amit.k@PayVit.com
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Phone className="size-4 text-slate-400" />
              +91 98765 43210
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <MapPin className="size-4 text-slate-400" />
              Mumbai, Maharashtra
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Calendar className="size-4 text-slate-400" />
              Joined Jan 15, 2024
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Target className="size-4" />
                </div>
                <p className="text-sm font-medium text-slate-500">Total Leads</p>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">145</h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="size-4" />
                </div>
                <p className="text-sm font-medium text-slate-500">Conversions</p>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">41</h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <TrendingUp className="size-4" />
                </div>
                <p className="text-sm font-medium text-slate-500">Success Rate</p>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">28.2%</h3>
            </div>
          </div>

          {/* Assigned Leads Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Assigned Leads</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">Rahul Sharma</div>
                      <div className="text-xs text-slate-500">+91 98765 43210</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">Personal Loan</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">In Progress</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">Oct 24, 2024</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">Priya Singh</div>
                      <div className="text-xs text-slate-500">+91 91234 56789</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">Credit Card</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">Converted</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">Oct 22, 2024</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">Vikram Patel</div>
                      <div className="text-xs text-slate-500">+91 99887 76655</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">Business Loan</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-700">Rejected</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">Oct 20, 2024</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

