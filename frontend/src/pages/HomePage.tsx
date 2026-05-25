import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Smartphone, 
  Receipt, 
  Coins, 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  Clock, 
  TrendingUp,
  ChevronRight,
  Sparkles,
  Calculator,
  UserCheck,
  Globe
} from 'lucide-react';

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 100 }
    }
  };

  const services = [
    { title: 'Personal Loan', icon: <Coins className="size-6 text-blue-500" />, desc: 'Instant cash for your urgent needs with minimal docs.', link: '/offers?category=Personal Loans' },
    { title: 'Mobile Recharge', icon: <Smartphone className="size-6 text-emerald-500" />, desc: 'Fast and secure prepaid/postpaid recharges.', link: '/recharge' },
    { title: 'Bill Payments', icon: <Receipt className="size-6 text-rose-500" />, desc: 'Pay utility bills across India instantly.', link: '/bills' },
    { title: 'Credit Cards', icon: <CreditCard className="size-6 text-amber-500" />, desc: 'Elite cards with rewards tailored for you.', link: '/cards' },
    { title: 'Investment', icon: <TrendingUp className="size-6 text-indigo-500" />, desc: 'Grow your wealth with smart SIP options.', link: '/offers' },
    { title: 'Business Loan', icon: <UserCheck className="size-6 text-purple-500" />, desc: 'Fuel your startup or expansion goals easily.', link: '/offers?category=Business' },
  ];

  const features = [
    { title: 'Instant Approval', icon: <Zap className="size-5" />, color: 'bg-amber-100 text-amber-600' },
    { title: 'Safe & Secure', icon: <ShieldCheck className="size-5" />, color: 'bg-emerald-100 text-emerald-600' },
    { title: '24/7 Access', icon: <Clock className="size-5" />, color: 'bg-blue-100 text-blue-600' },
    { title: 'Paperless Process', icon: <Sparkles className="size-5" />, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="flex flex-col w-full bg-white dark:bg-background-dark overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-4 pb-32 lg:pt-12 lg:pb-48 px-6 lg:px-20 overflow-hidden">

        {/* Background Gradients */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 size-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-0 -ml-32 -mt-32 size-[400px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <motion.div 
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 mb-8">
              <Sparkles className="size-4 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest italic">The All-in-One Finance App</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.05] mb-8">
              Your Finance, <br />
              <span className="text-primary italic">Reimagined.</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Get instant loans, pay bills, and recharge on the go. Experience the next generation of financial freedom with India's most trusted digital platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link to="/register" className="group w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/30 hover:bg-primary-hover transition-all flex items-center justify-center gap-2 scale-100 hover:scale-105 active:scale-95 font-bold">
                Get Started Now
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/offers" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center font-bold">
                Explore Services
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-8 opacity-60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-widest">PCI DSS Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="size-5 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-widest">Trusted by 1M+ Users</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="flex-1 relative"
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          >
            {/* Visual for Demo Purposes */}
            <div className="relative z-10 w-full max-w-[500px] mx-auto rounded-[3rem] bg-slate-900/5 dark:bg-white/5 p-4 backdrop-blur-3xl border border-white/20 shadow-[0_0_100px_rgba(0,0,0,0.1)]">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-950 aspect-[4/5] shadow-2xl">
                 <img 
                    src="https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2670&auto=format&fit=crop" 
                    alt="Fintech Dashboard" 
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-950 via-transparent to-transparent" />
                  
                  {/* Floating Action Cards */}
                  <motion.div 
                    className="absolute top-12 left-1/2 -translate-x-1/2 w-4/5 p-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                        <div className="size-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                            <Coins className="size-6 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Available Balance</span>
                    </div>
                    <div className="text-2xl font-black text-white">₹ 4,52,000.00</div>
                  </motion.div>

                  <motion.div 
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[85%] p-4 bg-primary text-white rounded-2xl flex items-center justify-between"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  >
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <Zap className="size-4" />
                        </div>
                        <span className="text-xs font-bold">Auto-Repay Active</span>
                    </div>
                    <ChevronRight className="size-5" />
                  </motion.div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[120%] bg-primary/20 blur-[100px] rounded-full scale-0 animate-pulse-slow" />
          </motion.div>
        </div>
      </section>

      {/* Trust Stats Bar */}
      <section className="bg-slate-900 py-12 px-6 lg:px-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center lg:justify-between items-center gap-12 relative z-10">
          {[
            { label: 'Total Disbursements', value: '₹ 500Cr+' },
            { label: 'Active Customers', value: '1,000,000+' },
            { label: 'Digital-First Banks', value: '45+' },
            { label: 'Trust Rating', value: '4.9/5' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
      </section>

      {/* Services Grid Section */}
      <section className="py-32 px-6 lg:px-20 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">What we offer</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6">One Platform. All Solutions.</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Whether you need instant funds, want to stay on top of your utility bills, or planning to grow your wealth - we've got you covered.</p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {services.map((service, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                className="group p-8 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-[2rem] hover:shadow-2xl hover:shadow-primary/10 transition-all hover:-translate-y-2 cursor-pointer"
              >
                <div className="size-14 rounded-2xl bg-white dark:bg-slate-900 shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary transition-all group-hover:text-white">
                  {service.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{service.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{service.desc}</p>
                <Link to={service.link} className="inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:gap-3 transition-all">
                  Try it now <ArrowRight className="size-4" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Bill Payments Highlight */}
      <section className="py-32 px-6 lg:px-20 overflow-hidden bg-white dark:bg-background-dark">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-20">
          <div className="flex-1">
            <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">Seamless Payments</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-8">Never Miss a Bill. Never Leave Home.</h3>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-12 leading-relaxed">
              Pay electricity, water, gas, and DTH bills in seconds. Setup auto-pay and reminders so you're always ahead. Get cashback on every transaction.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {[
                { title: 'Electricity', icon: 'bolt' },
                { title: 'Water', icon: 'water_drop' },
                { title: 'Gas', icon: 'gas_meter' },
                { title: 'DTH', icon: 'tv_gen' },
              ].map((bill, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <span className="material-symbols-outlined text-primary">{bill.icon}</span>
                  <span className="font-bold text-sm">{bill.title}</span>
                </div>
              ))}
            </div>

            <button className="mt-12 px-8 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold hover:scale-105 transition-transform flex items-center gap-2">
              Pay My First Bill <ArrowRight className="size-5" />
            </button>
          </div>
          <div className="flex-1 relative">
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-slate-900/5 dark:border-white/5">
                <img 
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2574&auto=format&fit=crop" 
                alt="Bill Payments" 
                className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />
            </div>
            {/* Floaties */}
            <div className="absolute -top-10 -right-10 size-40 bg-indigo-500/10 blur-[60px] rounded-full animate-pulse-slow" />
            <div className="absolute -bottom-10 -left-10 size-60 bg-emerald-500/10 blur-[80px] rounded-full animate-pulse-slow delay-1000" />
          </div>
        </div>
      </section>

      {/* Feature Pills / Why Us? */}
      <section className="py-32 px-6 lg:px-20 bg-slate-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto relative z-10 text-center">
            <h2 className="text-4xl lg:text-5xl font-black mb-16">Smart Money. Smart Choices.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {features.map((feature, i) => (
                <div key={i} className="flex flex-col items-center">
                    <div className={`size-16 rounded-full ${feature.color} flex items-center justify-center mb-6 shadow-xl`}>
                        {feature.icon}
                    </div>
                    <h5 className="text-lg font-bold mb-3">{feature.title}</h5>
                    <p className="text-sm text-slate-400 leading-relaxed">Top-tier financial servicing with your comfort in mind, every step of the way.</p>
                </div>
            ))}
            </div>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent pointer-events-none" />
      </section>

      {/* Calculator CTA - Engaging and interactive-looking */}
      <section className="py-32 px-6 lg:px-20">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-gradient-to-br from-indigo-600 to-primary p-12 lg:p-20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-white/10 group-hover:scale-110 transition-transform duration-700">
                <Calculator className="size-64 -rotate-12" />
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-1 text-center lg:text-left">
                    <h2 className="text-3xl lg:text-4xl font-black text-white mb-6 leading-tight">Plan Your Future with <br />Smart Calculators</h2>
                    <p className="text-indigo-100 mb-10 leading-relaxed">Know exactly how much your loan costs or how your savings can grow over time. No hidden math.</p>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                        <Link to="/calculators/emi" className="px-6 py-3 bg-white text-primary rounded-xl font-bold hover:bg-slate-50 transition-colors">EMI Calculator</Link>
                        <Link to="/calculators/sip" className="px-6 py-3 bg-white/20 text-white backdrop-blur-md rounded-xl font-bold hover:bg-white/30 transition-colors">SIP Planner</Link>
                    </div>
                </div>
                <div className="w-56 h-56 rounded-full border-8 border-white/10 flex items-center justify-center p-8 bg-indigo-500/20 backdrop-blur-xl">
                    <div className="text-center">
                        <div className="text-xs font-black text-indigo-100 uppercase tracking-widest mb-1">Efficiency</div>
                        <div className="text-4xl font-black text-white">99%</div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* App CTA */}
      <section className="py-32 px-6 lg:px-20 text-center relative overflow-hidden backdrop-blur-3xl">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex size-20 rounded-3xl bg-primary shadow-2xl shadow-primary/40 items-center justify-center text-white mb-10">
            <Smartphone className="size-10" />
          </div>
          <h2 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Financial Freedom is <br />Just a Tap Away.</h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-12">Join over 1 million people who manage their money smarter with PayVit.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto px-10 py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-3xl font-bold text-lg shadow-2xl hover:scale-105 transition-all">Start Your Journey</Link>
            <Link to="/login" className="w-full sm:w-auto px-10 py-5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-3xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Already a member?</Link>
          </div>
        </div>
        {/* Subtle Bottom Grid */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(to_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      </section>
    </div>
  );
}
