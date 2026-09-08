import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, Language } from '../context/LanguageContext';
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
  ArrowRight
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const { user, logout, quickDemoLogin } = useAuth();
  const { language, setLanguage, t, speak } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'CITIZEN':
        return (
          <span className="stamp-seal stamp-verified text-[10px] bg-paper-200 text-copper-700 border-copper-400">
            {t('portalCitizen', 'Citizen Portal')}
          </span>
        );
      case 'KABADIWALA':
        return (
          <span className="stamp-seal stamp-pending text-[10px] bg-brass-100 text-brass-800 border-brass-500">
            {t('portalCollector', 'Collector / कबाड़ीवाला')}
          </span>
        );
      case 'RECYCLER':
        return (
          <span className="stamp-seal stamp-verified text-[10px] bg-forest-500/10 text-forest-600 border-forest-600">
            {t('portalRecycler', 'Authorized Recycler')}
          </span>
        );
      case 'ADMIN':
        return (
          <span className="stamp-seal stamp-verified text-[10px] bg-steel-800 text-paper-100 border-steel-700">
            {t('portalAdmin', 'CPCB Regulatory Audit')}
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-paper-50/95 backdrop-blur-md border-b-2 border-steel-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Philosophy Tag */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onTabChange(user ? (user.role.toLowerCase()) : 'home')}
          >
            <div className="w-10 h-10 rounded-lg bg-copper-600 border-2 border-copper-800 flex items-center justify-center text-white shadow-tactile group-hover:bg-copper-700 transition-colors">
              <span className="font-display font-black text-xl">धा</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-xl tracking-tight text-steel-900">
                  Kabadiwala<span className="text-copper-600">Connect</span>
                </span>
                <span className="hidden sm:inline-block bg-brass-100 text-brass-800 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-brass-400">
                  SIH26229
                </span>
              </div>
              <p className="text-[11px] text-steel-600 hidden md:flex items-center gap-1 font-medium">
                <span>धातु — e-Waste Traceability & Formalization</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(language === 'hi' ? 'कबाड़ीवाला कनेक्ट, धातु ई-कचरा मंच' : language === 'mr' ? 'कबाडीवाला कनेक्ट, धातु ई-कचरा व्यासपीठ' : 'Kabadiwala Connect, Dhatu e-waste platform');
                  }}
                  className="text-copper-600 hover:text-copper-800"
                  title="Listen aloud"
                >
                  <Volume2 className="w-3.5 h-3.5 inline" />
                </button>
              </p>
            </div>
          </div>

          {/* Center: Active Role Badge (Clean, Role-Specific, No Clutter!) */}
          {user && (
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-xs text-steel-500 font-mono">{t('activeTerminal', 'Active Terminal')}:</span>
              {getRoleBadge(user.role)}
            </div>
          )}

          {/* Right Section: Language Toggle & User Actions */}
          <div className="flex items-center space-x-2.5">
            
            {/* Vernacular Language Selector ("अ / A") */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border-2 border-steel-400 bg-paper-100 hover:bg-paper-200 text-steel-900 font-display font-bold text-xs shadow-sm"
                title="भाषा बदलें / Change Language"
              >
                <span className="text-copper-600 font-black">अ / A</span>
                <span className="uppercase text-[10px] text-steel-600">{language}</span>
                <ChevronDown className="w-3 h-3 text-steel-500" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-paper-50 rounded-lg shadow-tactile-lg border-2 border-steel-700 py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold text-steel-500 uppercase border-b border-steel-200">
                    भाषा चयन / Language
                  </div>
                  <button
                    onClick={() => { setLanguage('en'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-paper-200 ${language === 'en' ? 'font-bold text-copper-700 bg-paper-200' : 'text-steel-800'}`}
                  >
                    <span>English</span>
                    {language === 'en' && <span className="text-copper-600">✓</span>}
                  </button>
                  <button
                    onClick={() => { setLanguage('hi'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-paper-200 ${language === 'hi' ? 'font-bold text-copper-700 bg-paper-200' : 'text-steel-800'}`}
                  >
                    <span>हिन्दी (Hindi)</span>
                    {language === 'hi' && <span className="text-copper-600">✓</span>}
                  </button>
                  <button
                    onClick={() => { setLanguage('mr'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-paper-200 ${language === 'mr' ? 'font-bold text-copper-700 bg-paper-200' : 'text-steel-800'}`}
                  >
                    <span>मराठी (Marathi)</span>
                    {language === 'mr' && <span className="text-copper-600">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Profile Dropdown / Sign In Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg border-2 border-steel-300 hover:border-steel-500 bg-paper-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded bg-copper-600 text-white font-display font-bold text-sm flex items-center justify-center border border-copper-800">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-steel-900 leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-steel-500 font-mono">{user.role}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-steel-500" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-paper-50 rounded-lg shadow-tactile-lg border-2 border-steel-800 py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-steel-200">
                      <p className="font-bold text-steel-900">{user.name}</p>
                      <p className="text-[11px] text-steel-600 font-mono">{user.phone}</p>
                      <div className="mt-1">{getRoleBadge(user.role)}</div>
                    </div>

                    <div className="px-3 py-1.5 text-[10px] font-bold text-steel-500 uppercase tracking-wider">
                      {t('switchRole', 'Switch Role Portal')}
                    </div>
                    <button
                      onClick={() => { quickDemoLogin('CITIZEN'); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-paper-200 flex items-center justify-between text-steel-800 font-medium"
                    >
                      <span>1. {t('personaCitizen', 'Ramesh Sharma')} ({t('portalCitizen', 'Citizen Portal')})</span>
                      <span className="text-copper-600 font-bold">{t('actions', 'Switch')}</span>
                    </button>
                    <button
                      onClick={() => { quickDemoLogin('KABADIWALA'); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-paper-200 flex items-center justify-between text-steel-800 font-medium"
                    >
                      <span>2. {t('personaCollector', 'Suresh Kumar')} ({t('portalCollector', 'Collector Portal')})</span>
                      <span className="text-brass-700 font-bold">{t('actions', 'Switch')}</span>
                    </button>
                    <button
                      onClick={() => { quickDemoLogin('RECYCLER'); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-paper-200 flex items-center justify-between text-steel-800 font-medium"
                    >
                      <span>3. {t('personaRecycler', 'EcoRecycle')} ({t('portalRecycler', 'Recycler Terminal')})</span>
                      <span className="text-forest-600 font-bold">{t('actions', 'Switch')}</span>
                    </button>
                    <button
                      onClick={() => { quickDemoLogin('ADMIN'); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-paper-200 flex items-center justify-between text-steel-800 font-medium"
                    >
                      <span>4. {t('personaAdmin', 'NDMC')} ({t('portalAdmin', 'CPCB Regulatory Audit')})</span>
                      <span className="text-steel-900 font-bold">{t('actions', 'Switch')}</span>
                    </button>

                    <div className="border-t border-steel-200 mt-1 pt-1">
                      <button
                        onClick={() => { logout(); setDropdownOpen(false); onTabChange('login'); }}
                        className="w-full text-left px-4 py-2 text-signal-500 hover:bg-signal-500/10 flex items-center space-x-2 font-bold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('signOut', 'Sign Out')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onTabChange('login')}
                className="btn-dhatu px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t('signInBtn', 'Sign In to Portal')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
