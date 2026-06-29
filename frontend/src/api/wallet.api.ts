import api from "./axios"

export async function getWalletRequest(params?: any) {
    const res = await api.get("/wallet", { params })
    return res.data
}

export async function addMoneyRequest(amount: number) {
    const res = await api.post("/wallet/add-money", { amount })
    return res.data
}

export async function transferTokensRequest(data: { recipient: string; amount: number; description?: string }) {
    const res = await api.post("/wallet/transfer", data)
    return res.data
}

export async function searchUserRequest(query: string) {
    const res = await api.get("/wallet/search-user", { params: { query } })
    return res.data
}
