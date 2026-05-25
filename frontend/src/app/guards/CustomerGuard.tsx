import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuthStore } from "../../store/auth.store"

interface Props {
    children: ReactNode
}

export default function CustomerGuard({ children }: Props) {
    const user = useAuthStore((state) => state.user)
    const location = useLocation()

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (user.role !== "customer") {
        return <Navigate to="/unauthorized" replace />
    }

    // CHECK PROFILE COMPLETION
    if (!user.isProfileComplete && location.pathname !== "/customer/complete-profile") {
        return <Navigate to="/customer/complete-profile" replace />
    }

    if (user.isProfileComplete && location.pathname === "/customer/complete-profile") {
        return <Navigate to="/customer" replace />
    }

    return children
}
