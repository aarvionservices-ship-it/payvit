import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuthStore } from "../../store/auth.store"

export default function AuthGuard({ children }: { children: ReactNode }) {
    const location = useLocation()
    const { accessToken, authReady } = useAuthStore()

    if (!authReady) return null

    if (!accessToken) {
        if (location.pathname.startsWith("/admin")) {
            return <Navigate to={`/admin/login?redirect=${location.pathname}`} replace />
        }
        if (location.pathname.startsWith("/employee")) {
            return <Navigate to={`/employee/login?redirect=${location.pathname}`} replace />
        }
        return <Navigate to={`/login?redirect=${location.pathname}`} replace />
    }

    return children
}
