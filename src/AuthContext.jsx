import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("nlc_user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (!localStorage.getItem("nlc_token")) return;

    api
      .get("/auth/me")
      .then(({ data }) => {
        localStorage.setItem("nlc_user", JSON.stringify(data));
        setUser(data);
      })
      .catch(() => {
        localStorage.removeItem("nlc_token");
        localStorage.removeItem("nlc_user");
        setUser(null);
      });
  }, []);

  const loginWithPayload = (data) => {
    localStorage.setItem("nlc_token", data.access_token);
    localStorage.setItem("nlc_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("nlc_token");
    localStorage.removeItem("nlc_user");
    setUser(null);
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    loginWithPayload(data);
  };

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    loginWithPayload(data);
  };

  const value = useMemo(() => ({ user, login, register, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
