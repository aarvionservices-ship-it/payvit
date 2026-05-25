import api from "./axios"
import { useAuthStore } from "../store/auth.store"

export async function restoreSession() {
    const store = useAuthStore.getState()

    try {
        const token = localStorage.getItem("accessToken")

        if (!token) {
            store.setAuthReady()
            return
        }

        const res = await api.get("/auth/me")

        store.setUser(res.data.data)

    } catch {
        store.logout()
    } finally {
        store.setAuthReady()
    }
}
