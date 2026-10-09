import React, { useState } from 'react';
import { 
  Lock, CheckCircle2, Circle, ArrowUpRight, Send, 
  Download, Plus, Home, Plane, Zap, Tv, Car, 
  ChevronRight, Sparkles, Info
} from 'lucide-react';

const DashboardContent: React.FC = () => {
  // Toggle state for demonstration purposes
  const [isWalletActive, setIsWalletActive] = useState<boolean>(false);

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Demo Toggle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hello, Alex Rivera</h1>
          <p className="text-slate-500 mt-1">Welcome back to your finance hub. Action required for full access.</p>
        </div>
        
        {/* Toggle Button for Dev Testing */}
        <button 
          onClick={() => setIsWalletActive(!isWalletActive)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          Simulate: {isWalletActive ? 'Wallet Inactive' : 'Wallet Active'}
        </button>
      </div>

     
      <section>
        {isWalletActive ? (
          /* ACTIVE STATE: Balance Card + Small Goals */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Blue Wallet Component */}
            <div className="lg:col-span-2 rounded-[2rem] bg-blue-600 p-8 text-white shadow-xl shadow-blue-100 flex flex-col justify-between min-h-[280px]">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-100 text-sm font-medium tracking-wide">TOTAL BALANCE</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h2 className="text-4xl md:text-5xl font-bold tracking-tight">$48,250.00</h2>
                      <span className="text-blue-200 font-medium">USD</span>
                    </div>
                    <p className="flex items-center gap-1 text-blue-100 text-sm mt-2 font-medium">
                      <ArrowUpRight size={16} /> +12.4% from last month
                    </p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 md:gap-4 mt-8">
                <button className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 px-2 font-semibold text-blue-600 hover:bg-blue-50 transition-all text-sm md:text-base">
                  <Send size={18} /> Send
                </button>
                <button className="flex items-center justify-center gap-2 rounded-xl bg-white/20 py-3 px-2 font-semibold text-white hover:bg-white/30 transition-all backdrop-blur-sm border border-white/10 text-sm md:text-base">
                  <Download size={18} /> Request
                </button>
                <button className="flex items-center justify-center gap-2 rounded-xl bg-white/20 py-3 px-2 font-semibold text-white hover:bg-white/30 transition-all backdrop-blur-sm border border-white/10 text-sm md:text-base">
                  <div className="grid grid-cols-2 gap-0.5"><div className="w-1.5 h-1.5 border border-white" /><div className="w-1.5 h-1.5 border border-white" /><div className="w-1.5 h-1.5 border border-white" /><div className="w-1.5 h-1.5 border border-white" /></div> Pay
                </button>
              </div>
            </div>

            {/* Savings Goals Sidebar*/}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 text-lg">Savings Goals</h3>
                <button className="text-blue-600 text-sm font-semibold hover:underline">Edit</button>
              </div>
              <div className="space-y-6 flex-1">
                <MiniGoalItem label="New Car Fund" current={12000} target={25000} color="bg-blue-600" />
                <MiniGoalItem label="Travel Budget" current={3500} target={5000} color="bg-emerald-500" />
              </div>
              <button className="mt-6 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all">
                <Plus size={18} /> Create New Goal
              </button>
            </div>
          </div>
        ) : (
          /* INACTIVE STATE: KYC Banner */
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
            <div className="flex-1 space-y-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-50 p-2.5 text-red-500">
                  <Lock size={28} />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">Wallet Inactive</h2>
              </div>
              <p className="max-w-xl text-slate-500 text-lg leading-relaxed">
                To ensure the security of your funds and comply with financial regulations, please complete your identity verification (KYC). Verification usually takes less than 2 minutes.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 font-bold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                  <CheckCircle2 size={18} /> Complete KYC Now
                </button>
                <button className="rounded-xl border border-slate-200 px-8 py-3.5 font-bold text-slate-700 hover:bg-slate-50 transition-all">
                  Learn Why
                </button>
              </div>
            </div>

            {/* Profile Setup Circle Container */}
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-100 bg-slate-50/50 p-8 min-w-[280px]">
              <div className="relative flex h-28 w-28 items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="h-full w-full -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-200" />
                  <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="301.5" strokeDashoffset={301.5 * (1 - 0.25)} className="text-blue-600" />
                </svg>
                <span className="absolute text-2xl font-black text-slate-800 tracking-tighter">25%</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Profile Setup</p>
              <ul className="w-full space-y-3 mt-2">
                <li className="flex items-center gap-3 text-blue-600 font-bold text-sm">
                  <CheckCircle2 size={16} /> Email Verified
                </li>
                <li className="flex items-center gap-3 text-slate-400 font-medium text-sm">
                  <Circle size={16} /> Identity Document
                </li>
                <li className="flex items-center gap-3 text-slate-400 font-medium text-sm">
                  <Circle size={16} /> Facial Recognition
                </li>
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* --- SECOND ROW: GOALS & BILLS ---*/}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Goals and AI Box */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-[2rem] bg-white border border-slate-200 p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-xl text-slate-900">Financial Goals</h3>
              <button className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:underline">New Goal <Plus size={18}/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GoalCard icon={<Home size={22}/>} title="New Apartment" target="$45,000" saved="$29,250" progress={65} color="emerald" tag="On Track" />
              <GoalCard icon={<Plane size={22}/>} title="Euro Summer 2025" target="$8,000" saved="$2,400" progress={30} color="blue" tag="Active" />
            </div>
          </div>

          {/* AI Optimization Card */}
          <div className="relative overflow-hidden rounded-[2rem] border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <div className="absolute top-4 right-4 text-slate-100"><Sparkles size={120} /></div>
            <div className="relative z-10">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <Sparkles size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Optimize your savings</h3>
              <p className="text-slate-500 mt-2 max-w-md mx-auto">Our AI can help you reach goals 15% faster by analyzing your spending habits.</p>
              <button className="mt-6 rounded-xl border border-slate-300 px-8 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">
                Connect Bank Accounts
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Bills Sidebar */}
        <aside className="rounded-[2rem] bg-white border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl text-slate-900">Upcoming Bills</h3>
            <button className="text-slate-300"><Info size={20}/></button>
          </div>

          <div className="space-y-1">
            <BillRow icon={<Zap size={18} className="text-orange-500"/>} name="GridPower Co." date="Due in 2 days" price="$142.50" status="PENDING" statusColor="red" />
            <BillRow icon={<Tv size={18} className="text-indigo-500"/>} name="Netflix Subscription" date="Due in 5 days" price="$19.99" status="AUTOPAY" statusColor="blue" />
            <BillRow icon={<Car size={18} className="text-emerald-500"/>} name="Auto Insurance" date="Due in 8 days" price="$285.00" status="SCHEDULED" statusColor="slate" />
            <BillRow icon={<ChevronRight size={18} className="text-slate-400"/>} name="Fiber Broadband" date="Due in 12 days" price="$75.00" status="UPCOMING" statusColor="slate" />
          </div>

          <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-4 text-sm font-bold text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all">
            <Plus size={18}/> Link New Service
          </button>

          {/* Smart Tip Card */}
          <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">i</div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">Smart Spending Tip</span>
            </div>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              You could save <span className="text-blue-700 font-bold">$42/month</span> by switching your internet provider. Want to see local offers?
            </p>
            <button className="mt-3 text-blue-600 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all">
              Explore Offers <ChevronRight size={14}/>
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
};

