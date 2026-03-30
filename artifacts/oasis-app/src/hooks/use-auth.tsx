import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from "react";
import { useGetMe, useLogin, type User, type LoginBody } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginBody) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [_, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { data: userData, isLoading: meLoading, error, refetch } = useGetMe({
    query: {
      retry: false,
      staleTime: Infinity,
    }
  });

  useEffect(() => {
    if (!meLoading) {
      if (error) {
        setIsAuthenticated(false);
      } else if (userData) {
        setIsAuthenticated(true);
      }
    }
  }, [meLoading, error, userData]);

  const loginMutation = useLogin();

  const handleLogin = useCallback(async (data: LoginBody) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    await loginMutation.mutateAsync({ data });
    setIsAuthenticated(true);
    await refetch();
    setLocation("/");
  }, [loginMutation, refetch, setLocation]);

  const handleLogout = useCallback(async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      await fetch(`${baseUrl}api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {}
    setIsAuthenticated(false);
    setLocation("/login");
  }, [setLocation]);

  const isLoading = meLoading || isAuthenticated === null;

  return (
    <AuthContext.Provider value={{ 
      user: isAuthenticated ? (userData || null) : null, 
      isLoading, 
      login: handleLogin,
      logout: handleLogout
    }}>
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
