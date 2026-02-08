'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@prisma/client';
import { post } from '@/lib/api/client';
import { LoginInput, RegisterInput } from '@/schemas';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (data: LoginInput) => {
    const response = await post<{ user: AuthUser }>(
      '/auth/login',
      data
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Login failed');
    }

    const { user: authUser } = response.data!;

    localStorage.setItem('user', JSON.stringify(authUser));

    setUser(authUser);

    // Redirect based on role

    if (authUser.role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const register = async (data: RegisterInput) => {
    const response = await post<{ user: AuthUser }>(
      '/auth/register',
      data
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Registration failed');
    }

    const { user: authUser } = response.data!;

    localStorage.setItem('user', JSON.stringify(authUser));

    setUser(authUser);
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    }

    // Clear local auth state
    setUser(null);

    // 🔥 Notify the whole app
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:logout"));
    }
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
