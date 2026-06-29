import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  CreditCard, 
  Landmark, 
  CheckCircle2, 
  XCircle, 
  Heart,
  MapPin,
  FileText,
  DollarSign,
  Loader2,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { getUserByIdRequest } from "../../../api/user.api";
import { getLeadsRequest } from "../../../api/lead.api";
import { getLoans } from "../../../api/loan.api";
import { getCards } from "../../../api/card.api";
import { toast } from "react-hot-toast";

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [favProducts, setFavProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCustomerData();
    }
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch user profile
      const userRes = await getUserByIdRequest(id!);
      if (!userRes.success || !userRes.data) {
        throw new Error("Failed to load user profile");
      }
      const customerData = userRes.data;
      setCustomer(customerData);

      // 2. Fetch leads related to this customer
      const leadsRes = await getLeadsRequest({ customerId: id });
      if (leadsRes.success) {
        setLeads(leadsRes.data.data || []);
      }

      // 3. Fetch cards and loans to resolve favoriteOffers details
      if (customerData.favoriteOffers && customerData.favoriteOffers.length > 0) {
        const [loansRes, cardsRes] = await Promise.all([
          getLoans({ limit: 100 } as any),
          getCards({ limit: 100 } as any)
        ]);
        
        const allLoans = loansRes.data?.data || (Array.isArray(loansRes.data) ? loansRes.data : []);
        const allCards = cardsRes.data?.data || (Array.isArray(cardsRes.data) ? cardsRes.data : []);

        const resolvedFavs: any[] = [];
        customerData.favoriteOffers.forEach((favId: string) => {
          const matchLoan = allLoans.find((l: any) => l.loanId === favId || l._id === favId);
          if (matchLoan) {
            resolvedFavs.push({ ...matchLoan, itemType: "loan" });
            return;
          }
          const matchCard = allCards.find((c: any) => c.cardId === favId || c._id === favId);
          if (matchCard) {
            resolvedFavs.push({ ...matchCard, itemType: "card" });
          }
        });
        setFavProducts(resolvedFavs);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load customer profile details");
      navigate("/admin/customers");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Customer Details...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="size-10 text-rose-500" />
        <p className="text-sm font-bold text-slate-700">Customer not found</p>
        <Link to="/admin/customers" className="text-xs font-bold text-blue-600 underline">Return to Customers List</Link>
      </div>
    );
  }

  // Get status color styling
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-blue-50 text-blue-700 border-blue-100",
      assigned: "bg-indigo-50 text-indigo-700 border-indigo-100",
      contacted: "bg-amber-50 text-amber-700 border-amber-100",
      interested: "bg-cyan-50 text-cyan-700 border-cyan-100",
      callback: "bg-purple-50 text-purple-700 border-purple-100",
      "in-progress": "bg-sky-50 text-sky-700 border-sky-100",
      converted: "bg-emerald-50 text-emerald-700 border-emerald-100",
      rejected: "bg-rose-50 text-rose-700 border-rose-100",
    };
    return styles[status] || "bg-slate-50 text-slate-700 border-slate-100";
  };

  return (
    <div className="space-y-6">
      {/* Navigation Headers */}
      <div className="flex items-center gap-4">
        <Link 
          to="/admin/customers"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Profile</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Full profile registry and product attachments</p>
        </div>
      </div>

      {/* Main Banner Block */}
      <div className="bg-[#0E1320] text-white p-6 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-10 pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="size-14 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl uppercase shadow-md">
            {customer.name ? customer.name[0] : "C"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">{customer.name || "N/A"}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><Mail className="size-3.5" />{customer.email}</p>
          </div>
        </div>
        <div className="flex gap-3 relative z-10">
          {customer.isProfileComplete ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 uppercase tracking-wide">
              <CheckCircle2 className="size-3.5" /> Fully Detailed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-450 border border-amber-500/20 uppercase tracking-wide">
              <XCircle className="size-3.5" /> Partial Profile
            </span>
          )}
        </div>
      </div>

      {/* Bottom Layout Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Personal and Details Profile */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-50">
              <User className="size-4.5 text-blue-500" /> Identity Information
            </h3>
            
            <div className="space-y-4 text-xs font-semibold">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Full Legal Name</p>
                <p className="text-slate-800">{customer.name || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Phone Number</p>
                <p className="text-slate-850 flex items-center gap-1.5"><Phone className="size-3.5 text-slate-400" />{customer.phone || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Date of Birth</p>
                <p className="text-slate-800 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-slate-400" />
                  {customer.dob ? new Date(customer.dob).toLocaleDateString() : "-"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Gender</p>
                <p className="text-slate-800 capitalize">{customer.gender || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Occupation</p>
                <p className="text-slate-800">{customer.occupation || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Annual Income</p>
                <p className="text-slate-800 flex items-center gap-1">
                  <DollarSign className="size-3.5 text-slate-400" />
                  {customer.annualIncome ? `${customer.annualIncome.toLocaleString()}` : "-"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">PAN Number</p>
                  <p className="text-slate-800 font-mono tracking-wider">{customer.panNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Aadhaar Card</p>
                  <p className="text-slate-800 font-mono tracking-wider">{customer.aadhaarNumber || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-50 mb-4">
              <MapPin className="size-4.5 text-blue-500" /> Addresses
            </h3>
            {customer.addresses && customer.addresses.length > 0 ? (
              <div className="space-y-4">
                {customer.addresses.map((addr: any, index: number) => (
                  <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs relative overflow-hidden">
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-600 uppercase border border-blue-100">
                      {addr.type || "current"}
                    </span>
                    <p className="font-semibold text-slate-800 mt-1">{addr.street || ""}</p>
                    <p className="text-slate-500 font-medium mt-1">{addr.city || ""}, {addr.state || ""} - {addr.pincode || ""}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-400 text-center py-4">No address records attached</p>
            )}
          </div>
        </div>

        {/* Right Column: Portfolio & Converted Leads & Favorites */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Portfolio Attachments / Converted Leads */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-50 mb-4">
              <FileText className="size-4.5 text-blue-500" /> Connected Portfolios
            </h3>

            {leads.length > 0 ? (
              <div className="space-y-3">
                {leads.map((lead: any) => (
                  <div key={lead.leadId} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                        {lead.productType === "loan" ? (
                          <Landmark className="size-5 text-emerald-600" />
                        ) : (
                          <CreditCard className="size-5 text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 capitalize">{lead.productName || lead.loanType || "Fintech Product"}</h4>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{lead.productType} Lead</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getStatusBadge(lead.status)}`}>
                        {lead.status}
                      </span>
                      <Link 
                        to={`/admin/leads/${lead.leadId}`}
                        className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <ChevronRight className="size-4.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-xs font-semibold text-slate-400">No active products or loan applications</p>
              </div>
            )}
          </div>

          {/* Section 2: Favorites / Liked Offers */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-50 mb-4">
              <Heart className="size-4.5 text-rose-500 fill-rose-500/10" /> Favorite Assets
            </h3>

            {favProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favProducts.map((prod: any) => (
                  <div key={prod._id || prod.loanId || prod.cardId} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col justify-between gap-3 relative overflow-hidden group">
                    <div className="flex justify-between items-start gap-2.5">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-950 truncate">{prod.loanName || prod.cardName || prod.name}</h4>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{prod.bankName || prod.bank || "Partner"}</p>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${prod.itemType === "loan" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"}`}>
                        {prod.itemType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 border-t border-slate-100/50 pt-2">
                      <span>
                        {prod.itemType === "loan" ? (
                          <>Rate: <span className="text-slate-900">{prod.interestRate?.min || prod.interestRate || "-"}%</span></>
                        ) : (
                          <>Fee: <span className="text-slate-900">₹{prod.fees?.annualFee || "0"}</span></>
                        )}
                      </span>
                      <Link 
                        to={prod.itemType === "loan" ? `/loan/${prod.loanId || prod._id}` : `/card/${prod.cardId || prod._id}`}
                        className="text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        View Product <ChevronRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-xs font-semibold text-slate-400">No favorite cards or loans tagged yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
