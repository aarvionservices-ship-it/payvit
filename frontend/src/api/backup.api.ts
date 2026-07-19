import api from "./axios";

export const exportBackup = async () => {
    const response = await api.get("/backup/export", {
        responseType: "blob"
    });
    return response.data;
};

export const restoreBackup = async (fileData: string) => {
    const response = await api.post("/backup/restore", { fileData });
    return response.data;
};

export const getCleanupPreview = async (statuses: string[]) => {
    const response = await api.post("/backup/cleanup-preview", { statuses });
    return response.data;
};

export const executeCleanup = async (statuses: string[]) => {
    const response = await api.post("/backup/cleanup", { statuses });
    return response.data;
};
