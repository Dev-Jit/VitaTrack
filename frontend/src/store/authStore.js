import { create } from "zustand";

const TOKEN_KEY = "vitatrack_token";

const useAuthStore = create((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ token });
  },
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null });
  },
}));

export default useAuthStore;
