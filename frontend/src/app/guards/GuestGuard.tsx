import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuthStore } from "../../store/auth.store"
import { roleRedirect } from "../../utils/roleRedirect"

interface Props {
    children: ReactNode
}

export default function GuestGuard({ children }: Props) {
    const user = useAuthStore((state) => state.user)

    if (user) {
        return <Navigate to={roleRedirect(user.role)} replace />
    }

    return children
}
