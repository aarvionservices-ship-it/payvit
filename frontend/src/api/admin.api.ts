import api from "./axios";
import { encryptPayload } from "../security/encryption";

export async function createEmployeeRequest(data: any) {
    const payload = encryptPayload(data);
    const res = await api.post("/admin/employees", payload);
    return res.data;
}

export async function getEmployeesRequest(params?: any) {
    const res = await api.get("/admin/employees", { params });
    return res.data;
}

export async function getEmployeeByIdRequest(id: string) {
    const res = await api.get(`/admin/employees/${id}`);
    return res.data;
}

export async function updateEmployeeRequest(id: string, data: any) {
    const payload = encryptPayload(data);
    const res = await api.put(`/admin/employees/${id}`, payload);
    return res.data;
}

export async function resetEmployeePasswordRequest(id: string, password: any) {
    const payload = encryptPayload({ password });
    const res = await api.patch(`/admin/employees/${id}/password`, payload);
    return res.data;
}

export async function getAdminDashboardRequest() {
    const res = await api.get("/admin/dashboard");
    return res.data;
}

export async function getAnalyticsRequest(params?: { days: number }) {
    const res = await api.get("/admin/analytics", { params });
    return res.data;
}

