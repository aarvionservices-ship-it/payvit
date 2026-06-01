import { create } from "zustand"
import api from "../api/axios"

interface PublicKeyState {
    publicKey: string | null
    fetchKey: () => Promise<void>
}

export const usePublicKeyStore = create<PublicKeyState>((set) => ({
    publicKey: null,

    fetchKey: async () => {
        try {
            const res = await api.get("/auth/public-key")

            if (res?.data?.success && res?.data?.data?.publicKey) {
                set({
                    publicKey: res.data.data.publicKey
                })
            } else {
                console.error("Invalid public key response format:", res?.data)
            }
        } catch (error) {
            console.error("Failed to fetch public key:", error)
        }
    }
}))
