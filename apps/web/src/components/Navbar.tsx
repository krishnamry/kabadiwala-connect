import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Capacitor } from '@capacitor/core';
import { Role } from '../types';
import { triggerHaptic } from '../lib/haptics';
import {
  User as UserIcon,
  ShieldCheck,
  Truck,
  Factory,
  LogOut,
  ChevronDown,
  Volume2,
  Lock,
  Languages,
  Settings,
  HelpCircle,
  Check
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string, section?: 'personal' | 'security' | 'support') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const { user, logout, quickDemoLogin } = useAuth();
  const { language, setLanguage, t, speak } = useLanguage();
  const { currentThemeConfig } = useTheme();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isNative = Capacitor.isNativePlatform();

  const handleLogoClick = () => {
    triggerHaptic(15);
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
            {t('portalCitizen', 'Citizen')}
          </span>
        );
      case 'KABADIWALA':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
            {t('portalCollector', 'Collector')}
          </span>
        );
      case 'RECYCLER':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60 shadow-2xs">
            {t('portalRecycler', 'Recycler')}
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-250 dark:border-slate-700 shadow-2xs">
            {t('portalAdmin', 'Audit')}
          </span>
        );
    }
  };

  return (
    <header 
      className="sticky top-0 z-40 bg-white/95 dark:bg-[#131D31]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all w-full"
      style={{
        paddingTop: 'var(--app-top-inset, env(safe-area-inset-top, 0px))'
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-18 gap-2">
          
          {/* Left: Brand Logo */}
          <div
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group shrink-0 min-w-0"
            onClick={handleLogoClick}
          >
            <div 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-all shrink-0"
              style={{
                background: `linear-gradient(135deg, ${currentThemeConfig.primary}, ${currentThemeConfig.primaryLight})`
              }}
            >
              <span className="font-display font-black text-base sm:text-xl">धा</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-display font-extrabold text-sm sm:text-xl tracking-tight text-slate-900 dark:text-white truncate">
                  Kabadiwala<span style={{ color: currentThemeConfig.primary }}>Connect</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                  SIH26229
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:flex items-center gap-1 font-medium truncate">
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

          {/* Center: Active Role Badge (Desktop Only) */}
          {user && (
            <div className="hidden lg:flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">{t('activeTerminal', 'Terminal')}:</span>
              {getRoleBadge(user.role)}
            </div>
          )}

          {/* Right Section: Language Toggle, Settings Button & Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            
            {/* Smart Vernacular Language Selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setLangMenuOpen(!langMenuOpen);
                  if (profileMenuOpen) setProfileMenuOpen(false);
                }}
                className={`flex items-center space-x-1 p-2 sm:px-3 sm:py-1.5 rounded-full border transition-all active:scale-95 ${
                  langMenuOpen
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                } font-semibold text-xs sm:text-sm shadow-2xs`}
                title={t('langSelect', 'Change Language')}
                aria-label="Language Selector"
              >
                <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">
                  {language === 'en' ? 'English' : language === 'hi' ? 'हिन्दी' : 'मराठी'}
                </span>
                <span className="sm:hidden font-mono uppercase text-[11px] font-bold">
                  {language === 'en' ? 'EN' : language === 'hi' ? 'हि' : 'मरा'}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {langMenuOpen && (
                <>
                  {/* Mobile backdrop scrim */}
                  <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[0.5px] sm:hidden"
                    onClick={() => setLangMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#131D31] rounded-2xl shadow-xl border border-slate-150 dark:border-slate-800 py-2 z-50 text-sm animate-fade-in">
                    <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      {t('selectLanguage', 'Select Language')}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(20);
                        setLanguage('en');
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${language === 'en' ? 'font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30' : 'text-slate-800 dark:text-slate-200'}`}
                    >
                      <div>
                        <div className="font-bold">English</div>
                        <div className="text-[10px] text-slate-400">Default Latin digits</div>
                      </div>
                      {language === 'en' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(20);
                        setLanguage('hi');
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${language === 'hi' ? 'font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30' : 'text-slate-800 dark:text-slate-200'}`}
                    >
                      <div>
                        <div className="font-bold">हिन्दी (Hindi)</div>
                        <div className="text-[10px] text-slate-400">स्वाभाविक अनुवाद, स्पष्ट संख्याएं</div>
                      </div>
                      {language === 'hi' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(20);
                        setLanguage('mr');
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${language === 'mr' ? 'font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30' : 'text-slate-800 dark:text-slate-200'}`}
                    >
                      <div>
                        <div className="font-bold">मराठी (Marathi)</div>
                        <div className="text-[10px] text-slate-400">सहज भाषा, स्पष्ट आकडे</div>
                      </div>
                      {language === 'mr' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* App Settings Page Button (Opens Dedicated Settings Page) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                setProfileMenuOpen(false);
                setLangMenuOpen(false);
                onTabChange('settings');
              }}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition-all active:scale-95"
              title={t('settingsBtn', 'Settings (Themes, Display, Voice, Data)')}
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            </button>

            {/* Profile Dropdown Trigger & Popover Menu */}
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    setProfileMenuOpen(!profileMenuOpen);
                    if (langMenuOpen) setLangMenuOpen(false);
                  }}
                  className={`flex items-center space-x-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full border transition-all active:scale-95 ${
                    profileMenuOpen
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
                  } shadow-2xs`}
                  title="Account & Profile Options"
                  aria-label="My Profile & Options"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-sm shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight max-w-[80px] truncate">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{user.role}</div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''}`} />
                </button>

                {/* Profile Dropdown Popover */}
                {profileMenuOpen && (
                  <>
                    {/* Mobile backdrop scrim */}
                    <div
                      className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[0.5px] sm:hidden"
                      onClick={() => setProfileMenuOpen(false)}
                    />

                    <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#131D31] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-fade-in text-slate-900 dark:text-slate-100">
                      
                      {/* Identity Card */}
                      <div 
                        className="p-4 border-b border-slate-100 dark:border-slate-800/80"
                        style={{
                          background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.08), transparent)'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-display font-black text-base shadow-md shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${currentThemeConfig.primary}, ${currentThemeConfig.primaryLight})`
                            }}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-display font-black text-sm text-slate-900 dark:text-white truncate">
                                {user.name}
                              </h3>
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white shrink-0" title="CPCB EPR Verified">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {getRoleBadge(user.role)}
                            </div>
                            {user.phone && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                                +91 {user.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Navigation Options */}
                      <div className="p-2 space-y-1 text-sm">
                        
                        {/* 1. Personal Details */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(15);
                            setProfileMenuOpen(false);
                            onTabChange('profile', 'personal');
                          }}
                          className="w-full text-left p-2.5 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 flex items-center justify-between gap-3 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                {t('personalDetails', 'Personal Details')}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {t('personalDetailsDesc', 'Name, contact & pickup address')}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                            Edit
                          </span>
                        </button>

                        {/* 2. Security & Privacy */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(15);
                            setProfileMenuOpen(false);
                            onTabChange('profile', 'security');
                          }}
                          className="w-full text-left p-2.5 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 flex items-center justify-between gap-3 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                {t('securityAccess', 'Security & Access')}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {t('securityAccessDesc', 'PIN, biometrics & 2FA protection')}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60">
                            PIN
                          </span>
                        </button>

                        {/* 3. Help & Support */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(15);
                            setProfileMenuOpen(false);
                            onTabChange('profile', 'support');
                          }}
                          className="w-full text-left p-2.5 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 flex items-center justify-between gap-3 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <HelpCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                {t('helpSupport', 'Help & Support')}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {t('helpSupportDesc', '24/7 Helpline, WhatsApp & nodal officer')}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                            24/7
                          </span>
                        </button>

                        {/* 4. App Settings */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(15);
                            setProfileMenuOpen(false);
                            onTabChange('settings');
                          }}
                          className="w-full text-left p-2.5 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 flex items-center justify-between gap-3 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <Settings className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                {t('settingsTitle', 'App Settings')}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {t('settingsDesc', 'Themes, display, voice & data')}
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Sign Out Action */}
                      <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(20);
                            setProfileMenuOpen(false);
                            logout();
                            onTabChange('login');
                          }}
                          className="w-full p-2.5 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-2.5 transition-colors font-bold text-xs group"
                        >
                          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <div className="text-left flex-1">
                            <div className="leading-tight">{t('signOut', 'Sign Out')}</div>
                            <div className="text-[10px] text-rose-500/70 font-normal">End session on this device</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : currentTab !== 'login' ? (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  onTabChange('login');
                }}
                className="btn-primary-m3 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold flex items-center space-x-1 transition-all hover:scale-[1.02] shrink-0"
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
