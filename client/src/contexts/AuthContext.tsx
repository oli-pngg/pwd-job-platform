import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "pwd_seeker" | "employer" | "admin";
  disabilityType?: string | null;
  city?: string | null;
  phone?: string | null;
  bio?: string | null;
  skills?: string | null;
  workPreference?: string | null;
  company?: string | null;
  createdAt?: Date | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: string;
  disabilityType?: string;
  skills?: string[];
  workPreference?: string;
  city?: string;
  phone?: string;
  bio?: string;
  company?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    let res: Response;
    try {
      res = await apiRequest("POST", "/api/auth/login", { email, password });
    } catch (err: any) {
      // Extract message from error string like "401: {"error":"..."}" 
      const match = err.message?.match(/^\d+: (.+)$/);
      if (match) {
        try { const parsed = JSON.parse(match[1]); throw new Error(parsed.error || "Login failed"); } catch(e2: any) { if (e2.message !== match[1]) throw e2; }
      }
      throw new Error("Invalid email or password");
    }
    const data = await res.json();
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (registerData: RegisterData): Promise<AuthUser> => {
    let res: Response;
    try {
      res = await apiRequest("POST", "/api/auth/register", registerData);
    } catch (err: any) {
      const match = err.message?.match(/^\d+: (.+)$/);
      if (match) {
        try { const parsed = JSON.parse(match[1]); throw new Error(parsed.error || "Registration failed"); } catch(e2: any) { if (e2.message !== match[1]) throw e2; }
      }
      throw new Error("Registration failed. Please try again.");
    }
    const data = await res.json();
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
