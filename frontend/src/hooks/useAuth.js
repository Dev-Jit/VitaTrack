import useAuthStore from "../store/authStore";

export default function useAuth() {
  const token = useAuthStore((state) => state.token);
  const setToken = useAuthStore((state) => state.setToken);
  const clearToken = useAuthStore((state) => state.clearToken);

  return {
    isAuthenticated: Boolean(token),
    token,
    setToken,
    clearToken,
  };
}
