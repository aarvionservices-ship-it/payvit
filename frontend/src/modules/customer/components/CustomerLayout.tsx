// modules/customer/components/CustomerLayout.tsx
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Heart, 
  FileText, 
  UserCircle, 
  Bell,
  Search,
  MoreHorizontal
} from 'lucide-react';

export default function CustomerLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/customer', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/customer/offers', icon: Briefcase, label: 'Browse Offers' },
    { path: '/customer/favorites', icon: Heart, label: 'Saved Offers' },
    { path: '/customer/applications', icon: FileText, label: 'My Applications' },
    { path: '/customer/profile', icon: UserCircle, label: 'Profile' },
  ];

  const bottomNavItems = [
    { path: '/customer', icon: LayoutDashboard, label: 'Home' },
    { path: '/customer/offers', icon: Briefcase, label: 'Offers' },
    { path: '/customer/applications', icon: FileText, label: 'Applied' },
    { path: '/customer/profile', icon: UserCircle, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            A
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">PayVit</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                            (item.path !== '/customer' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`size-5 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
              MK
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">Meera Kumar</p>
              <p className="text-xs text-slate-500 truncate">Customer</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-64 pb-16 md:pb-0 min-h-screen">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3 md:hidden">
              <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                A
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">PayVit</span>
            </div>

            <div className="hidden md:flex items-center max-w-md w-full ml-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search offers..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors relative">
                <Bell className="size-5" />
                <span className="absolute top-1.5 right-1.5 size-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-x-hidden">
          <Outlet />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path || 
                            (item.path !== '/customer' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-16 h-12 gap-1 ${
                  isActive ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                <item.icon className={`size-5 ${isActive ? 'fill-blue-50' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {/* More Menu Trigger */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center justify-center w-16 h-12 gap-1 ${
              isMobileMenuOpen ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <MoreHorizontal className="size-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile More Menu Dropdown/Modal */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="absolute bottom-16 right-4 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <Link to="/customer/favorites" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Heart className="size-4 text-slate-400" /> Saved Offers
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

