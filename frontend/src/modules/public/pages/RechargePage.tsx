import { 
  Smartphone, 
  Tv, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Rocket
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { SEO } from '../../../components/shared/SEO';

const RECHARGE_SERVICES = [
  {
    id: 'prepaid',
    name: 'Mobile Prepaid',
    description: 'Instant recharge for all major telecom operators',
    icon: Smartphone,
    color: 'from-blue-500 to-indigo-600',
    category: 'RECHARGE'
  },
  {
    id: 'postpaid',
    name: 'Mobile Postpaid',
    description: 'Pay your postpaid bills with zero convenience fee',
    icon: Smartphone,
    color: 'from-purple-500 to-pink-600',
    category: 'BILLS'
  },
  {
    id: 'dth',
    name: 'DTH Recharge',
    description: 'Tata Play, Airtel Digital TV, Dish TV & more',
    icon: Tv,
    color: 'from-amber-400 to-orange-600',
    category: 'RECHARGE'
  }
];

export default function RechargePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <SEO 
        title="Mobile & DTH Recharge - Instant Payments"
        description="Recharge your mobile and DTH instantly with PayVit. Get the best offers and cashback on every transaction."
      />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 py-32 px-6 lg:px-20 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-md border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
              <Rocket size={14} className="animate-bounce" />
              Instant Confirmation
            </div>
            <h1 className="text-5xl lg:text-7xl font-black italic tracking-tighter leading-[0.9] uppercase">
              Recharge <br />
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Anytime.</span>
            </h1>
            <p className="text-slate-400 text-lg lg:text-xl font-medium max-w-xl leading-relaxed">
              Experience the fastest way to recharge your mobile and DTH services. Secure, reliable, and rewarding.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
               <Link to="/register" className="w-full sm:w-auto px-12 py-6 bg-primary text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-2xl shadow-primary/20">
                 Start Recharging
               </Link>
            </div>
          </div>
          
          <div className="relative hidden lg:block">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-12 shadow-3xl">
              <div className="flex items-center gap-6 mb-12">
                 <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl">
                    <Smartphone size={32} />
                 </div>
                 <div>
                    <h4 className="text-2xl font-black italic uppercase leading-none">Instant Pay</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Secured by 256-bit SSL</p>
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
        <div className="mb-20">
          <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-4">Our Services</h2>
          <h3 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Choose Your <br />Benefit.</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {RECHARGE_SERVICES.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] p-10 border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-900 hover:shadow-2xl transition-all duration-500"
            >
              <div className={`size-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow-lg mb-8 group-hover:scale-110 transition-transform`}>
                <service.icon size={32} strokeWidth={2.5} />
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase italic tracking-tight">
                {service.name}
              </h3>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">
                {service.category}
              </p>
              <p className="text-sm text-slate-500 font-bold leading-relaxed mb-8">
                {service.description}
              </p>

              <Link to="/login" className="w-full py-5 px-6 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group-hover:bg-primary">
                Proceed <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-32 px-6 lg:px-20 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
           <div className="lg:w-1/2">
              <h3 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white mb-8">Safe & Secure <br />Payments Hub.</h3>
              <div className="space-y-6">
                 {[
                   { title: "Bank-Grade security", icon: ShieldCheck },
                   { title: "Instant Status Updates", icon: Zap },
                   { title: "Universal Recharge Support", icon: Smartphone }
                 ].map((item, i) => (
                   <div key={i} className="flex gap-4 items-center p-6 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-white/5">
                      <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                         <item.icon size={24} />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 uppercase italic text-sm">{item.title}</span>
                   </div>
                 ))}
              </div>
           </div>
           <div className="lg:w-1/2 text-center p-12 lg:p-20 bg-primary rounded-[4rem] text-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <h4 className="text-4xl font-black italic uppercase tracking-tighter mb-10 leading-none">Ready to start?</h4>
              <Link to="/register" className="inline-block px-12 py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:scale-105 transition-all">
                Create Account
              </Link>
           </div>
        </div>
      </section>
    </div>
  );
}

