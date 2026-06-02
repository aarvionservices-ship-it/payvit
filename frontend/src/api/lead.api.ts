import api from "./axios";
import { encryptPayload } from "../security/encryption";

export async function createLeadRequest(data: any) {
    const payload = encryptPayload(data);
    const res = await api.post("/leads", payload);
    return res.data;
}

export async function getLeadsRequest(params?: any) {
    const res = await api.get("/leads", { params });
    return res.data;
}

export async function getCustLeadsRequest(params?: any) {
    // const res = await api.get("/leads", { params });
    const testData = [
        {
            "customerName": "John Smith",
            "phone": "+1-555-123-4567",
            "email": "john.smith@example.com",
            "city": "New York",
            "uploadDate": "2024-06-01",
            "assignedEmployee": "Sarah Johnson",
            "status": "Active",
            "loanType": "personal",
            "leadId": "100"
        },
        {
            "customerName": "Emma Davis",
            "phone": "+1-555-987-6543",
            "email": "emma.davis@example.com",
            "city": "Los Angeles",
            "uploadDate": "2024-06-01",
            "assignedEmployee": "Michael Chen",
            "status": "Pending",
            "loanType": "personal",
            "leadId": "101"
        },
        {
            "customerName": "John Smith",
            "phone": "+1-555-123-4567",
            "email": "john.smith@example.com",
            "city": "New York",
            "uploadDate": "2024-06-01",
            "assignedEmployee": "Sarah Johnson",
            "status": "Active",
            "loanType": "personal",
            "leadId": "102"
        },
        {
            "customerName": "Emma Davis",
            "phone": "+1-555-987-6543",
            "email": "emma.davis@example.com",
            "city": "Los Angeles",
            "uploadDate": "2024-06-01",
            "assignedEmployee": "Michael Chen",
            "status": "Pending",
            "loanType": "personal",
            "leadId": "103"
        },
        {
            "customerName": "John Smith",
            "phone": "+1-555-123-4567",
            "email": "john.smith@example.com",
            "city": "New York",
            "uploadDate": "2024-06-01",
            "assignedEmployee": "Sarah Johnson",
            "status": "Active",
            "loanType": "personal",
            "leadId": "104"
        },
        {
            "customerName": "Emma Davis",
            "phone": "+1-555-987-6543",
            "email": "emma.davis@example.com",
            "city": "Los Angeles",
            "uploadDate": "2024-06-01",
            "assignedEmployee": "Michael Chen",
            "status": "Pending",
            "loanType": "personal",
            "leadId": "105"
        }
      ]
    return testData;
}

export async function getLeadByIdRequest(id: string) {
    const res = await api.get(`/leads/${id}`);
    return res.data;
}

export async function updateLeadStatusRequest(id: string, data: any) {
    // Check if endpoint accepts encrypted payload. If standard validate middleware is used, probably raw json or decrypted json.
    const payload = encryptPayload(data);
    const res = await api.patch(`/leads/${id}/status`, payload);
    return res.data;
}

export async function assignLeadRequest(id: string, employeeId: string) {
    const res = await api.post(`/leads/${id}/assign`, { employeeId });
    return res.data;
}

export async function bulkAssignLeadsRequest(leadIds: string[], employeeId: string) {
    const res = await api.post("/leads/bulk-assign", { leadIds, employeeId });
    return res.data;
}

export async function requestDocumentRequest(id: string, name: string) {
    const payload = encryptPayload({ name });
    const res = await api.post(`/leads/${id}/request-document`, payload);
    return res.data;
}

export async function uploadRequestedDocumentRequest(id: string, name: string, url: string) {
    const payload = encryptPayload({ name, url });
    const res = await api.post(`/leads/${id}/upload-requested-document`, payload);
    return res.data;
}

export async function updateInitialDocumentRequest(id: string, documentType: string, url: string, name: string) {
    const payload = encryptPayload({ documentType, url, name });
    const res = await api.post(`/leads/${id}/update-initial-document`, payload);
    return res.data;
}

export async function addCommunicationLogRequest(id: string, data: any) {
    const payload = encryptPayload(data);
    const res = await api.post(`/leads/${id}/communication`, payload);
    return res.data;
}

export async function getCommunicationLogsRequest(id: string) {
    const res = await api.get(`/leads/${id}/communication`);
    return res.data;
}

export async function getEmployeeCommunicationLogsRequest() {
    const res = await api.get("/leads/communication/employee");
    return res.data;
}


