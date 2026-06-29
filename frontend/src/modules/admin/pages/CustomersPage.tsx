import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  UserCheck, 
  ChevronRight, 
  Phone, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  Loader2,
  AlertCircle
} from "lucide-react";
import { getUsersRequest } from "../../../api/user.api";
import { toast } from "react-hot-toast";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery, page]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await getUsersRequest({
        role: "customer",
        search: searchQuery || undefined,
        page,
        limit
      });
      if (res.success) {
        setCustomers(res.data.data || []);
        setTotalPages(Math.ceil((res.data.total || 0) / limit) || 1);
      }
    } catch (err) {
      toast.error("Failed to load customers list");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <UserCheck className="size-6 text-blue-600" /> Customers
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Monitor customer user accounts, registration completeness, and portfolio attachments.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading && customers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-blue-600" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="size-10 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No Customers Found</p>
            <p className="text-xs text-slate-400 max-w-xs">No registered customer users matched your filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Profile Quality</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {customers.map((cust) => (
                  <tr key={cust.userId} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-900/10 text-blue-650 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm uppercase">
                          {cust.name ? cust.name[0] : "C"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 group-hover:text-blue-650 transition-colors truncate">{cust.name || "N/A"}</p>
                          <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5"><Mail className="size-3 shrink-0" />{cust.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <span className="flex items-center gap-1.5"><Phone className="size-3.5 text-slate-400" />{cust.phone || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      {cust.isProfileComplete ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                          <CheckCircle2 className="size-3" /> Fully Detailed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide">
                          <XCircle className="size-3" /> Partial Profile
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">
                      <span className="flex items-center gap-1.5"><Calendar className="size-3.5 text-slate-400" />{new Date(cust.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/customers/${cust.userId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-200 hover:border-blue-600 rounded-lg font-semibold transition-all shadow-sm cursor-pointer"
                      >
                        Details <ChevronRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/20 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-450">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-55 transition-all cursor-pointer disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-55 transition-all cursor-pointer disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
