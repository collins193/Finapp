import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const BASE = import.meta.env.BASE_URL;

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  balance: number;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}api/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data ?? null))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const r = await fetch(`${BASE}api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({ message: "Login failed" }));
      throw new Error(err.message || "Login failed");
    }
    const data = await r.json();
    setUser(data);
  };

  const register = async (name: string, email: string, password: string) => {
    const r = await fetch(`${BASE}api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({ message: "Registration failed" }));
      throw new Error(err.message || "Registration failed");
    }
    const data = await r.json();
    setUser(data);
  };

  const logout = async () => {
    await fetch(`${BASE}api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
