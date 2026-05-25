import api from "./axios";

export const getLoans = async (params = {}) => {
  const response = await api.get("/loans", { params });
  return response.data;
};

export const getLoanById = async (id: string) => {
  const response = await api.get(`/loans/${id}`);
  return response.data;
};

export const createLoan = async (loanData: any) => {
  const response = await api.post("/loans", loanData);
  return response.data;
};

export const updateLoan = async (id: string, loanData: any) => {
  const response = await api.put(`/loans/${id}`, loanData);
  return response.data;
};

export const deleteLoan = async (id: string) => {
  const response = await api.delete(`/loans/${id}`);
  return response.data;
};

