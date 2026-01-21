
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // token is our simple auth flag
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // keep localStorage in sync when token changes
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  const login = (newToken) => setToken(newToken);
  const logout = () => setToken(null);

  const value = { token, isAuthenticated: !!token, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}