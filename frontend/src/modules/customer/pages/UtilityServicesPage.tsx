import { useState } from 'react';
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
  ZapIcon
} from 'lucide-react';
import { motion } from 'motion/react';

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

export default function UtilityServicesPage() {
  const [activeTab, setActiveTab] = useState<'All' | 'Bills' | 'Travel'>('All');

  const filteredServices = UTILITY_SERVICES.filter(service => 
    activeTab === 'All' || service.category === activeTab
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 lg:p-12 text-white shadow-2xl shadow-slate-900/40">
        <div className="absolute top-0 right-0 p-8 opacity-10">
            <ZapIcon size={200} className="text-white animate-pulse" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider mb-6 border border-white/10">
            <ShieldCheck size={14} className="text-emerald-400" />
            Secure Utility Hub
          </div>
          <h1 className="text-3xl lg:text-5xl font-black tracking-tight mb-4 leading-tight">
            Seamless <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Payments & Bookings</span>
          </h1>
          <p className="text-slate-400 text-sm lg:text-base font-medium leading-relaxed">
            One-stop destination for all your utility bills and travel needs. Experience the fastest and most secure financial services with PayVit.
          </p>
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm w-fit">
        {['All', 'Bills', 'Travel'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredServices.map((service, idx) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${service.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            
            <div className={`size-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 mb-6 group-hover:scale-110 transition-transform duration-500`}>
              <service.icon size={32} strokeWidth={2.5} />
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
              {service.name}
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 leading-relaxed">
              {service.category}
            </p>
            <p className="text-xs text-slate-500 font-medium mb-8 flex-1 leading-relaxed px-2">
              {service.description}
            </p>

            <button className="w-full py-3 px-4 bg-slate-50 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-indigo-600/20">
              Proceed <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Safety Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="size-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h4 className="text-lg font-extrabold text-slate-900 leading-tight">100% Encrypted Payments</h4>
            <p className="text-sm text-slate-500 font-medium mt-1">Your data and transactions are protected by bank-grade 256-bit SSL encryption.</p>
          </div>
        </div>
        <div className="flex -space-x-3">
          {[1,2,3,4].map(i => (
             <div key={i} className="size-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                <img src={`https://i.pravatar.cc/150?u=${i+10}`} alt="User" />
             </div>
          ))}
          <div className="size-10 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
            +5k
          </div>
        </div>
      </div>
    </div>
  );
}

