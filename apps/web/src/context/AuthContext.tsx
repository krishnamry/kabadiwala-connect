import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../lib/api';
import { storage, STORAGE_KEYS } from '../lib/storage';

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
  const [user, setUser] = useState<User | null>(() => storage.getCurrentUser());
  const [token, setToken] = useState<string | null>(() => getAuthToken() || (storage.getCurrentUser() ? 'local-auth-token' : null));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const storedUser = storage.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
        setToken(getAuthToken() || 'local-auth-token');
      }
      if (getAuthToken()) {
        const me = await api.getMe();
        if (me) {
          setUser(me);
          storage.setCurrentUser(me);
        }
      }
    } catch (e) {
      const storedUser = storage.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
      } else {
        clearAuthToken();
        setUser(null);
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    // Listen for storage events across tabs or local mutations
    const handleStorageUpdate = (e: any) => {
      if (e.detail?.key === STORAGE_KEYS.CURRENT_USER || e.detail?.key === '*') {
        const updated = storage.getCurrentUser();
        setUser(updated);
      }
    };
    window.addEventListener('dhatu-storage-change', handleStorageUpdate);
    return () => window.removeEventListener('dhatu-storage-change', handleStorageUpdate);
  }, []);

  const login = async (phone: string, password = 'password123') => {
    setLoading(true);
    try {
      const res = await api.login({ phone, password });
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
      storage.setCurrentUser(res.user);
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
      storage.setCurrentUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthToken();
    storage.setCurrentUser(null);
    setToken(null);
    setUser(null);
  };

  const quickDemoLogin = async (role: Role) => {
    const demoPhones: Record<Role, string> = {
      CITIZEN: '9811100001',     // Ramesh Sharma
      KABADIWALA: '9876543210',  // Suresh Kumar
      RECYCLER: '9822200002',    // EcoRecycle Aggregators Ltd
      ADMIN: '9999900000'        // Municipal NDMC
    };

    setLoading(true);
    try {
      const res = await api.login({ phone: demoPhones[role], password: 'password123' });
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
      storage.setCurrentUser(res.user);
    } catch (err) {
      console.warn('API login fallback, using storage user for role:', role);
      const storedUser = storage.getUserByPhone(demoPhones[role]);
      if (storedUser) {
        setUser(storedUser);
        setAuthToken('mock-demo-jwt-token');
        setToken('mock-demo-jwt-token');
        storage.setCurrentUser(storedUser);
      }
    } finally {
      setLoading(false);
    }
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
