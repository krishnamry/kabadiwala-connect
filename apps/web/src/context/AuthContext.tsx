import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, password?: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  quickDemoLogin: (role: Role) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (getAuthToken()) {
        const me = await api.getMe();
        setUser(me);
      }
    } catch (e) {
      console.warn('Failed to fetch user profile, clearing session');
      clearAuthToken();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (phone: string, password = 'password123') => {
    setLoading(true);
    try {
      const res = await api.login({ phone, password });
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: any) => {
    setLoading(true);
    try {
      const res = await api.register(payload);
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthToken();
    setToken(null);
    setUser(null);
  };

  const quickDemoLogin = async (role: Role) => {
    const demoPhones: Record<Role, string> = {
      CITIZEN: '9811100001',     // Ramesh Sharma
      KABADIWALA: '9876543210',  // Suresh Kumar
      ADMIN: '9999900000'        // Municipal NDMC
    };
    await login(demoPhones[role], 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        quickDemoLogin,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
