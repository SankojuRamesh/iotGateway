import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, registerAuthExpiredHandler } from "@/lib/api";
import { tokenStorage } from "@/lib/tokenStorage";
import { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    organization_name: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const response = await api.get<User>("/auth/me/");
    setUser(response.data);
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokenStorage.getRefresh();
    tokenStorage.clear();
    setUser(null);
    if (refresh) {
      try {
        await api.post("/auth/logout/", { refresh });
      } catch {
        // token already invalid/expired - fine, we've cleared local state
      }
    }
  }, []);

  useEffect(() => {
    registerAuthExpiredHandler(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!tokenStorage.getAccess()) {
      setLoading(false);
      return;
    }
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post("/auth/login/", { email, password });
      tokenStorage.set(response.data.access, response.data.refresh);
      setUser(response.data.user);
    },
    [],
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      organization_name: string;
      first_name?: string;
      last_name?: string;
    }) => {
      const response = await api.post("/auth/register/", data);
      tokenStorage.set(response.data.access, response.data.refresh);
      setUser(response.data.user);
    },
    [],
  );

  const switchOrganization = useCallback(async (organizationId: string) => {
    const response = await api.post<User>("/auth/switch-organization/", {
      organization_id: organizationId,
    });
    setUser(response.data);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, switchOrganization, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
