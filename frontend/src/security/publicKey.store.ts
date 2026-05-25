import { create } from "zustand"
import api from "../api/axios"

interface PublicKeyState {
    publicKey: string | null
    fetchKey: () => Promise<void>
}

export const usePublicKeyStore = create<PublicKeyState>((set) => ({
    publicKey: null,

    fetchKey: async () => {
        const res = await api.get("/auth/public-key")

        set({
            publicKey: res.data.data.publicKey
        })
    }
}))
