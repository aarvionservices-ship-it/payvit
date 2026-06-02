import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import { SEO } from "../../../components/shared/SEO";
import { getLoans } from "../../../api/loan.api";
import { getCards } from "../../../api/card.api";
import MarketplaceOfferCard from "../components/MarketplaceOfferCard";
import type { LoanModel, CardModel } from "../../../types";
import heroBanner from "../../../assets/Hero-Banner.jpeg";

export default function LandingPage() {
  const [featuredOffers, setFeaturedOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [loanRes, cardRes] = await Promise.all([getLoans(), getCards()]);

        let allItems: any[] = [];
        if (loanRes.success) {
          const lData =
            loanRes.data?.data ||
            (Array.isArray(loanRes.data) ? loanRes.data : []);
          allItems = [
            ...allItems,
            ...lData.map((l: LoanModel) => ({
              ...l,
              type: "loan",
              badgeText: l.provider.charAt(0).toUpperCase(),
              badgeColor: "text-blue-800",
              headerBg: "bg-blue-600",
              title: l.loanName,
              subtitle: l.provider,
              interestRate: `${l.interestRate.min}% p.a.`,
              feeLabel: "Processing Fee",
              feeValue: `${l.feesAndCharges.processingFee.percentage}%`,
            })),
          ];
        }
        if (cardRes.success) {
          const cData =
            cardRes.data?.data ||
            (Array.isArray(cardRes.data) ? cardRes.data : []);
          allItems = [
            ...allItems,
            ...cData.map((c: CardModel) => ({
              ...c,
              type: "card",
              badgeText: (c.bank || "B").charAt(0).toUpperCase(),
              badgeColor: "text-rose-800",
              headerBg: "bg-rose-600",
              title: c.cardName,
              subtitle: c.bank,
              interestRate: "Up to 50 Days free",
              feeLabel: "Annual Fee",
              feeValue:
                !c.fees.annualFee ||
                c.fees.annualFee === 0 ||
                c.fees.annualFee === "0"
                  ? "Free"
                  : `₹${c.fees.annualFee}`,
            })),
          ];
        }

        // Shuffle and take 3
        const shuffled = allItems.sort(() => 0.5 - Math.random());
        setFeaturedOffers(shuffled.slice(0, 3));
      } catch (error) {
        console.error("Error fetching landing page data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      <SEO
        title="Compare & Apply for Best Loans and Cards"
        description="Get instant approvals and the best interest rates from 50+ partner banks. Compare personal loans, business loans, and credit cards with PayVit."
      />

      {/* Hero Section */}
      <section className="px-6 lg:px-20 pt-4 pb-12 lg:pt-8 lg:pb-20 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full w-fit">
              <span className="material-symbols-outlined text-sm">
                verified
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">
                Trusted by 5M+ Users
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-black leading-[1.1] text-slate-900 dark:text-white">
              Compare &amp; Apply for the{" "}
              <span className="text-primary">Best Loans</span> and Cards
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
              Get instant approvals and the best interest rates from 50+ partner
              banks. Your financial freedom starts here with personalized
              recommendations.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/offers"
                className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2"
              >
                Explore Offers{" "}
                <span className="material-symbols-outlined">trending_flat</span>
              </Link>
              <Link
                to="/register"
                className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-lg hover:bg-slate-50 transition-colors"
              >
                Apply Now
              </Link>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 w-fit">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                <span className="material-symbols-outlined text-xl">call</span>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Still confused about the loans?{" "}
                <a
                  href="tel:+15550001234"
                  className="text-primary font-bold hover:underline"
                >
                  Give a call, we'll help you
                </a>
              </p>
            </div>
          </div>
          <div className="ml-10 relative flex justify-center items-center">
            <div className="relative w-fit">
              {/* Main Hero Image */}
              <div className="relative group">
                <img
                  src={heroBanner}
                  alt="PayVit App Preview"
                  className="
        w-full
        max-w-[420px]
        lg:max-w-[480px]
        rounded-[2rem]
        shadow-2xl
        border
        border-white/20
        dark:border-slate-700
        object-contain
        transition-all
        duration-500
        ease-out
        group-hover:scale-[1.03]
        group-hover:-translate-y-2
        group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.25)]
      "
                />

                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-[2rem] bg-primary/10 blur-3xl -z-10 opacity-60 group-hover:opacity-90 transition-opacity duration-500"></div>
              </div>

              {/* Floating Approval Card */}
              <div
                className="
      absolute
      bottom-0
      right-0
      lg:-right-10
      bg-white
      dark:bg-slate-800
      p-5
      rounded-2xl
      shadow-xl
      border
      border-slate-100
      dark:border-slate-700
      
    "
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 text-green-600 rounded-full">
                    <span className="material-symbols-outlined">
                      check_circle
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 font-medium">
                      Loan Approved
                    </p>

                    <p className="text-lg font-bold">$25,000.00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Services Section */}
      <section className="px-6 lg:px-20 py-20 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Financial Services</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              One-stop shop for all your credit needs. Choose from a wide range
              of products designed for your growth.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ServiceCard
              icon="person"
              title="Personal Loan"
              description="Instant cash up to ₹50k with minimal documentation."
              colorTheme="blue"
              delay={0.1}
              to="/offers?category=Personal Loans"
            />
            <ServiceCard
              icon="business_center"
              title="Business Loan"
              description="Scale your business with competitive interest rates."
              colorTheme="purple"
              delay={0.2}
              to="/offers?category=Business"
            />
            <ServiceCard
              icon="credit_card"
              title="Credit Cards"
              description="Best rewards & cashback tailored for your lifestyle."
              colorTheme="rose"
              delay={0.3}
              to="/offers?category=Credit Cards"
            />
            <ServiceCard
              icon="home"
              title="Home Loan"
              description="Own your dream home with easy EMI options."
              colorTheme="emerald"
              delay={0.4}
              to="/offers?category=Home Loans"
            />
          </div>
        </div>
      </section>

      {/* Utility Payments Section */}
      <section className="px-6 lg:px-20 py-20 bg-slate-50 dark:bg-slate-800/20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Utility Payments</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Quick and secure payments for all your daily needs. Earn rewards
              on every transaction.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <ServiceCard
              icon="smartphone"
              title="Mobile Recharge"
              description="Instant recharges for all major telecom operators."
              colorTheme="indigo"
              delay={0.1}
              to="/recharge"
            />
            <ServiceCard
              icon="receipt_long"
              title="Bill Payments"
              description="Pay electricity, water, gas and more utility bills."
              colorTheme="amber"
              delay={0.2}
              to="/bills"
            />
            <ServiceCard
              icon="confirmation_number"
              title="Ticket Booking"
              description="Book bus, train, and flight tickets with ease."
              colorTheme="blue"
              delay={0.3}
              to="/tickets"
            />
          </div>
        </div>
      </section>

      {/* Premium Experience Section */}
      <section className="px-6 lg:px-20 py-32 bg-slate-900 overflow-hidden relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
          <div className="relative order-2 lg:order-1">
            {/* Premium Card Display */}
            <div className="relative w-full max-w-md mx-auto group">
              <div className="aspect-[1.586/1] w-full rounded-[2.5rem] bg-gradient-to-br from-slate-800 to-slate-950 p-10 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col justify-between relative overflow-hidden transition-all duration-700 group-hover:rotate-[-2deg] group-hover:scale-105">
                <div className="flex justify-between items-start">
                  <div className="size-14 bg-amber-400/20 rounded-xl border border-amber-400/30 flex items-center justify-center backdrop-blur-sm">
                    <div className="w-10 h-7 bg-amber-400/50 rounded-md"></div>
                  </div>
                  <span className="text-white/20 font-black italic text-2xl uppercase tracking-tighter">
                    Platinum
                  </span>
                </div>

                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.4em] font-black mb-4">
                    Exclusive Member
                  </p>
                  <p className="text-white text-2xl md:text-3xl font-medium tracking-[0.25em] mb-10 leading-none">
                    4582 •••• •••• 1024
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white/20 text-[8px] uppercase font-black mb-1">
                        Authorized User
                      </p>
                      <p className="text-white text-sm font-bold uppercase tracking-widest italic">
                        Valued Customer
                      </p>
                    </div>
                    <div className="flex -space-x-4">
                      <div className="size-12 rounded-full bg-rose-500/80 blur-[2px]"></div>
                      <div className="size-12 rounded-full bg-amber-500/80 blur-[2px]"></div>
                    </div>
                  </div>
                </div>

                {/* Glass Shine */}
                <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </div>

              {/* Floating Stat Card 1 */}
              <div className="absolute -top-12 -right-12 p-6 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl group-hover:-translate-y-4 transition-transform duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <span className="material-symbols-outlined text-sm">
                      trending_up
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                    Rewards
                  </span>
                </div>
                <p className="text-2xl font-black text-white">₹ 12,450</p>
              </div>

              {/* Floating Stat Card 2 */}
              <div className="absolute -bottom-10 -left-12 p-6 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl group-hover:translate-y-4 transition-transform duration-500 delay-75">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-sm">
                      verified_user
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                    Trust Store
                  </span>
                </div>
                <p className="text-2xl font-black text-white">Elite</p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full mb-8 backdrop-blur-sm border border-primary/20">
              <span className="material-symbols-outlined text-sm">
                workspace_premium
              </span>
              <span className="text-xs font-bold uppercase tracking-widest">
                Premium Membership
              </span>
            </div>
            <h2 className="text-5xl lg:text-7xl font-black text-white mb-8 leading-[1] tracking-tighter">
              A New Standard <br />
              Of{" "}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Excellence
              </span>
            </h2>
            <p className="text-xl text-slate-400 mb-12 leading-relaxed max-w-xl">
              Elevate your financial lifestyle with our limited edition PayVit
              Metal Card. Designed for those who demand the absolute best in
              security and rewards.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              {[
                { title: "Priority Access", icon: "shield_moon" },
                { title: "Global Lounge", icon: "flight_takeoff" },
                { title: "24/7 Concierge", icon: "support_agent" },
                { title: "Crypto Ready", icon: "currency_bitcoin" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 group cursor-default"
                >
                  <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all group-hover:scale-110">
                    <span className="material-symbols-outlined">
                      {item.icon}
                    </span>
                  </div>
                  <span className="text-slate-300 font-bold group-hover:text-white transition-colors">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all hover:shadow-[0_20px_40px_-10px_rgba(59,130,246,0.5)] active:scale-95"
            >
              Secure Your Card{" "}
              <span className="material-symbols-outlined">chevron_right</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Offers Section - Redesigned with Snap Scroll */}
      <section className="h-screen overflow-hidden px-6 lg:px-20 bg-white dark:bg-slate-950 relative border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 h-full">
          {/* Left Side: Fixed Content */}
          <div className="lg:w-1/3 flex flex-col justify-center h-full space-y-8 py-12 lg:py-0">
            <div className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-600 px-4 py-2 rounded-full backdrop-blur-sm border border-rose-500/10 w-fit">
              <span className="material-symbols-outlined text-sm">
                auto_awesome
              </span>
              <span className="text-xs font-bold uppercase tracking-widest">
                Featured Offers
              </span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">
              Discover <br />
              <span className="text-rose-500">Unbeatable</span> <br />
              Bank Deals
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              We've curated the top-performing loan and card offers from 50+
              partner banks. Compare interests, fees, and perks in one glance.
            </p>
            <div className="flex items-center gap-12">
              <Link
                to="/offers"
                className="inline-flex items-center gap-2 text-rose-500 font-black uppercase text-xs tracking-[0.2em] group"
              >
                Explore All
                <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">
                  arrow_right_alt
                </span>
              </Link>
              <div className="hidden lg:flex flex-col gap-1">
                <div className="size-1 bg-rose-500 rounded-full animate-bounce"></div>
                <div className="size-1 bg-slate-200 rounded-full"></div>
                <div className="size-1 bg-slate-200 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Right Side: Snap Scroll Cards */}
          <div className="lg:w-2/3 h-full overflow-y-auto snap-y snap-mandatory scroll-smooth pr-4 -mr-4 scrollbar-hide">
            {!isLoading &&
              featuredOffers.map((offer, idx) => (
                <div
                  key={idx}
                  className="h-full snap-start snap-always flex flex-col justify-center py-10"
                >
                  <MarketplaceOfferCard
                    id={offer._id}
                    type={offer.type}
                    bankName={offer.subtitle}
                    bankColor={offer.headerBg}
                    title={offer.title}
                    description={
                      offer.type === "loan"
                        ? "Flexible tenure and competitive rates for your dreams."
                        : "Best rewards & cashback tailored for your lifestyle."
                    }
                    stat1Label="Interest"
                    stat1Value={offer.interestRate}
                    stat2Label={offer.feeLabel}
                    stat2Value={offer.feeValue}
                    stat3Label={
                      offer.type === "loan" ? "Max Amount" : "Trust Score"
                    }
                    stat3Value={
                      offer.type === "loan"
                        ? `${(offer.loanAmount?.max / 100000).toFixed(1)} L`
                        : "Elite Elite"
                    }
                    delay={0}
                  />
                </div>
              ))}
            {isLoading &&
              [1, 2, 3].map((i) => (
                <div key={i} className="h-full flex flex-col justify-center">
                  <div className="h-64 bg-slate-100 dark:bg-slate-900/50 animate-pulse rounded-[3rem]"></div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Financial Calculators Preview Section */}
      <section className="px-6 lg:px-20 py-20 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full w-fit mb-6">
              <span className="material-symbols-outlined text-sm">
                calculate
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">
                Plan Your Future
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight text-slate-900 dark:text-white">
              Smart Tools for{" "}
              <span className="text-emerald-500">Smarter Decisions</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
              Use our advanced financial calculators to plan your loans,
              investments, and more. Transparent results, instantly.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "EMI Calculator",
                  icon: "account_balance",
                  color: "bg-emerald-500",
                  path: "/calculators/emi",
                },
                {
                  title: "SIP Calculator",
                  icon: "trending_up",
                  color: "bg-primary",
                  path: "/calculators/sip",
                },
                {
                  title: "Credit Card Interest",
                  icon: "credit_card",
                  color: "bg-rose-500",
                  path: "/calculators/credit-card",
                },
                {
                  title: "Loan Eligibility",
                  icon: "verified_user",
                  color: "bg-amber-500",
                  path: "/calculators/loan-eligibility",
                },
              ].map((calc, idx) => (
                <Link
                  key={idx}
                  to={calc.path}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-primary/20 transition-all group"
                >
                  <div
                    className={`size-12 rounded-xl ${calc.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <span className="material-symbols-outlined">
                      {calc.icon}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">
                      {calc.title}
                    </h4>
                    <p className="text-[10px] text-slate-500">Calculate Now</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
            {/* Simple EMI Preview Widget */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black">EMI Preview</h3>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-xs font-black uppercase">
                  Personal Loan
                </span>
              </div>

              <div className="space-y-8 mb-10">
                <div>
                  <div className="flex justify-between text-sm font-bold mb-3">
                    <p className="text-slate-500">Loan Amount</p>
                    <p className="text-slate-900 dark:text-white">
                      ₹ 15,00,000
                    </p>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[40%] bg-emerald-500"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold mb-3">
                    <p className="text-slate-500">Interest Rate</p>
                    <p className="text-slate-900 dark:text-white">9.5% p.a.</p>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[30%] bg-emerald-500"></div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-slate-900 text-white flex justify-between items-center shadow-2xl shadow-emerald-900/20">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Monthly EMI
                  </p>
                  <p className="text-3xl font-black">₹ 31,489</p>
                </div>
                <Link
                  to="/calculators/emi"
                  className="size-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 transition-colors flex items-center justify-center group-hover:rotate-12 transition-transform"
                >
                  <span className="material-symbols-outlined text-3xl">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-20 py-20 bg-primary/5">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-slate-500">
            The fastest way to get your finances in order in just 3 simple
            steps.
          </p>
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-dashed border-t-2 border-dashed border-primary/20"></div>
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="size-20 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-xl shadow-primary/20">
              1
            </div>
            <h4 className="text-xl font-bold mb-3">Compare Offers</h4>
            <p className="text-slate-500 text-sm">
              Enter basic details and compare tailored offers from leading
              banks.
            </p>
          </div>
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="size-20 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-xl shadow-primary/20">
              2
            </div>
            <h4 className="text-xl font-bold mb-3">Instant Approval</h4>
            <p className="text-slate-500 text-sm">
              Get digital approval in minutes with no physical documentation.
            </p>
          </div>
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="size-20 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-xl shadow-primary/20">
              3
            </div>
            <h4 className="text-xl font-bold mb-3">Disbursal</h4>
            <p className="text-slate-500 text-sm">
              Amount is credited directly to your bank account within 24 hours.
            </p>
          </div>
        </div>
      </section>
      <section className="px-6 lg:px-20 py-24 max-w-7xl mx-auto">
        <div className="bg-slate-900 rounded-[3rem] p-12 lg:p-20 text-white flex flex-col lg:flex-row items-center gap-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/10 blur-[100px] -mr-32"></div>
          <div className="lg:w-1/2 relative z-10">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Trust is our primary currency.
            </h2>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h5 className="text-4xl font-black text-primary">5M+</h5>
                <p className="text-slate-400 text-sm">Happy Customers</p>
              </div>
              <div>
                <h5 className="text-4xl font-black text-primary">50+</h5>
                <p className="text-slate-400 text-sm">Partner Banks</p>
              </div>
            </div>
            <p className="text-slate-400 mb-10 leading-relaxed">
              We use bank-grade 256-bit encryption to keep your data safe.
              Regulated by top financial authorities worldwide.
            </p>
            <div className="flex gap-6 items-center">
              <img
                alt="Bank Logo"
                className="h-20 lg:h-24 w-auto object-contain opacity-50 grayscale invert"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6B9ukdQeI8wdZG-p9801MVOEl1skK5dquZK0GlNiMeP1nAD5KKz2qPtSV9l096BM7jvBsARwtablBY_Xfl3pW2tjBMm5wZGXePCkDkVrduA7F_4olY2ijje4vx80BE-6pP6PZXqO6gh--_AV_ZwXjZzwVRc0z3QPPX8rZcXpD-Ta2KEEk-LFi-Yv1uqainabKo87iXvHD0PrwmWe-67sD9mtYyTJbNDNTTOhmNPvNLVh22PWpMwAfzLlisSpKij1BO7blpoHzboGw"
              />
              <img
                alt="Security Logo"
                className="h-20 lg:h-24 w-auto object-contain opacity-50 grayscale invert"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7KxXzTmRgcUoHASuQYbRSRzSk8SXXwCBP8RI0pb0R8Sdf9qSDwgJ2ZE9AZ5Km3i2djI3ITMsKNl9uluOy7eqA947T68FLJuzHU7FYEF4clh0zGz_q4OzPKDz5r8e1WKDQzaQWZu_e_-C7V_bcOdNFgxzEdPmaoqg5fqhlCW0qbsv9UCxxHOPmZYBtyngw8AwTWZZ4Oc-xy0wKTwIgTL0dMEKjcv6dM33nus-Vsfgmf2XptmHnKaeoYmsWXl6j-6YrKpY5MX7xyIF8"
              />
            </div>
          </div>
          <div className="lg:w-1/2 bg-slate-800/50 p-8 rounded-3xl border border-slate-700 relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="size-12 rounded-full bg-slate-700 overflow-hidden shrink-0"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD0zksbu_G7RYOUpthQTDglNpkLatdFzNwD3FLA4KCnedH1WwXgXuvAI7C1wM9zfL_cR2JqWTdptGF8GR4y67ovNjKVZU-iu4jRwOZP1jaoHYOqUPEDZQfa9VJw06LNaMUsvTOJ40KLG3IgG_P_ECmm7kRt_VAfmF_7go9CZtT31t70ZoDwNlNg8MCmt9U2QgXbAyrsZRYde7jORyOljHrh0V_oqgbPixihNiXpJKyXMX5oz9sUnQWIn1MiHgPhbg0v3blspvrFBaIh")',
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
              <div>
                <h6 className="font-bold">Asha Jain</h6>
                <p className="text-xs text-slate-400">
                  Approved for Rs.700000 Home Loan
                </p>
              </div>
            </div>
            <p className="text-lg italic text-slate-300 leading-relaxed">
              "The process was incredibly smooth. I compared 4 banks and found
              an interest rate 1.5% lower than my current bank. Savings were
              huge!"
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
