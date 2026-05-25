import { NavLink } from "react-router-dom"
import { MoreHorizontal, LogOut, type LucideIcon } from "lucide-react"
import { useState } from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useAuthStore } from "../store/auth.store"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface NavItem {
    label: string
    href: string
    icon: LucideIcon
    end?: boolean
}

interface MobileNavProps {
    navItems: NavItem[]
    activeColor?: string
    activeTextColor?: string
}

export default function MobileNav({ 
    navItems, 
    activeColor = "bg-indigo-600",
    activeTextColor = "text-indigo-600"
}: MobileNavProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const logout = useAuthStore((state) => state.logout)

    // First 3 items for the bar
    const mainItems = navItems.slice(0, 3)
    // Remaining items for the "More" menu
    const remainingItems = navItems.slice(3)

    return (
        <>
            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 lg:hidden z-50 px-4 py-2 flex items-center justify-around shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                {mainItems.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        end={item.end}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center gap-1 p-2 transition-all",
                                isActive ? activeTextColor : "text-slate-500"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={20} className={cn(isActive && "scale-110")} />
                                <span className="text-[10px] font-bold">{item.label}</span>
                                {isActive && (
                                    <div className={cn("size-1 rounded-full mt-0.5", activeColor)} />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}

                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 transition-all",
                        isMenuOpen ? activeTextColor : "text-slate-500"
                    )}
                >
                    <MoreHorizontal size={20} className={cn(isMenuOpen && "scale-110")} />
                    <span className="text-[10px] font-bold">More</span>
                </button>
            </div>

            {/* Overflow Menu Overlay */}
            {isMenuOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45] lg:hidden"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Overflow Menu */}
            <div
                className={cn(
                    "fixed bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 lg:hidden overflow-hidden transition-all duration-300 transform",
                    isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
                )}
            >
                <div className="p-4 space-y-1">
                    <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">More Options</p>
                    {remainingItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                                    isActive 
                                        ? cn(activeColor, "text-white shadow-lg shadow-indigo-500/30") 
                                        : "text-slate-600 hover:bg-slate-50"
                                )
                            }
                        >
                            <item.icon size={18} />
                            <span className="text-sm font-bold">{item.label}</span>
                        </NavLink>
                    ))}
                    
                    <div className="pt-2 mt-2 border-t border-slate-100">
                        <button
                            onClick={() => {
                                setIsMenuOpen(false)
                                logout()
                            }}
                            className="flex items-center gap-3 px-4 py-3 w-full text-left text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                            <LogOut size={18} />
                            <span className="text-sm font-bold">Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

