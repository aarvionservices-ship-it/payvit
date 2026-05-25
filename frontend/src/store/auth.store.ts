import { create } from "zustand"

interface User {
    userId: string
    name: string
    email: string
    role: "admin" | "employee" | "customer"
    profileImage?: string
    favoriteOffers?: string[]
    isProfileComplete: boolean
}

interface AuthState {
    accessToken: string | null
    refreshToken: string | null
    user: User | null

    authReady: boolean

    login: (data: {
        accessToken: string
        refreshToken: string
        user: User
    }) => void

    logout: () => void

    setUser: (user: User) => void

    setTokens: (accessToken: string, refreshToken: string) => void

    setAuthReady: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
    user: null,

    authReady: false,

    login: ({ accessToken, refreshToken, user }) => {
        localStorage.setItem("accessToken", accessToken)
        localStorage.setItem("refreshToken", refreshToken)

        set({
            accessToken,
            refreshToken,
            user
        })
    },

    logout: () => {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")

        set({
            accessToken: null,
            refreshToken: null,
            user: null
        })
    },

    setUser: (user) => set({ user }),

    setTokens: (accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken)
        localStorage.setItem("refreshToken", refreshToken)
        set({ accessToken, refreshToken })
    },

    setAuthReady: () => set({ authReady: true })
}))
