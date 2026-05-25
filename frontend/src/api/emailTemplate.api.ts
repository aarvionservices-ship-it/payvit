import api from './axios';
import { encryptPayload } from "../security/encryption";

export const emailTemplateApi = {
    getAll: async () => {
        const response = await api.get('/email-templates');
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/email-templates/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const payload = encryptPayload(data);
        const response = await api.post('/email-templates', payload);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const payload = encryptPayload(data);
        const response = await api.put(`/email-templates/${id}`, payload);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/email-templates/${id}`);
        return response.data;
    },
    test: async (id: string, email: string, testData: any) => {
        const payload = encryptPayload({ id, email, testData });
        const response = await api.post(`/email-templates/test`, payload);
        return response.data;
    }
};

