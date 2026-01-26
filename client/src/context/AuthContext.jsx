import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // ✅ token
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // ✅ user object (includes role)
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // ✅ Keep localStorage in sync
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [token, user]);

  // ✅ login now accepts token + user
  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // ✅ role helpers
  const isAuthenticated = !!token;
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";

  const value = {
    token,
    user,
    isAuthenticated,
    isAdmin,
    isUser,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}