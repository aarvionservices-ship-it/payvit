import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuthStore } from "../../store/auth.store"

interface Props {
    children: ReactNode
}

export default function EmployeeGuard({ children }: Props) {
    const user = useAuthStore((state) => state.user)

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (user.role !== "employee") {
        return <Navigate to="/unauthorized" replace />
    }

    return children
}
