import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Capacitor } from '@capacitor/core';
import { ThemeSelector } from './ThemeSelector';
import { Role } from '../types';
import {
  User,
  ShieldCheck,
  Truck,
  Factory,
  LogOut,
  ChevronDown,
  Sparkles,
  Volume2,
  Lock,
  ArrowRight,
  Languages
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const { user, logout, quickDemoLogin } = useAuth();
  const { language, setLanguage, t, speak } = useLanguage();
  const { currentThemeConfig } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  const handleLogoClick = () => {
    if (user) {
      onTabChange(user.role.toLowerCase());
    } else if (isNative) {
      onTabChange('login');
    } else {
      onTabChange('home');
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'CITIZEN':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-sm">
            {t('portalCitizen', 'Citizen Portal')}
          </span>
        );
      case 'KABADIWALA':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 shadow-sm">
            {t('portalCollector', 'Collector Portal')}
          </span>
        );
      case 'RECYCLER':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-900 border border-teal-200/80 shadow-sm">
            {t('portalRecycler', 'Authorized Recycler')}
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-900 border border-slate-250 shadow-sm">
            {t('portalAdmin', 'CPCB Regulatory Audit')}
          </span>
        );
    }
  };

  return (
    <header 
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all"
      style={{
        paddingTop: 'var(--app-top-inset, env(safe-area-inset-top, 0px))'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand Logo & Philosophy Tag */}
          <div
            className="flex items-center space-x-2 sm:space-x-3.5 cursor-pointer group shrink-0"
            onClick={handleLogoClick}
          >
            <div 
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-all shrink-0"
              style={{
                background: `linear-gradient(135deg, ${currentThemeConfig.primary}, ${currentThemeConfig.primaryLight})`
              }}
            >
              <span className="font-display font-black text-lg sm:text-2xl">धा</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2.5">
                <span className="font-display font-extrabold text-base sm:text-2xl tracking-tight text-slate-900">
                  Kabadiwala<span style={{ color: currentThemeConfig.primary }}>Connect</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                  SIH26229
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:flex items-center gap-1.5 font-medium">
                <span>{t('dhatuTag', 'Dhatu — Smart e-Waste Traceability & Formalization')}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(language === 'hi' ? 'कबाड़ीवाला कनेक्ट, धातु ई-कचरा मंच' : language === 'mr' ? 'कबाडीवाला कनेक्ट, धातु ई-कचरा व्यासपीठ' : 'Kabadiwala Connect, Dhatu e-waste formalization platform');
                  }}
                  className="hover:opacity-75 transition-opacity"
                  style={{ color: currentThemeConfig.primary }}
                  title={t('listen', 'Listen aloud')}
                >
                  <Volume2 className="w-3.5 h-3.5 inline" />
                </button>
              </p>
            </div>
          </div>

          {/* Center: Active Role Badge (Clean, Role-Specific) */}
          {user && (
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">{t('activeTerminal', 'Terminal')}:</span>
              {getRoleBadge(user.role)}
            </div>
          )}

          {/* Right Section: Theme Selector, Language Toggle & User Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Theme Selector */}
            <ThemeSelector />

            {/* Smart Vernacular Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs sm:text-sm shadow-sm transition-all"
                title={t('langSelect', 'Change Language')}
              >
                <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">
                  {language === 'en' ? 'English' : language === 'hi' ? 'हिन्दी' : 'मराठी'}
                </span>
                <span className="sm:hidden font-mono uppercase">
                  {language === 'en' ? 'EN' : language === 'hi' ? 'हि' : 'मरा'}
                </span>
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-sm animate-fade-in">
                  <div className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    {t('selectLanguage', 'Select Language')}
                  </div>
                  <button
                    onClick={() => { setLanguage('en'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors ${language === 'en' ? 'font-bold text-emerald-700 bg-emerald-50/60' : 'text-slate-800'}`}
                  >
                    <span>English</span>
                    {language === 'en' && <span className="text-emerald-600 font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => { setLanguage('hi'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors ${language === 'hi' ? 'font-bold text-emerald-700 bg-emerald-50/60' : 'text-slate-800'}`}
                  >
                    <span>हिन्दी (Hindi)</span>
                    {language === 'hi' && <span className="text-emerald-600 font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => { setLanguage('mr'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors ${language === 'mr' ? 'font-bold text-emerald-700 bg-emerald-50/60' : 'text-slate-800'}`}
                  >
                    <span>मराठी (Marathi)</span>
                    {language === 'mr' && <span className="text-emerald-600 font-bold">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Profile Dropdown / Sign In Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-1 sm:px-2.5 sm:py-1.5 rounded-full border border-slate-200 hover:border-emerald-500 bg-white shadow-sm transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">{user.role}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-xl border border-slate-150 py-3 z-50 text-sm animate-fade-in">
                    <div className="px-5 py-3 border-b border-slate-100">
                      <p className="font-bold text-slate-900 text-base">{user.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{user.phone}</p>
                      <div className="mt-2">{getRoleBadge(user.role)}</div>
                    </div>

                    <div className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t('switchRole', 'Switch Role Portal')}
                    </div>
                    <div className="px-2 space-y-0.5">
                      <button
                        onClick={() => { quickDemoLogin('CITIZEN'); setDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-800 font-medium transition-colors"
                      >
                        <span>1. {t('personaCitizen', 'Ramesh Sharma')} ({t('portalCitizen', 'Citizen')})</span>
                        <span className="text-emerald-600 font-bold text-xs">{t('actions', 'Switch')}</span>
                      </button>
                      <button
                        onClick={() => { quickDemoLogin('KABADIWALA'); setDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-800 font-medium transition-colors"
                      >
                        <span>2. {t('personaCollector', 'Suresh Kumar')} ({t('portalCollector', 'Collector')})</span>
                        <span className="text-amber-700 font-bold text-xs">{t('actions', 'Switch')}</span>
                      </button>
                      <button
                        onClick={() => { quickDemoLogin('RECYCLER'); setDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-800 font-medium transition-colors"
                      >
                        <span>3. {t('personaRecycler', 'EcoRecycle')} ({t('portalRecycler', 'Recycler')})</span>
                        <span className="text-teal-700 font-bold text-xs">{t('actions', 'Switch')}</span>
                      </button>
                      <button
                        onClick={() => { quickDemoLogin('ADMIN'); setDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-800 font-medium transition-colors"
                      >
                        <span>4. {t('personaAdmin', 'NDMC')} ({t('portalAdmin', 'Audit')})</span>
                        <span className="text-slate-900 font-bold text-xs">{t('actions', 'Switch')}</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 mt-2 pt-2 px-2">
                      <button
                        onClick={() => { logout(); setDropdownOpen(false); onTabChange('login'); }}
                        className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl flex items-center space-x-2 font-bold transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('signOut', 'Sign Out')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : currentTab !== 'login' ? (
              <button
                onClick={() => onTabChange('login')}
                className="btn-primary-m3 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all hover:scale-[1.02]"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t('signInBtn', 'Sign In')}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
