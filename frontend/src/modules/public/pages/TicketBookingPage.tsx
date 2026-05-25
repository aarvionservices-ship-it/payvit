import { 
  Plane, 
  Train, 
  Bus,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  MapPin,
  Rocket,
  Compass
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { SEO } from '../../../components/shared/SEO';

const TICKET_SERVICES = [
  {
    id: 'flight',
    name: 'Flight Booking',
    description: 'Domestic and international flight tickets at lowest prices',
    icon: Plane,
    color: 'from-blue-500 to-indigo-600',
    category: 'AIR TRAVEL'
  },
  {
    id: 'train',
    name: 'Train Tickets',
    description: 'Reserve your seats with instant seat availability status',
    icon: Train,
    color: 'from-blue-600 to-slate-800',
    category: 'RAIL TRAVEL'
  },
  {
    id: 'bus',
    name: 'Bus Tickets',
    description: 'Book AC, Non-AC & luxury buses across all routes',
    icon: Bus,
    color: 'from-emerald-500 to-teal-700',
    category: 'ROAD TRAVEL'
  }
];

export default function TicketBookingPage() {
  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-slate-950">
      <SEO 
        title="Travel & Ticket Booking - Best Deals"
        description="Book flights, trains, and bus tickets online with PayVit. Get exclusive travel offers and easy cancellations."
      />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 py-32 px-6 lg:px-20 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
              <Compass size={14} className="animate-spin-slow" />
              Your Travel Companion
            </div>
            <h1 className="text-5xl lg:text-8xl font-black italic tracking-tighter leading-[0.85] uppercase">
              Book <br />
              <span className="text-primary">Travel.</span>
            </h1>
            <p className="text-slate-400 text-lg lg:text-xl font-medium max-w-xl leading-relaxed">
              Duniya dekho bina tension ke. Flights, Trains, aur Buses - sab ek hi jagah pe, sabse kam daam mein.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
               <Link to="/register" className="w-full sm:w-auto px-12 py-6 bg-primary text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-2xl shadow-primary/20">
                 Explore Routes
               </Link>
            </div>
          </div>
          
          <div className="relative hidden lg:block">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[4rem] p-12 pr-4 shadow-3xl">
               <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 bg-primary/10 border border-primary/20 rounded-[2.5rem]">
                     <Plane size={32} className="text-primary mb-4" />
                     <h4 className="text-xl font-black italic uppercase italic">Fast</h4>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Air Travel</p>
                  </div>
                  <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] -translate-y-8">
                     <Train size={32} className="text-emerald-500 mb-4" />
                     <h4 className="text-xl font-black italic uppercase italic">Direct</h4>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Railways</p>
                  </div>
                  <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-[2.5rem]">
                     <Bus size={32} className="text-amber-500 mb-4" />
                     <h4 className="text-xl font-black italic uppercase italic">Easy</h4>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Roadways</p>
                  </div>
                  <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] -translate-y-8">
                     <MapPin size={32} className="text-rose-500 mb-4" />
                     <h4 className="text-xl font-black italic uppercase italic">Local</h4>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Transit</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-32 px-6 lg:px-20 max-w-7xl mx-auto">
        <div className="mb-20">
          <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-4">Discovery Center</h2>
          <h3 className="text-4xl lg:text-7xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Where To <br />Next?</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TICKET_SERVICES.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-2xl transition-all duration-500"
            >
              <div className={`size-20 rounded-3xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow-xl mb-10 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500`}>
                <service.icon size={40} strokeWidth={2} />
              </div>

              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase italic tracking-tighter leading-none">
                {service.name}
              </h3>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">
                {service.category}
              </p>
              <p className="text-base text-slate-500 font-bold leading-relaxed mb-10">
                {service.description}
              </p>

              <Link to="/login" className="w-full py-5 px-8 bg-slate-900 dark:bg-slate-800 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 hover:bg-primary shadow-xl">
                Book Ticket <ArrowRight size={16} className="group-hover:translate-x-3 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Safety Section */}
      <section className="py-32 px-6 lg:px-20 bg-slate-100/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
           <div className="flex items-center gap-6">
              <div className="size-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500 shadow-xl border border-slate-100 dark:border-white/5">
                 <ShieldCheck size={32} />
              </div>
              <div>
                 <h5 className="text-xl font-black uppercase italic italic">Safe Bookings</h5>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">100% Secure Payments</p>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="size-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-blue-500 shadow-xl border border-slate-100 dark:border-white/5">
                 <Rocket size={32} />
              </div>
              <div>
                 <h5 className="text-xl font-black uppercase italic italic">Fast Cancellations</h5>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Instant Refunds</p>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="size-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-amber-500 shadow-xl border border-slate-100 dark:border-white/5">
                 <Smartphone size={32} />
              </div>
              <div>
                 <h5 className="text-xl font-black uppercase italic italic">24/7 Support</h5>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Always here to help</p>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}

