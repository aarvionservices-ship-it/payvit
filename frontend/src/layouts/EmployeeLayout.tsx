import { Outlet, NavLink, Link, useLocation } from "react-router-dom"
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
    const location = useLocation()

    const navItems = [
        { label: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
        { label: "Leads", href: "/employee/leads", icon: FileText },
        { label: "History", href: "/employee/call-history", icon: PhoneCall },
        { label: "Performance", href: "/employee/performance", icon: BarChart2 },
        { label: "Profile", href: "/employee/profile", icon: User },
    ]

    const pathnames = location.pathname.split("/").filter((x) => x)

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900">
            {/* Sidebar - Desktop Only */}
            <aside className="fixed inset-y-0 left-0 w-60 bg-[#0E1320] text-white hidden lg:flex flex-col z-50 border-r border-slate-850">
                <div className="p-5 border-b border-slate-850 bg-[#0E1320]">
                    <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                        <div className="size-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
                            E
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white tracking-tight leading-none">PayVit</h1>
                            <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold mt-1">Workspace</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar bg-[#0E1320]">
                    <div className="px-2.5 mb-2">
                        <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Operations</p>
                    </div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors group",
                                    isActive 
                                        ? "bg-white/10 text-white font-medium shadow-none" 
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                )
                            }
                        >
                            <item.icon size={16} className="transition-transform shrink-0" />
                            <span className="text-xs font-semibold">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-3 mt-auto border-t border-slate-850 bg-[#0E1320]">
                    <button
                        onClick={logout}
                        className="flex items-center gap-2.5 px-3 py-2 w-full text-left text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors cursor-pointer group"
                    >
                        <LogOut size={16} className="transition-transform" />
                        <span className="text-xs font-semibold">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Navigation */}
            <MobileNav navItems={navItems} activeColor="bg-emerald-600" activeTextColor="text-emerald-600" />

            {/* Main Content Area */}
            <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
                <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="lg:hidden flex items-center gap-2">
                            <div className="size-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
                                E
                            </div>
                            <span className="font-bold text-slate-900 tracking-tight text-sm">PayVit</span>
                        </Link>

                        {/* Dynamic Breadcrumbs - Stripe style */}
                        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            {pathnames.map((name, index) => {
                                const isLast = index === pathnames.length - 1;
                                const displayName = name.charAt(0).toUpperCase() + name.slice(1);
                                return (
                                    <div key={name} className="flex items-center gap-1.5">
                                        {index > 0 && <span className="text-slate-350">/</span>}
                                        <span className={isLast ? "text-slate-900 font-semibold" : "text-slate-450 hover:text-slate-600"}>
                                            {displayName}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-slate-900 leading-none">{user?.name}</p>
                                <p className="text-[10px] font-semibold text-emerald-600 uppercase mt-0.5">{user?.role}</p>
                            </div>
                            <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-[1px] shadow-sm">
                                <div className="w-full h-full rounded-[7px] bg-white flex items-center justify-center text-emerald-600 font-bold text-xs overflow-hidden">
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

                <main className="p-4 lg:p-6 grow overflow-x-hidden overflow-y-auto pb-20 lg:pb-6">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
                
                <footer className="px-6 py-4 border-t border-slate-100 text-center hidden lg:block bg-white">
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                        &copy; 2026 PayVit FinTech Platform. All rights reserved.
                    </p>
                </footer>
            </div>
        </div>
    )
}
