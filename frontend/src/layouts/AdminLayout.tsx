import { Outlet, NavLink, Link } from "react-router-dom"
import {
    LayoutDashboard,
    Users,
    UserCheck,
    Landmark,
    Settings,
    CreditCard,
    User,
    LogOut,
    TrendingUp,
    FileText,
    Newspaper,
    Mail
} from "lucide-react"
import { useAuthStore } from "../store/auth.store"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import MobileNav from "../components/MobileNav"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export default function AdminLayout() {
    const logout = useAuthStore((state) => state.logout)
    const user = useAuthStore((state) => state.user)

    const navItems = [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Cards", href: "/admin/cards", icon: CreditCard },
        { label: "Analytics", href: "/admin/analytics", icon: TrendingUp },
        { label: "Employees", href: "/admin/employees", icon: Users },
        { label: "Customers", href: "/admin/customers", icon: UserCheck },
        { label: "Leads", href: "/admin/leads", icon: FileText },
        { label: "Blogs", href: "/admin/blogs", icon: Newspaper },
        { label: "Loans", href: "/admin/loans", icon: Landmark },
        { label: "Emails", href: "/admin/email-templates", icon: Mail },
        { label: "Profile", href: "/admin/profile", icon: User },
        { label: "Settings", href: "/admin/settings", icon: Settings },
    ]

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900">
            {/* Sidebar - Desktop Only */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white hidden lg:flex flex-col z-50">
                <div className="p-6 border-b border-slate-800 bg-slate-900">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">
                            A
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold text-white tracking-tight">PayVit</h1>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Admin Panel</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <div className="px-3 mb-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Navigation</p>
                    </div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
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
            <MobileNav navItems={navItems} activeColor="bg-blue-600" activeTextColor="text-blue-600" />

            {/* Main Content Area */}
            <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
                <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="lg:hidden flex items-center gap-2">
                            <div className="size-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">
                                A
                            </div>
                            <span className="font-extrabold text-slate-900 tracking-tight text-sm">PayVit</span>
                        </Link>
                        <div className="hidden lg:block">
                            <h2 className="text-xl font-bold text-slate-900 leading-tight">
                                System Overview
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">Welcome back, Managing the platform</p>
                        </div>
                        <div className="lg:hidden h-8 w-[1px] bg-slate-200 mx-1"></div>
                        <div className="lg:hidden">
                            <h2 className="text-sm font-bold text-slate-900 leading-tight">
                                Console
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-6">
                        <div className="h-8 lg:h-10 w-[1px] bg-slate-200 hidden sm:block"></div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs lg:text-sm font-bold text-slate-900">{user?.name}</p>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{user?.role}</p>
                            </div>
                            <div className="size-10 lg:size-12 rounded-xl lg:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shadow-lg shadow-blue-500/20">
                                <div className="w-full h-full rounded-[10px] lg:rounded-[14px] bg-white flex items-center justify-center text-blue-600 font-black text-base lg:text-lg overflow-hidden">
                                    {user?.profileImage ? (
                                        <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        user?.name?.[0] || 'A'
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-2 sm:p-4 lg:p-8 grow overflow-x-hidden overflow-y-auto pb-24 lg:pb-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
