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
      RECYCLER: '9822200002',    // EcoRecycle Aggregators Ltd
      ADMIN: '9999900000'        // Municipal NDMC
    };

    setLoading(true);
    try {
      await login(demoPhones[role], 'password123');
    } catch (err) {
      console.warn('API login failed, using local demo user for role:', role);
      // Seamless mock session fallback for demo
      const mockUsers: Record<Role, User> = {
        CITIZEN: {
          id: 'mock-citizen-1',
          name: 'Ramesh Sharma',
          phone: '9811100001',
          role: 'CITIZEN'
        },
        KABADIWALA: {
          id: 'mock-kaba-1',
          name: 'Suresh Kumar',
          phone: '9876543210',
          role: 'KABADIWALA',
          kabadiwala: {
            id: 'prof-kaba-1',
            userId: 'mock-kaba-1',
            verified: true,
            reputationScore: 4.9,
            walletBalance: 2840,
            vehicleType: 'Solar Cargo Trike',
            aadhaarNumber: 'XXXX-XXXX-8921',
            serviceRadiusKm: 6.5,
            completedJobsCount: 142
          }
        },
        RECYCLER: {
          id: 'mock-recycler-1',
          name: 'EcoRecycle Aggregators Ltd',
          phone: '9822200002',
          role: 'RECYCLER',
          recycler: {
            id: 'rec-fac-01',
            facilityName: 'EcoRecycle Aggregators Ltd (Unit-II)',
            cpcbRegNumber: 'CPCB-EW-2023-DL-0881',
            statePcb: 'Delhi Pollution Control Committee (DPCC)',
            latitude: 28.5355,
            longitude: 77.2690,
            address: 'Plot 42, Okhla Phase-II Industrial Area, New Delhi - 110020',
            materialsAccepted: ['PCBs', 'Batteries', 'Copper Wiring', 'CRT Glass', 'LCD Panels', 'E-Plastics'],
            offeredRates: {
              'High-grade PCB': 640,
              'Copper Wire (Clean)': 480,
              'Li-ion Batteries': 145,
              'Electric Motors': 95,
              'Low-grade PCB': 180,
              'LCD Displays': 85
            },
            dailyCapacityKg: 5000,
            pickupAvailable: true,
            verified: true,
            rating: 4.9
          }
        },
        ADMIN: {
          id: 'mock-admin-1',
          name: 'NDMC Waste & Mines Cell',
          phone: '9999900000',
          role: 'ADMIN'
        }
      };

      setUser(mockUsers[role]);
      setToken('mock-demo-jwt-token');
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
