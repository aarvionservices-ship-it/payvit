import api from "./axios";
import type { CardModel } from "../types";

export interface CardResponse {
    success: boolean;
    data: {
        data: CardModel[];
        total: number;
        page: number;
        limit: number;
    };
}

export interface SingleCardResponse {
    success: boolean;
    data: CardModel;
}

export const getCards = async (params?: { category?: string; bank?: string; type?: string }): Promise<CardResponse> => {
    const response = await api.get("/cards", { params });
    return response.data;
};

export const getCardById = async (id: string): Promise<SingleCardResponse> => {
    const response = await api.get(`/cards/${id}`);
    return response.data;
};

export const createCard = async (cardData: Partial<CardModel>): Promise<SingleCardResponse> => {
    const response = await api.post("/cards", cardData);
    return response.data;
};

export const updateCard = async (id: string, cardData: Partial<CardModel>): Promise<SingleCardResponse> => {
    const response = await api.put(`/cards/${id}`, cardData);
    return response.data;
};

export const deleteCard = async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/cards/${id}`);
    return response.data;
};

