import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { Recycle, User, ShieldCheck, Truck, LogOut, ChevronDown, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const { user, logout, quickDemoLogin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'CITIZEN':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-300">Citizen</span>;
      case 'KABADIWALA':
        return <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-300">Collector / कबाड़ीवाला</span>;
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-purple-300">Admin / ULB</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onTabChange('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Recycle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Kabadiwala<span className="text-emerald-600">Connect</span>
                </span>
                <span className="hidden sm:inline-block bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                  SIH 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Smart Informal Scrap & EPR Integration Platform
              </p>
            </div>
          </div>

          {/* Quick Portal Switcher (Judge / Demo helper) */}
          <div className="hidden lg:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => quickDemoLogin('CITIZEN')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
                user?.role === 'CITIZEN' ? 'bg-white text-emerald-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Citizen Portal</span>
            </button>
            <button
              onClick={() => quickDemoLogin('KABADIWALA')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
                user?.role === 'KABADIWALA' ? 'bg-white text-amber-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Kabadiwala Portal</span>
            </button>
            <button
              onClick={() => quickDemoLogin('ADMIN')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
                user?.role === 'ADMIN' ? 'bg-white text-purple-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin / ULB</span>
            </button>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                      {user.name}
                      {user.kabadiwala?.verified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>
                    <div>{getRoleBadge(user.role)}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-sm">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{user.phone}</p>
                    </div>

                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Demo Role Switcher
                    </div>
                    <button
                      onClick={() => { quickDemoLogin('CITIZEN'); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center justify-between text-slate-700"
                    >
                      <span>Ramesh (Citizen)</span>
                      <span className="text-emerald-600">Switch</span>
                    </button>
                    <button
                      onClick={() => { quickDemoLogin('KABADIWALA'); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center justify-between text-slate-700"
                    >
                      <span>Suresh (Collector)</span>
                      <span className="text-amber-600">Switch</span>
                    </button>
                    <button
                      onClick={() => { quickDemoLogin('ADMIN'); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center justify-between text-slate-700"
                    >
                      <span>NDMC (Admin/EPR)</span>
                      <span className="text-purple-600">Switch</span>
                    </button>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => { logout(); setDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onTabChange('login')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Demo Portals</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
