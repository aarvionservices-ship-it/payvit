import type { ReactNode } from "react"
import { useEffect } from "react"
import { BrowserRouter } from "react-router-dom"
import { HelmetProvider } from "react-helmet-async"

import { restoreSession } from "../api/auth.session"
import { usePublicKeyStore } from "../security/publicKey.store"
import { Toaster } from "react-hot-toast"

interface Props {
    children: ReactNode
}

export default function Providers({ children }: Props) {

    const fetchKey = usePublicKeyStore((s) => s.fetchKey)

    useEffect(() => {
        fetchKey()
        restoreSession()
    }, [])

    return (
        <HelmetProvider>
            <BrowserRouter>
                <Toaster position="top-right" reverseOrder={false} />
                {children}
            </BrowserRouter>
        </HelmetProvider>
    )
}
