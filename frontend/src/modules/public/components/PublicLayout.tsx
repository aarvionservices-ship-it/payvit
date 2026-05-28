import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuthStore } from "../../../store/auth.store";
import { useCompareStore } from "../../../store/compare.store";
import logo from "../../../assets/PayvitLogo.png";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Zap,
  Calculator,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { categories } from "../../../data/mockData";

export default function PublicLayout() {
  const { user } = useAuthStore();
  const { loanIds, cardIds } = useCompareStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMobileSub, setActiveMobileSub] = useState<string | null>(null);
  const [activeNestedMobileSub, setActiveNestedMobileSub] = useState<
    string | null
  >(null);

  const getDashboardPath = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "admin":
        return "/admin/dashboard";
      case "employee":
        return "/employee/dashboard";
      case "customer":
        return "/customer";
      default:
        return "/login";
    }
  };

  const navOptions = {
    services: [
      {
        title: "Loans",
        items: [
          { label: "Personal Loan", to: "/offers?category=Personal Loans" },
          { label: "Business Loan", to: "/offers?category=Business" },
          { label: "Home Loan", to: "/offers?category=Home Loans" },
          { label: "Auto Loan", to: "/offers?category=Auto Loans" },
        ],
      },
      {
        title: "Credit Cards",
        items: categories.map((cat) => ({
          label: `${cat.name} Cards`,
          to: `/cards/${cat.id}`,
        })),
      },
      { label: "Insurance", to: "/offers" },
      { label: "Investments", to: "/offers" },
      {
        title: "Calculators",
        items: [
          { label: "EMI Calculator", to: "/calculators/emi" },
          { label: "SIP Calculator", to: "/calculators/sip" },
          { label: "Credit Card Interest", to: "/calculators/credit-card" },
          { label: "Loan Eligibility", to: "/calculators/loan-eligibility" },
        ],
      },
    ],
    company: [
      { label: "About Company", to: "/about" },
      { label: "Company Policy", to: "/policy" },
      { label: "Blogs", to: "/blog" },
      { label: "Careers", to: "/careers" },
    ],
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display max-w-full">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full h-16 lg:h-20 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-background-dark/95 backdrop-blur-md px-4 lg:px-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu - Only Mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors active:scale-95"
          >
            <Menu className="size-6" />
          </button>

          <Link to="/" className="flex items-center shrink-0">
            <img
              src={logo}
              alt="PayVit Logo"
              className="h-25 lg:h-27 w-auto object-contain"
            />
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-8">
          {/* Services & Payments Dropdown */}
          <div className="relative group py-2">
            <button className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors cursor-pointer group-hover:text-primary">
              Services & Payments
              <ChevronDown className="size-4 opacity-50 group-hover:rotate-180 transition-transform duration-300" />
            </button>

            {/* Main Dropdown */}
            <div className="absolute top-full left-0 w-64 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 overflow-visible">
                {/* Loans Nested Dropdown */}
                <div className="relative group/sub">
                  <button className="flex items-center justify-between w-full px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary rounded-xl transition-all">
                    Loans
                    <ChevronRight className="size-4 opacity-50" />
                  </button>
                  {/* Side Dropdown */}
                  <div className="absolute top-0 left-full pl-2 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-300 min-w-[200px]">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2">
                      <Link
                        to="/offers?category=Personal Loans"
                        className="block px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                      >
                        Personal Loan
                      </Link>
                      <Link
                        to="/offers?category=Business"
                        className="block px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                      >
                        Business Loan
                      </Link>
                      <Link
                        to="/offers?category=Home Loans"
                        className="block px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                      >
                        Home Loan
                      </Link>
                      <Link
                        to="/offers?category=Auto Loans"
                        className="block px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                      >
                        Auto Loan
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Credit Cards Nested Dropdown */}
                <div className="relative group/sub">
                  <Link
                    to="/cards"
                    className="flex items-center justify-between w-full px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary rounded-xl transition-all"
                  >
                    Credit Cards
                    <ChevronRight className="size-4 opacity-50" />
                  </Link>
                  {/* Side Mega Dropdown */}
                  <div className="absolute top-0 left-full pl-3 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-300 w-[550px] pointer-events-none group-hover/sub:pointer-events-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 flex gap-8">
                      {/* Left: All Categories */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-6 px-2">
                          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <CreditCard className="size-4" />
                          </div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            All Categories
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {categories.map((cat) => (
                            <Link
                              key={cat.id}
                              to={`/cards/${cat.id}`}
                              className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all group/item"
                            >
                              <span
                                className={`material-symbols-outlined text-lg ${cat.color} opacity-70 group-hover/item:opacity-100 transition-opacity`}
                              >
                                {cat.icon}
                              </span>
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Right: 3 Special Options */}
                      <div className="w-[180px] flex flex-col gap-3 border-l border-slate-100 dark:border-white/5 pl-8">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                          Top Features
                        </h4>

                        <Link
                          to="/cards?filter=rewards"
                          className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 group/opt transition-all hover:scale-[1.02]"
                        >
                          <Sparkles className="size-5 text-amber-600 mb-2 group-hover/opt:scale-110 transition-transform" />
                          <div className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-tight">
                            Best Rewards
                          </div>
                          <div className="text-[9px] text-amber-600/70 mt-0.5">
                            Max benefits
                          </div>
                        </Link>

                        <Link
                          to="/cards?filter=nofee"
                          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 group/opt transition-all hover:scale-[1.02]"
                        >
                          <ShieldCheck className="size-5 text-emerald-600 mb-2 group-hover/opt:scale-110 transition-transform" />
                          <div className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tight">
                            Zero Annual Fee
                          </div>
                          <div className="text-[9px] text-emerald-600/70 mt-0.5">
                            Lifetime free
                          </div>
                        </Link>

                        <Link
                          to="/cards/premium"
                          className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 group/opt transition-all hover:scale-[1.02]"
                        >
                          <Zap className="size-5 text-indigo-600 mb-2 group-hover/opt:scale-110 transition-transform" />
                          <div className="text-[10px] font-black text-indigo-800 dark:text-indigo-400 uppercase tracking-tight">
                            Premium Elite
                          </div>
                          <div className="text-[9px] text-indigo-600/70 mt-0.5">
                            Exclusive perks
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  to="/offers"
                  className="block px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary rounded-xl transition-all"
                >
                  Insurance
                </Link>
                <Link
                  to="/offers"
                  className="block px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary rounded-xl transition-all"
                >
                  Investments
                </Link>
              </div>
            </div>
          </div>

          {/* Recharge & Bills Dropdown */}
          <div className="relative group py-2">
            <button className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors cursor-pointer group-hover:text-primary">
              Recharge & Bills
              <ChevronDown className="size-4 opacity-50 group-hover:rotate-180 transition-transform duration-300" />
            </button>
            <div className="absolute top-full left-0 w-64 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2">
                <Link
                  to="/recharge"
                  className="block px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary rounded-xl transition-all"
                >
                  Recharge
                </Link>
                <Link
                  to="/bills"
                  className="block px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary rounded-xl transition-all"
                >
                  Pay Bills
                </Link>
                <Link
                  to="/tickets"
                  className="block px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary rounded-xl transition-all"
                >
                  Ticket Booking
                </Link>
              </div>
            </div>
          </div>

          {/* Calculators Dropdown */}
          <div className="relative group py-2">
            <button className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors cursor-pointer group-hover:text-primary">
              Calculators
              <ChevronDown className="size-4 opacity-50 group-hover:rotate-180 transition-transform duration-300" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none group-hover:pointer-events-auto">
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 flex gap-8 w-[550px]">
                {/* Left: All Calculators */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-6 px-2">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Calculator className="size-4" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Financial Tools
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      {
                        name: "EMI Calculator",
                        path: "/calculators/emi",
                        icon: "account_balance",
                        color: "text-emerald-500",
                      },
                      {
                        name: "SIP Calculator",
                        path: "/calculators/sip",
                        icon: "trending_up",
                        color: "text-primary",
                      },
                      {
                        name: "Credit Card Interest",
                        path: "/calculators/credit-card",
                        icon: "credit_card",
                        color: "text-rose-500",
                      },
                      {
                        name: "Loan Eligibility",
                        path: "/calculators/loan-eligibility",
                        icon: "verified_user",
                        color: "text-amber-500",
                      },
                    ].map((calc, idx) => (
                      <Link
                        key={idx}
                        to={calc.path}
                        className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all group/item"
                      >
                        <span
                          className={`material-symbols-outlined text-lg ${calc.color} opacity-70 group-hover/item:opacity-100 transition-opacity`}
                        >
                          {calc.icon}
                        </span>
                        {calc.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Right: Featured Tool */}
                <div className="w-[180px] flex flex-col gap-3 border-l border-slate-100 dark:border-white/5 pl-8">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                    Top Rated
                  </h4>

                  <Link
                    to="/calculators/sip"
                    className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 group/opt transition-all hover:scale-[1.02]"
                  >
                    <TrendingUp className="size-5 text-indigo-600 mb-2 group-hover/opt:scale-110 transition-transform" />
                    <div className="text-[10px] font-black text-indigo-800 dark:text-indigo-400 uppercase tracking-tight">
                      SIP Expert
                    </div>
                    <div className="text-[9px] text-indigo-600/70 mt-0.5">
                      Plan wealth
                    </div>
                  </Link>

                  <Link
                    to="/calculators/emi"
                    className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 group/opt transition-all hover:scale-[1.02]"
                  >
                    <Wallet className="size-5 text-emerald-600 mb-2 group-hover/opt:scale-110 transition-transform" />
                    <div className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tight">
                      Smart EMI
                    </div>
                    <div className="text-[9px] text-emerald-600/70 mt-0.5">
                      Loan planner
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Company Dropdown */}
          <div className="relative group py-2">
            <button className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors cursor-pointer group-hover:text-primary">
              Company
              <ChevronDown className="size-4 opacity-50 group-hover:rotate-180 transition-transform duration-300" />
            </button>
            <div className="absolute top-full left-0 w-56 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2">
                <Link
                  to="/about"
                  className="block px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary rounded-xl transition-all"
                >
                  About Company
                </Link>
                <Link
                  to="/policy"
                  className="block px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary rounded-xl transition-all"
                >
                  Company Policy
                </Link>
                <Link
                  to="/blog"
                  className="block px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary rounded-xl transition-all"
                >
                  Blogs
                </Link>
                <Link
                  to="/careers"
                  className="block px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary rounded-xl transition-all"
                >
                  Careers
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Desktop Auth - Logged In */}
              <div className="hidden sm:flex items-center gap-4">
                <button className="p-2 text-slate-500 hover:text-primary transition-colors relative">
                  <Bell className="size-5" />
                  <span className="absolute top-1.5 right-1.5 size-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                </button>
                <Link
                  to={getDashboardPath()}
                  className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-lg shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
                >
                  Dashboard
                </Link>
              </div>

              {/* Mobile Auth - Logged In */}
              <div className="sm:hidden">
                <Link
                  to={getDashboardPath()}
                  className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-lg shadow-lg shadow-primary/20 flex items-center gap-1.5 active:scale-95 transition-transform"
                >
                  Dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Desktop Auth - Guest */}
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-5 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-lg shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
                >
                  Register
                </Link>
              </div>

              {/* Mobile Auth - Guest Combined Button */}
              <div className="sm:hidden">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-lg shadow-lg shadow-primary/20 flex items-center gap-1.5 active:scale-95 transition-transform"
                >
                  Login
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-[70] w-80 bg-white dark:bg-slate-900 shadow-2xl lg:hidden flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link to="/" className="flex items-center">
                  <img
                    src={logo}
                    alt="PayVit Logo"
                    className="h-14 md:h-16 w-auto object-contain bg-white/90"
                  />
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <X className="size-6" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-4 py-6">
                <div className="space-y-1">
                  {/* Services & Payments */}
                  <div>
                    <button
                      onClick={() =>
                        setActiveMobileSub(
                          activeMobileSub === "services" ? null : "services",
                        )
                      }
                      className="w-full flex items-center justify-between p-4 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                      Services & Payments
                      <ChevronDown
                        className={`size-4 transition-transform ${activeMobileSub === "services" ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {activeMobileSub === "services" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-4"
                        >
                          {navOptions.services.map((sub, idx) => (
                            <div key={idx} className="mb-2">
                              {sub.items ? (
                                <>
                                  <button
                                    onClick={() =>
                                      setActiveNestedMobileSub(
                                        activeNestedMobileSub === sub.title
                                          ? null
                                          : sub.title,
                                      )
                                    }
                                    className="w-full flex items-center justify-between p-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                                  >
                                    {sub.title}
                                    <ChevronDown
                                      className={`size-3 transition-transform ${activeNestedMobileSub === sub.title ? "rotate-180" : ""}`}
                                    />
                                  </button>
                                  <AnimatePresence>
                                    {activeNestedMobileSub === sub.title && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden pl-2"
                                      >
                                        <div className="grid grid-cols-1 gap-1">
                                          {sub.items.map((item, i) => (
                                            <Link
                                              key={i}
                                              to={item.to}
                                              onClick={() =>
                                                setIsMobileMenuOpen(false)
                                              }
                                              className="block p-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary rounded-lg transition-colors"
                                            >
                                              {item.label}
                                            </Link>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </>
                              ) : (
                                <Link
                                  to={sub.to!}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="block p-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary rounded-lg transition-colors"
                                >
                                  {sub.label}
                                </Link>
                              )}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Recharge & Bills */}
                  <div>
                    <button
                      onClick={() =>
                        setActiveMobileSub(
                          activeMobileSub === "recharge" ? null : "recharge",
                        )
                      }
                      className="w-full flex items-center justify-between p-4 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                      Recharge & Bills
                      <ChevronDown
                        className={`size-4 transition-transform ${activeMobileSub === "recharge" ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {activeMobileSub === "recharge" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-4"
                        >
                          <div className="grid grid-cols-1 gap-1">
                            <Link
                              to="/recharge"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block p-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary rounded-lg transition-colors"
                            >
                              Recharge
                            </Link>
                            <Link
                              to="/bills"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block p-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary rounded-lg transition-colors"
                            >
                              Pay Bills
                            </Link>
                            <Link
                              to="/tickets"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block p-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary rounded-lg transition-colors"
                            >
                              Ticket Booking
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Company */}
                  <div>
                    <button
                      onClick={() =>
                        setActiveMobileSub(
                          activeMobileSub === "company" ? null : "company",
                        )
                      }
                      className="w-full flex items-center justify-between p-4 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                      Company
                      <ChevronDown
                        className={`size-4 transition-transform ${activeMobileSub === "company" ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {activeMobileSub === "company" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-4"
                        >
                          <div className="grid grid-cols-1 gap-1">
                            {navOptions.company.map((item, i) => (
                              <Link
                                key={i}
                                to={item.to}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block p-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary rounded-lg transition-colors"
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {user ? (
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white font-bold rounded-xl flex items-center justify-center shadow-sm"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Compare Action Bar */}
      <AnimatePresence>
        {(loanIds.length > 0 || cardIds.length > 0) && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-primary/20 scale-90 md:scale-100"
          >
            {loanIds.length > 0 && (
              <Link
                to="/loans/compare"
                className="flex items-center gap-3 pl-4 pr-3 py-2.5 hover:bg-white/10 rounded-2xl transition-colors group"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Loans
                  </span>
                  <span className="text-xs font-bold text-white leading-none">
                    {loanIds.length} Selected
                  </span>
                </div>
                <div className="size-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-lg">
                    compare_arrows
                  </span>
                </div>
              </Link>
            )}

            {loanIds.length > 0 && cardIds.length > 0 && (
              <div className="w-[1px] h-8 bg-slate-800 mx-1" />
            )}

            {cardIds.length > 0 && (
              <Link
                to="/cards/compare"
                className="flex items-center gap-3 pl-4 pr-3 py-2.5 hover:bg-white/10 rounded-2xl transition-colors group"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Cards
                  </span>
                  <span className="text-xs font-bold text-white leading-none">
                    {cardIds.length} Selected
                  </span>
                </div>
                <div className="size-10 bg-rose-500/20 text-rose-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-lg">
                    credit_card
                  </span>
                </div>
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 px-6 lg:px-20 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center">
                <img
                  src={logo}
                  alt="PayVit Logo"
                  className="h-20 md:h-22 w-auto object-contain bg-white/90"
                />
              </Link>
              <p className="text-slate-500 max-w-xs mb-8">
                Empowering your financial journey with the right tools,
                knowledge, and products. Get more from your money.
              </p>
              <div className="flex gap-4">
                <a
                  className="size-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                  href="#"
                >
                  <span className="material-symbols-outlined">share</span>
                </a>
                <a
                  className="size-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                  href="#"
                >
                  <span className="material-symbols-outlined">hub</span>
                </a>
                <a
                  className="size-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                  href="#"
                >
                  <span className="material-symbols-outlined">public</span>
                </a>
              </div>
            </div>
            <div>
              <h6 className="font-bold mb-6">Company</h6>
              <ul className="flex flex-col gap-4 text-sm text-slate-500">
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    to="/about"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" to="/">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" to="/">
                    Press
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" to="/">
                    Partners
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h6 className="font-bold mb-6">Resources</h6>
              <ul className="flex flex-col gap-4 text-sm text-slate-500">
                <li>
                  <Link className="hover:text-primary transition-colors" to="/">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    to="/blog"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" to="/">
                    Financial Tools
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-primary transition-colors"
                    to="/policy"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h6 className="font-bold mb-6">Contact</h6>
              <ul className="flex flex-col gap-4 text-sm text-slate-500">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs">
                    mail
                  </span>{" "}
                  support@payvit.com
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs">
                    call
                  </span>{" "}
                  +1 (555) 000-1234
                </li>
                <li className="flex items-center gap-2 text-primary font-bold">
                  <span className="material-symbols-outlined text-xs">
                    chat
                  </span>{" "}
                  Live Chat
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <p>© 2024 PayVit Fintech Solutions. All rights reserved.</p>
            <div className="flex gap-6">
              <Link
                className="hover:text-primary transition-colors"
                to="/policy"
              >
                Terms of Service
              </Link>
              <Link className="hover:text-primary transition-colors" to="/">
                Security Information
              </Link>
              <Link className="hover:text-primary transition-colors" to="/">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
