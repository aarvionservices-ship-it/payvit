import { 
  Smartphone, 
  Tv, 
  Zap, 
  Droplet, 
  Flame, 
  Plane, 
  Train, 
  Bus,
  ArrowRight,
  ShieldCheck,
  Rocket
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const UTILITY_SERVICES = [
  {
    id: 'mobile',
    name: 'Mobile Recharge',
    description: 'Instant prepaid recharge & postpaid bill payment',
    icon: Smartphone,
    color: 'from-blue-500 to-indigo-600',
    category: 'Bills'
  },
  {
    id: 'dth',
    name: 'DTH Recharge',
    description: 'Recharge your TV subscription in seconds',
    icon: Tv,
    color: 'from-purple-500 to-pink-600',
    category: 'Bills'
  },
  {
    id: 'electricity',
    name: 'Electricity Bill',
    description: 'Pay your electricity bills securely',
    icon: Zap,
    color: 'from-amber-400 to-orange-600',
    category: 'Bills'
  },
  {
    id: 'water',
    name: 'Water Bill',
    description: 'Quick payment for water supply services',
    icon: Droplet,
    color: 'from-cyan-400 to-blue-600',
    category: 'Bills'
  },
  {
    id: 'gas',
    name: 'Gas Bill',
    description: 'Pay for your piped gas or cylinder booking',
    icon: Flame,
    color: 'from-orange-500 to-red-600',
    category: 'Bills'
  },
  {
    id: 'flight',
    name: 'Flight Booking',
    description: 'Domestic and international flight tickets',
    icon: Plane,
    color: 'from-indigo-500 to-blue-700',
    category: 'Travel'
  },
  {
    id: 'train',
    name: 'Train Booking',
    description: 'Reserve your seats for rail travel',
    icon: Train,
    color: 'from-blue-600 to-slate-800',
    category: 'Travel'
  },
  {
    id: 'bus',
    name: 'Bus Booking',
    description: 'Book luxury and local bus tickets',
    icon: Bus,
    color: 'from-emerald-500 to-teal-700',
    category: 'Travel'
  }
];

export default function PublicUtilityPage() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 py-24 px-6 lg:px-20 text-white">
        <div className="absolute top-0 right-0 p-10 opacity-10 blur-3xl pointer-events-none">
           <div className="size-96 rounded-full bg-primary" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center lg:text-left flex flex-col lg:flex-row items-center gap-16">
           <div className="flex-1 space-y-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-primary mb-2"
              >
                <Rocket size={14} className="animate-bounce" />
                Payments Hub v2.0
              </motion.div>
              <h1 className="text-4xl lg:text-7xl font-black italic tracking-tighter leading-none uppercase">
                Pay Bills <br />
                <span className="text-primary italic underline decoration-[15px] decoration-primary/10">Ab Seconds Mein.</span>
              </h1>
              <p className="text-slate-400 text-lg lg:text-xl font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Bharat ke sabse fast payments platform pe aapka swagat hai. Mobile recharge se lekar Flight booking tak, sab kuch yahan hai.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                 <Link to="/register" className="w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-2xl shadow-primary/20">
                   Get Started Now
                 </Link>
                 <Link to="/login" className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">
                   Sign In
                 </Link>
              </div>
           </div>
           <div className="flex-1 relative hidden lg:block">
              <div className="size-[500px] bg-primary/20 rounded-full blur-[120px] absolute -top-20 -right-20 pointer-events-none" />
              <div className="relative group perspective-1000">
                 <motion.div 
                   animate={{ y: [0, -20, 0] }}
                   transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                   className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[4rem] p-12 shadow-3xl transform group-hover:rotate-y-12 transition-transform duration-1000"
                 >
                    <div className="flex items-center gap-6 mb-8">
                       <div className="size-16 rounded-3xl bg-primary flex items-center justify-center text-white shadow-xl">
                          <Smartphone size={32} />
                       </div>
                       <div>
                          <h4 className="text-2xl font-black italic uppercase leading-none">Instant Pay</h4>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">One-tap experience</p>
                       </div>
                    </div>
                    <div className="space-y-6">
                       {[1, 2, 3].map(i => (
                          <div key={i} className="h-14 w-full bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
                       ))}
                    </div>
                 </motion.div>
              </div>
           </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section className="py-24 px-6 lg:px-20 -mt-16 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {UTILITY_SERVICES.map((service, idx) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-900/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity`}>
                   <service.icon size={120} />
                </div>
                
                <div className={`size-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow-lg mb-8 group-hover:scale-110 transition-transform duration-500`}>
                  <service.icon size={32} strokeWidth={2.5} />
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">
                  {service.name}
                </h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">
                  {service.category}
                </p>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                  {service.description}
                </p>

                <Link to="/login" className="w-full py-4 px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10">
                  Try it now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section className="py-24 px-6 lg:px-20 bg-white">
        <div className="max-w-7xl mx-auto text-center">
           <div className="mb-20">
              <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-6 shadow-sm inline-block py-2 px-4 bg-primary/5 rounded-full">Secure Infrastructure</h2>
              <h3 className="text-3xl lg:text-5xl font-black text-slate-900 uppercase italic tracking-tighter">Powered By <br /><span className="text-primary italic">PayVit Trust.</span></h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { title: "Bank-Grade Safety", desc: "Hum use karte hain 256-bit SSL encryption taaki aapka data hamesha safe rahe.", icon: ShieldCheck },
                { title: "Real-time Updates", desc: "Har transaction pe instant notification aur status update payein.", icon: Zap },
                { title: "Universal Payments", desc: "Sabhi major providers aur services ek hi jagah pe integrated hain.", icon: Smartphone }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                   <div className="size-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-primary mb-8 shadow-inner border border-slate-100">
                      <item.icon size={36} />
                   </div>
                   <h4 className="text-xl font-black italic uppercase text-slate-900 mb-4">{item.title}</h4>
                   <p className="text-slate-500 font-medium leading-relaxed max-w-xs">{item.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Footer-styled Closing */}
      <section className="py-24 px-6 lg:px-20 bg-slate-900 text-center relative overflow-hidden">
         <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
         <div className="max-w-3xl mx-auto relative z-10">
            <h4 className="text-3xl lg:text-5xl font-black text-white italic uppercase tracking-tighter mb-10 leading-tight">Ready to make <br />Your first payment?</h4>
            <Link to="/register" className="px-12 py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-2xl">
              Create Free Account
            </Link>
         </div>
      </section>
    </div>
  );
}

