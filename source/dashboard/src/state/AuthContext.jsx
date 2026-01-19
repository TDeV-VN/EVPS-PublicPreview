import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { apiClient, storeTokens, clearTokens } from "../utils/apiClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMe = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient("/users/me");
      setUser(res);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiClient("/users/login", {
        method: "POST",
        body: { email, password },
      });
      const { accessToken, refreshToken } = data || {};
      if (accessToken || refreshToken) {
        storeTokens(accessToken, refreshToken);
      }
      setUser(data);
      return data;
    } catch (err) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient("/users/logout", { method: "DELETE" });
    } catch (_) {}
    clearTokens();
    setUser(null);
  };

  // Allow RegisterForm to set user from register response
  const setUserFromRegister = (data) => {
    const { accessToken, refreshToken } = data || {};
    if (accessToken || refreshToken) {
      storeTokens(accessToken, refreshToken);
    }
    setUser(data || null);
  };

  // Expose a manual re-fetch current user helper
  const refreshMe = async () => {
    await fetchMe();
  };

  const value = {
    user,
    login,
    logout,
    loading,
    error,
    setUserFromRegister,
    refreshMe,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
