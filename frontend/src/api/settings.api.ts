import api from "./axios";

export const getSettings = async () => {
    const response = await api.get("/settings");
    return response.data;
};

export const updateSettings = async (settingsData: any) => {
    const response = await api.put("/settings", settingsData);
    return response.data;
};

