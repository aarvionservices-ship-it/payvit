import axios from "axios"
import { useAuthStore } from "../store/auth.store"

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
    withCredentials: true
})

/* ---------------- REQUEST INTERCEPTOR ---------------- */

api.interceptors.request.use((config) => {

    const token = useAuthStore.getState().accessToken

    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})


/* ---------------- RESPONSE INTERCEPTOR ---------------- */

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })

    failedQueue = []
}

api.interceptors.response.use(

    (response) => response,

    async (error) => {

        const originalRequest = error.config
        const store = useAuthStore.getState()

        /* ---------- TOKEN EXPIRED ---------- */

        if (error.response?.status === 401 && !originalRequest._retry) {

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {

                    failedQueue.push({ resolve, reject })

                }).then((token) => {

                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = "Bearer " + token
                    }

                    return api(originalRequest)

                }).catch(err => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true

            try {

                const refreshToken = store.refreshToken

                const res = await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh`,
                    { refreshToken }
                )

                const { accessToken, refreshToken: newRefresh } = res.data.data

                store.setTokens(accessToken, newRefresh)

                processQueue(null, accessToken)

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`
                }

                return api(originalRequest)

            } catch (err) {

                processQueue(err, null)

                store.logout()

                const path = window.location.pathname
                if (path.startsWith("/admin")) {
                    window.location.href = "/admin/login"
                } else if (path.startsWith("/employee")) {
                    window.location.href = "/employee/login"
                } else {
                    window.location.href = "/login"
                }

                return Promise.reject(err)

            } finally {

                isRefreshing = false
            }
        }

        /* ---------- FORBIDDEN ---------- */

        if (error.response?.status === 403) {
            window.location.href = "/unauthorized"
        }

        /* ---------- NETWORK ERROR ---------- */

        // if (!error.response) {
        //     window.location.href = "/offline"
        // }

        return Promise.reject(error)
    }
)

export default api
