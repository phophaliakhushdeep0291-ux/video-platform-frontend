"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api, { ApiError } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: FormData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// BUG FIX: Extract the fetch-current-user logic into a standalone async fn
// so that both initAuth and refreshUser share the same implementation
// without one being built on top of useCallback (which couldn't be done before).
async function fetchCurrentUser(): Promise<User | null> {
  try {
    const response = await api.get<User>(API_ROUTES.CURRENT_USER);
    return response.data;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // BUG FIX: refreshUser was duplicating the same fetch logic as initAuth.
  // Now both use fetchCurrentUser() consistently.
  const refreshUser = useCallback(async () => {
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<{ user: User }>(API_ROUTES.LOGIN, {
        email,
        password,
      });
      setUser(response.data.user);
      toast.success("Logged in successfully");
      router.push("/");
    },
    [router]
  );

  const register = useCallback(
    async (data: FormData) => {
      // BUG FIX: The original had 3 debug console.log / console.error calls
      // left in from development — these leak internal API shape to the browser
      // console in production and should never ship.
      //
      // BUG FIX: error was typed as `any` which bypasses TypeScript safety.
      //
      // BUG FIX: The original silently caught and re-threw errors without
      // letting the caller know the type — now we just let errors propagate
      // naturally so the call site (register page) handles them correctly.
      await api.post(API_ROUTES.REGISTER, data);
      toast.success("Account created! Please verify your email.");
      // router.push("/login");
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post(API_ROUTES.LOGOUT);
    } catch {
      // Silent fail — always clear local state even if the server request fails
    } finally {
      setUser(null);
      toast.success("Logged out successfully");
      router.push("/");
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { ApiError };
