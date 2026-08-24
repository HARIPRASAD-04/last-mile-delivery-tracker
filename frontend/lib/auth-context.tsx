'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth as authApi } from './api';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'CUSTOMER' | 'AGENT';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isAgent: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    try {
      const userData = await authApi.me() as User;
      setUser(userData);
    } catch {
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password }) as any;
    localStorage.setItem('access_token', data.access_token);
    setUser(data.user);
  };

  const register = async (formData: any) => {
    const data = await authApi.register(formData) as any;
    localStorage.setItem('access_token', data.access_token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout,
      isAdmin: user?.role === 'ADMIN',
      isAgent: user?.role === 'AGENT',
      isCustomer: user?.role === 'CUSTOMER',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
