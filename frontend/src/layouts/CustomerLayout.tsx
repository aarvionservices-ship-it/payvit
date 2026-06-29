import { Outlet, NavLink, Link } from "react-router-dom"
import { 
    LayoutDashboard, 
    User, 
    LogOut,
    Zap,
    Wallet
} from "lucide-react"
import { useAuthStore } from "../store/auth.store"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import MobileNav from "../components/MobileNav"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export default function CustomerLayout() {
    const logout = useAuthStore((state) => state.logout)
    const user = useAuthStore((state) => state.user)

    const navItems = [
        { label: "Dashboard", href: "/customer", icon: LayoutDashboard, end: true },
        { label: "Wallet", href: "/customer/wallet", icon: Wallet },
        { label: "Services", href: "/customer/services", icon: Zap },
        { label: "Profile", href: "/customer/profile", icon: User },
    ]

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900">
            {/* Sidebar - Desktop Only */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col z-50">
                <div className="p-6 border-b border-slate-100">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="size-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">
                            A
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">PayVit</h1>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Fast Finance</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <div className="px-3 mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Menu</p>
                    </div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            end={item.end}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                                    isActive 
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-bold" 
                                        : "text-slate-600 hover:bg-slate-50"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={18} className={cn("transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400")} />
                                    <span className="text-sm">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 mt-auto border-t border-slate-100">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all cursor-pointer group"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Navigation */}
            <MobileNav navItems={navItems} />

            {/* Main Content Area */}
            <div className="flex-1 lg:pl-64 flex flex-col min-h-screen h-screen overflow-hidden">
                <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 shrink-0">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="lg:hidden flex items-center gap-2">
                            <div className="size-9 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">
                                A
                            </div>
                            <span className="font-extrabold text-slate-900 tracking-tight text-sm">PayVit</span>
                        </Link>
                        <div className="hidden lg:block">
                            <h2 className="text-xl font-bold text-slate-900 leading-tight">
                                Hello, {user?.name?.split(' ')[0] || 'Customer'}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">Welcome back to your finance hub</p>
                        </div>
                        <div className="lg:hidden h-8 w-[1px] bg-slate-200 mx-1"></div>
                        <div className="lg:hidden">
                            <h2 className="text-sm font-bold text-slate-900 leading-tight">
                                {user?.name?.split(' ')[0] || 'Customer'}
                            </h2>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 lg:gap-6">
                        <div className="h-8 lg:h-10 w-[1px] bg-slate-200 hidden sm:block"></div>
                        <div className="flex items-center gap-2 lg:gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs lg:text-sm font-bold text-slate-900">{user?.name}</p>
                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">ID: {user?.userId?.slice(-6).toUpperCase()}</p>
                            </div>
                            <div className="size-10 lg:size-12 rounded-xl lg:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg shadow-indigo-500/20">
                                <div className="w-full h-full rounded-[10px] lg:rounded-[14px] bg-white flex items-center justify-center text-indigo-600 font-black text-base lg:text-lg overflow-hidden">
                                    {user?.profileImage ? (
                                        <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        user?.name?.[0] || 'C'
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-4 lg:p-8 overflow-auto grow bg-slate-50/50 pb-24 lg:pb-8">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                    
                    <footer className="py-8 mt-auto text-center hidden lg:block">
                        <p className="text-xs text-slate-400 font-medium tracking-wide">
                            &copy; 2024 PayVit FinTech Platform &bull; Secure Financial Services
                        </p>
                    </footer>
                </main>
            </div>
        </div>
    )
}