/* --- SUB-COMPONENTS --- */

const MiniGoalItem = ({ label, current, target, color }: any) => {
  const percent = Math.min(100, (current / target) * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-400 font-medium">${current.toLocaleString()} / <span className="text-slate-800">${target.toLocaleString()}</span></span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

const GoalCard = ({ icon, title, target, saved, progress, color, tag }: any) => {
  const colorMap: any = {
    emerald: "bg-emerald-100 text-emerald-600 ring-emerald-50 text-emerald-500",
    blue: "bg-blue-100 text-blue-600 ring-blue-50 text-blue-500"
  };
  return (
    <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-5">
        <div className={`p-3 rounded-xl ${colorMap[color].split(' ')[0]} ${colorMap[color].split(' ')[1]}`}>{icon}</div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${colorMap[color].split(' ')[2]} ${colorMap[color].split(' ')[1]}`}>{tag}</span>
      </div>
      <h4 className="font-bold text-slate-900">{title}</h4>
      <p className="text-xs text-slate-400 mb-5 font-medium">Target: {target}</p>
      <div className="flex justify-between text-xs font-black mb-2">
        <span className="text-slate-700">{saved} Saved</span>
        <span className="text-slate-400">{progress}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[color].split(' ')[3]} transition-all duration-1000`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

const BillRow = ({ icon, name, date, price, status, statusColor }: any) => {
  const colorMap: any = {
    red: "text-red-600 bg-red-50",
    blue: "text-blue-600 bg-blue-50",
    slate: "text-slate-500 bg-slate-50"
  };
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">{icon}</div>
        <div>
          <p className="text-sm font-bold text-slate-800">{name}</p>
          <p className="text-xs text-slate-400 font-medium">{date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-slate-900">{price}</p>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${colorMap[statusColor]}`}>{status}</span>
      </div>
    </div>
  );
};

export default DashboardContent;