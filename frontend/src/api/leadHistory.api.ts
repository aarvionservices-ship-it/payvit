import api from "./axios";

export async function getLeadHistoryRequest(leadId: string) {
    const res = await api.get(`/lead-history/${leadId}`);
    return res.data;
}

