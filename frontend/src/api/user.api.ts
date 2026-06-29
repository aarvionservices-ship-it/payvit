import api from "./axios"

export async function updateProfileRequest(data: any) {
    const res = await api.put("/users/profile", data)
    return res.data
}

export async function getProfileRequest() {
    const res = await api.get("/users/profile")
    return res.data
}

export async function getUsersRequest(params: any) {
    const res = await api.get("/users", { params })
    return res.data
}

export async function createCustomerRequest(data: any) {
    const res = await api.post("/users/create-customer", data)
    return res.data
}

export async function getUserByIdRequest(id: string) {
    const res = await api.get(`/users/${id}`)
    return res.data
}

