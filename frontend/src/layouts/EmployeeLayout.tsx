import { Outlet, NavLink, Link } from "react-router-dom"
import { 
    LayoutDashboard, 
    FileText, 
    PhoneCall, 
    BarChart2, 
    User, 
    LogOut 
} from "lucide-react"
import { useAuthStore } from "../store/auth.store"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import MobileNav from "../components/MobileNav"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export default function EmployeeLayout() {
    const logout = useAuthStore((state) => state.logout)
    const user = useAuthStore((state) => state.user)

    const navItems = [
        { label: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
        { label: "Leads", href: "/employee/leads", icon: FileText },
        { label: "History", href: "/employee/call-history", icon: PhoneCall },
        { label: "Performance", href: "/employee/performance", icon: BarChart2 },
        { label: "Profile", href: "/employee/profile", icon: User },
    ]

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900">
            {/* Sidebar - Desktop Only */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white hidden lg:flex flex-col z-50">
                <div className="p-6 border-b border-slate-800 bg-slate-900">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="size-10 bg-emerald-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-emerald-500/20">
                            E
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold text-white tracking-tight">PayVit</h1>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Workspace</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <div className="px-3 mb-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Operations</p>
                    </div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                                    isActive 
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30" 
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )
                            }
                        >
                            <item.icon size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-sm">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 mt-auto border-t border-slate-800">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all cursor-pointer group"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Navigation */}
            <MobileNav navItems={navItems} activeColor="bg-emerald-600" activeTextColor="text-emerald-600" />

            {/* Main Content Area */}
            <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
                <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
                    <div>
                        <h2 className="text-lg lg:text-xl font-bold text-slate-900 leading-tight">
                            Employee Panel
                        </h2>
                        <p className="text-[10px] lg:text-xs text-slate-500 font-medium hidden sm:block">Tracking leads and performance</p>
                    </div>
                    
                    <div className="flex items-center gap-3 lg:gap-6">
                        <div className="h-8 lg:h-10 w-[1px] bg-slate-200 hidden sm:block"></div>
                        <div className="flex items-center gap-2 lg:gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs lg:text-sm font-bold text-slate-900">{user?.name}</p>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{user?.role}</p>
                            </div>
                            <div className="size-10 lg:size-12 rounded-xl lg:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-[2px] shadow-lg shadow-emerald-500/20">
                                <div className="w-full h-full rounded-[10px] lg:rounded-[14px] bg-white flex items-center justify-center text-emerald-600 font-black text-base lg:text-lg overflow-hidden">
                                    {user?.profileImage ? (
                                        <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        user?.name?.[0] || 'E'
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-4 lg:p-8 grow pb-24 lg:pb-8 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
                
                <footer className="px-8 py-6 border-t border-slate-200 text-center hidden lg:block">
                    <p className="text-xs text-slate-400 font-medium">
                        &copy; 2024 PayVit FinTech Platform. All rights reserved.
                    </p>
                </footer>
            </div>
        </div>
    )
}
