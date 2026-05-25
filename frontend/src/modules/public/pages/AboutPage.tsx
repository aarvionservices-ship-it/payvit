import { 
  Users, 
  Target, 
  Heart, 
  ShieldCheck, 
  TrendingUp, 
  Globe2,
  Rocket
} from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../../../components/shared/SEO';

const VALUES = [
  {
    title: "Customer First",
    desc: "Every product we build and every decision we make starts with our customers' needs.",
    icon: Heart,
    color: "text-rose-500",
    bg: "bg-rose-50"
  },
  {
    title: "Trust & Safety",
    desc: "We use bank-grade security to ensure your financial data is always protected.",
    icon: ShieldCheck,
    color: "text-blue-500",
    bg: "bg-blue-50"
  },
  {
    title: "Innovation",
    desc: "We are constantly pushing boundaries to make financial services more accessible.",
    icon: Rocket,
    color: "text-purple-500",
    bg: "bg-purple-50"
  },
  {
    title: "Growth",
    desc: "We empower individuals and businesses to scale their financial potential.",
    icon: TrendingUp,
    color: "text-emerald-500",
    bg: "bg-emerald-50"
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <SEO 
        title="About Us - Our Mission & Vision"
        description="Learn about PayVit's mission to revolutionize financial services and empower millions through technology."
      />
      
      {/* Hero Section */}
      <section className="relative py-32 px-6 lg:px-20 bg-slate-900 overflow-hidden text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-primary mb-8"
          >
            <Globe2 size={14} />
            Bharat's Trusted FinTech
          </motion.div>
          <h1 className="text-5xl lg:text-8xl font-black text-white italic uppercase tracking-tighter leading-tight mb-8">
            Empowering <br />
            <span className="text-primary italic">Your Future.</span>
          </h1>
          <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
            PayVit is more than a platform. We are a team of dreamers, builders, and financial experts working together to create a seamless financial ecosystem for everyone.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 lg:px-20 -mt-16 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Users", value: "5M+" },
              { label: "Bank Partners", value: "50+" },
              { label: "Years Experience", value: "10+" },
              { label: "Transactions", value: "₹500Cr+" }
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl text-center">
                 <h4 className="text-4xl font-black text-primary mb-2 italic">{stat.value}</h4>
                 <p className="text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-32 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl lg:text-6xl font-black italic uppercase tracking-tighter leading-none text-slate-900 dark:text-white">
              Our <span className="text-primary">Mission</span> Is <br />Simple.
            </h2>
            <p className="text-lg text-slate-500 font-bold leading-relaxed">
              We aim to bridge the gap between complex financial products and the common man. By leveraging cutting-edge AI and simplified user experiences, we make loans, cards, and payments accessible to everyone, everywhere.
            </p>
            <div className="flex gap-4">
               <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 w-fit">
                  <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white">
                     <Target size={20} />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest italic">100% Transparency</span>
               </div>
            </div>
          </div>
          <div className="relative">
             <div className="aspect-square bg-slate-100 dark:bg-slate-900 rounded-[4rem] relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Users size={120} className="text-white opacity-20" />
                </div>
                <div className="absolute inset-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]" />
             </div>
             <div className="absolute -bottom-8 -right-8 p-12 bg-white dark:bg-slate-800 rounded-[3rem] shadow-3xl border border-slate-100 dark:border-white/5 hidden lg:block">
                <h5 className="text-6xl font-black text-slate-200 dark:text-slate-700 leading-none">A+</h5>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Rating Level</p>
             </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-32 px-6 lg:px-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-4">Core Principles</h2>
            <h3 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">What We <br />Stand For.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((v, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 hover:shadow-2xl transition-all group">
                <div className={`size-16 rounded-2xl ${v.bg} flex items-center justify-center ${v.color} mb-8 group-hover:scale-110 transition-transform`}>
                   <v.icon size={32} />
                </div>
                <h4 className="text-xl font-black uppercase italic text-slate-900 dark:text-white mb-4">{v.title}</h4>
                <p className="text-sm text-slate-500 font-bold leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing Call to Action */}
      <section className="py-32 px-6 lg:px-20 bg-slate-900 text-center relative overflow-hidden">
         <div className="max-w-3xl mx-auto relative z-10">
            <h4 className="text-4xl lg:text-7xl font-black text-white italic uppercase tracking-tighter mb-10 leading-tight">Be Part Of <br />The Journey.</h4>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <button className="px-12 py-6 bg-primary text-white rounded-full font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-2xl">
                 Join Our Team
               </button>
               <button className="px-12 py-6 bg-white/5 border border-white/10 text-white rounded-full font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">
                 Contact Us
               </button>
            </div>
         </div>
      </section>
    </div>
  );
}

