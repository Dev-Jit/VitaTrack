import axiosClient from "./axiosClient";

export const authApi = {
  login: async (payload) => {
    const response = await axiosClient.post("/auth/login", payload);
    return response.data;
  },
  register: async (payload) => {
    const response = await axiosClient.post("/auth/register", payload);
    return response.data;
  },
};
