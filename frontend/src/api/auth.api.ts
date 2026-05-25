import api from "./axios"
import { encryptPayload } from "../security/encryption"

interface LoginPayload {
    email: string
    password: string
}

interface RegisterPayload {
    name: string
    email: string
    phone: string
    password: string
}

export async function loginRequest(data: LoginPayload) {
    const payload = encryptPayload(data)

    const res = await api.post("/auth/login", payload)

    return res.data
}

export async function registerRequest(data: RegisterPayload) {
    const payload = encryptPayload(data)

    const res = await api.post("/auth/register", payload)

    return res.data
}

export async function logoutRequest(refreshToken: string) {
    const res = await api.post("/auth/logout", {
        refreshToken
    })

    return res.data
}

export async function refreshTokenRequest(refreshToken: string) {
    const res = await api.post("/auth/refresh", {
        refreshToken
    })

    return res.data
}

export async function getCurrentUser() {
    const res = await api.get("/auth/me")

    return res.data
}

export async function getPublicKey() {
    const res = await api.get("/auth/public-key")

    return res.data
}

export async function forgotPasswordRequest(email: string) {
    const payload = encryptPayload({ email })
    const res = await api.post("/auth/forgot-password", payload)
    return res.data
}

export async function validateResetTokenRequest(userId: string, token: string) {
    const res = await api.get(`/auth/validate-reset-token?userId=${userId}&token=${token}`)
    return res.data
}

export async function resetPasswordRequest(data: any) {
    const payload = encryptPayload(data)
    const res = await api.post("/auth/reset-password", payload)
    return res.data
}
