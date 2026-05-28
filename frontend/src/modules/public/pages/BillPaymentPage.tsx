import { 
  Zap, 
  Droplet, 
  Flame, 
  ArrowRight,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Rocket
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { SEO } from '../../../components/shared/SEO';

const BILL_SERVICES = [
  {
    id: 'electricity',
    name: 'Electricity Bill',
    description: 'Pay your monthly electricity bills from 50+ boards in India',
    icon: Zap,
    color: 'from-amber-400 to-orange-600',
    category: 'UTILITY'
  },
  {
    id: 'water',
    name: 'Water Bill',
    description: 'Avoid late fees with instant water bill payments',
    icon: Droplet,
    color: 'from-cyan-400 to-blue-600',
    category: 'UTILITY'
  },
  {
    id: 'gas',
    name: 'Gas Booking',
    description: 'Book your cylinder or pay piped gas bills effortlessly',
    icon: Flame,
    color: 'from-orange-500 to-red-600',
    category: 'UTILITY'
  },
  {
    id: 'broadband',
    name: 'Broadband Bill',
    description: 'Unlimited internet payments for all major providers',
    icon: Zap,
    color: 'from-indigo-400 to-blue-700',
    category: 'INTERNET'
  }
];

export default function BillPaymentPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <SEO 
        title="Pay Bills Online - Fast & Secure"
        description="Pay your electricity, water, gas, and broadband bills online with PayVit. Secure payments with instant receipts."
      />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 py-32 px-6 lg:px-20 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
              <Rocket size={14} className="animate-pulse" />
              India's #1 Utility Platform
            </div>
            <h1 className="text-5xl lg:text-7xl font-black  tracking-tighter leading-[0.9] uppercase">
              Pay Bills <br />
              <span className="text-primary  underline decoration-[15px] decoration-primary/10">Ab Seconds Mein.</span>
            </h1>
            <p className="text-slate-400 text-lg lg:text-xl font-medium max-w-xl leading-relaxed">
              Bharat ke sabse fast payments platform pe aapka swagat hai. Electricity se lekar Gas booking tak, sab kuch yahan hai.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
               <Link to="/register" className="w-full sm:w-auto px-12 py-6 bg-primary text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-2xl shadow-primary/20">
                 Pay My Bills
               </Link>
            </div>
          </div>
          
          <div className="relative hidden lg:block">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[4rem] p-12 shadow-3xl">
              <div className="flex items-center gap-6 mb-12">
                 <div className="size-16 rounded-3xl bg-primary flex items-center justify-center text-white shadow-xl">
                    <CreditCard size={32} />
                 </div>
                 <div>
                    <h4 className="text-2xl font-black  uppercase leading-none">Instant Bill</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 ">Secure Transactions</p>
                 </div>
              </div>
              <div className="space-y-6">
                 {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 w-full bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
                 ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-32 px-6 lg:px-20 max-w-7xl mx-auto">
        <div className="mb-20 text-center lg:text-left">
          <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-4">Bills Hub</h2>
          <h3 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Manage All <br />Your Utilities.</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BILL_SERVICES.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-white/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500"
            >
              <div className={`size-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow-lg mb-8 group-hover:rotate-12 transition-transform duration-500`}>
                <service.icon size={32} strokeWidth={2.5} />
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase italic tracking-tight">
                {service.name}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
                {service.category}
              </p>
              <p className="text-sm text-slate-500 font-bold leading-relaxed mb-8">
                {service.description}
              </p>

              <Link to="/login" className="w-full py-4 px-6 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 hover:bg-primary">
                Pay Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-24 px-6 lg:px-20 border-y border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          {[
            { title: "Universal Payments", desc: "Support for 500+ service providers across India.", icon: Smartphone },
            { title: "Bank-Grade Safety", desc: "Your transactions are always protected with 256-bit encryption.", icon: ShieldCheck },
            { title: "Instant Receipts", desc: "Get immediate payment confirmation and digital receipts.", icon: Zap }
          ].map((item, i) => (
            <div key={i} className="text-center group">
               <div className="size-20 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 mx-auto flex items-center justify-center text-primary mb-8 border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform">
                  <item.icon size={36} />
               </div>
               <h4 className="text-xl font-black italic uppercase text-slate-900 dark:text-white mb-4">{item.title}</h4>
               <p className="text-slate-500 font-bold leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-32 px-6 lg:px-20 bg-slate-900 text-center relative overflow-hidden">
         <div className="max-w-3xl mx-auto relative z-10">
            <h4 className="text-4xl lg:text-6xl font-black text-white italic uppercase tracking-tighter mb-10 leading-tight">No Hidden <br />Charges Ever.</h4>
            <Link to="/register" className="inline-block px-12 py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:scale-105 transition-all">
              Go Digital Now
            </Link>
         </div>
      </section>
    </div>
  );
}

