import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { Recycle, Truck, ShieldCheck, User, ArrowRight, Sparkles, Lock, Phone } from 'lucide-react';

interface LoginPageProps {
  onSuccess: (role: Role) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, register, quickDemoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('9811100001');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<Role>('CITIZEN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({ name, phone, password, role });
      } else {
        await login(phone, password);
      }
      onSuccess(role);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (demoRole: Role) => {
    setError(null);
    setLoading(true);
    try {
      await quickDemoLogin(demoRole);
      onSuccess(demoRole);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        {/* Logo & Heading */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Recycle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-500">
            {isRegister ? 'Sign up to connect with scrap collectors' : 'Login to your Kabadiwala Connect account'}
          </p>
        </div>

        {/* 1-Click Judge / Demo Quick Switcher */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>SIH Judge / Quick Demo Login (1-Click)</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoClick('CITIZEN')}
              className="bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-300 p-2 rounded-xl text-center transition-all shadow-sm"
            >
              <div className="text-base">👤</div>
              <div className="text-[11px] font-bold">Ramesh</div>
              <div className="text-[9px] text-slate-400">Citizen</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick('KABADIWALA')}
              className="bg-white hover:bg-amber-50 text-amber-800 border border-slate-200 hover:border-amber-300 p-2 rounded-xl text-center transition-all shadow-sm"
            >
              <div className="text-base">🚛</div>
              <div className="text-[11px] font-bold">Suresh</div>
              <div className="text-[9px] text-slate-400">Kabadiwala</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick('ADMIN')}
              className="bg-white hover:bg-purple-50 text-purple-800 border border-slate-200 hover:border-purple-300 p-2 rounded-xl text-center transition-all shadow-sm"
            >
              <div className="text-base">🏛️</div>
              <div className="text-[11px] font-bold">NDMC</div>
              <div className="text-[9px] text-slate-400">Admin/EPR</div>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Regular Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full pl-10 border border-slate-200 rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">I want to register as</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="CITIZEN">Household / Citizen (कबाड़ विक्रेता)</option>
                <option value="KABADIWALA">Scrap Collector / Kabadiwala (कबाड़ीवाला)</option>
                <option value="ADMIN">Recycler / Municipal Admin (ULB)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Processing...' : isRegister ? 'Register & Enter' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-emerald-700 hover:underline font-semibold"
          >
            {isRegister ? 'Already have an account? Sign in here' : 'Don’t have an account? Register new profile'}
          </button>
        </div>
      </div>
    </div>
  );
};
