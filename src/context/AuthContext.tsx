import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "../shared/api/services/authService";
import { authRecoveryService } from "../shared/api/services/authRecoveryService";
import { tokenStorage } from "../shared/api/apiClient";

export type User = {
  user_id?: number;
  userId?: number;
  name: string;
  email: string;
  role?: string;
  avatar_url?: string | null;
};

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOtp: (email: string, code: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_USER_KEY = "disc-market-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Verificar la validez del token en el backend al montar la aplicación
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    authService
      .getMe()
      .then((userData) => {
        const fullUser: User = {
          user_id: userData.user_id,
          userId: userData.user_id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        };
        setUser(fullUser);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(fullUser));
      })
      .catch(() => {
        // Token inválido o expirado
        tokenStorage.clear();
        localStorage.removeItem(STORAGE_USER_KEY);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email: string, password: string) => {
        const response = await authService.login({ email, password });
        const loggedUser: User = {
          user_id: response.user.user_id,
          userId: response.user.user_id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
        };
        setUser(loggedUser);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(loggedUser));
      },
      loginWithOtp: async (email: string, code: string) => {
        const response = await authRecoveryService.verifyOtp({ email, code });
        const loggedUser: User = {
          user_id: response.user.user_id,
          userId: response.user.user_id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
        };
        setUser(loggedUser);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(loggedUser));
      },
      register: async (name: string, email: string, password: string) => {
        const response = await authService.register({ name, email, password });
        const registeredUser: User = {
          user_id: response.user.user_id,
          userId: response.user.user_id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
        };
        setUser(registeredUser);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(registeredUser));
      },
      logout: () => {
        authService.logout();
        localStorage.removeItem(STORAGE_USER_KEY);
        setUser(null);
      },
      updateUser: (updatedData: Partial<User>) => {
        setUser((prev) => {
          if (!prev) return null;
          const next = { ...prev, ...updatedData };
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(next));
          return next;
        });
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
