import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { Role } from '../types';
import { User, ShieldCheck, Truck, Factory, LogOut, ChevronDown, Sparkles, Volume2, Globe } from 'lucide-react';

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
        return <span className="bg-paper-200 text-copper-700 text-[11px] font-bold px-2 py-0.5 rounded border border-copper-300">नागरिक / Citizen</span>;
      case 'KABADIWALA':
        return <span className="bg-brass-100 text-brass-800 text-[11px] font-bold px-2 py-0.5 rounded border border-brass-400">कबाड़ीवाला / Collector</span>;
      case 'RECYCLER':
        return <span className="bg-forest-500/10 text-forest-500 text-[11px] font-bold px-2 py-0.5 rounded border border-forest-500/30">रीसायकलर / Aggregator</span>;
      case 'ADMIN':
        return <span className="bg-steel-800 text-paper-100 text-[11px] font-bold px-2 py-0.5 rounded border border-steel-700">Admin / CPCB Audit</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-paper-50/95 backdrop-blur-md border-b-2 border-steel-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Philosophy Tag */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onTabChange('home')}
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
                <span>धातु — e-Waste Traceability & EPR Platform</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(language === 'hi' ? 'कबाड़ीवाला कनेक्ट, धातु ई-कचरा ट्रेसेबिलिटी मंच' : language === 'mr' ? 'कबाडीवाला कनेक्ट, धातु ई-कचरा मागोवा व्यासपीठ' : 'Kabadiwala Connect, Dhatu e-waste traceability and EPR platform');
                  }}
                  className="text-copper-600 hover:text-copper-800"
                  title="Listen aloud"
                >
                  <Volume2 className="w-3.5 h-3.5 inline" />
                </button>
              </p>
            </div>
          </div>

          {/* 4-Portal Quick Switcher (Live Demo / Jury Showcase) */}
          <div className="hidden xl:flex items-center space-x-1 bg-paper-200/80 p-1 rounded-lg border border-steel-300 shadow-inner">
            <button
              onClick={() => quickDemoLogin('CITIZEN')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all flex items-center space-x-1.5 ${
                user?.role === 'CITIZEN'
                  ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
                  : 'text-steel-700 hover:text-steel-950 hover:bg-paper-100'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>1. {t('portalCitizen', 'Citizen')}</span>
            </button>
            <button
              onClick={() => quickDemoLogin('KABADIWALA')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all flex items-center space-x-1.5 ${
                user?.role === 'KABADIWALA'
                  ? 'bg-brass-500 text-steel-950 shadow-tactile border border-brass-600'
                  : 'text-steel-700 hover:text-steel-950 hover:bg-paper-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>2. {t('portalCollector', 'Collector')}</span>
            </button>
            <button
              onClick={() => quickDemoLogin('RECYCLER')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all flex items-center space-x-1.5 ${
                user?.role === 'RECYCLER'
                  ? 'bg-forest-500 text-white shadow-tactile border border-forest-600'
                  : 'text-steel-700 hover:text-steel-950 hover:bg-paper-100'
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>3. {t('portalRecycler', 'Recycler')}</span>
            </button>
            <button
              onClick={() => quickDemoLogin('ADMIN')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all flex items-center space-x-1.5 ${
                user?.role === 'ADMIN'
                  ? 'bg-steel-800 text-white shadow-tactile border border-steel-900'
                  : 'text-steel-700 hover:text-steel-950 hover:bg-paper-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>4. {t('portalAdmin', 'Admin / CPCB')}</span>
            </button>
          </div>

          {/* Right Section: Language Toggle & User Profile */}
          <div className="flex items-center space-x-2.5">
            
            {/* Vernacular Language Toggle ("अ / A") */}
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

            {/* Profile Dropdown */}
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
                    <div className="text-xs font-bold text-steel-900 leading-tight flex items-center gap-1">
                      {user.name}
                      {user.kabadiwala?.verified && (
                        <span className="text-forest-500 font-bold text-[10px]">★</span>
                      )}
                    </div>
                    <div>{getRoleBadge(user.role)}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-steel-500" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-paper-50 rounded-lg shadow-tactile-lg border-2 border-steel-800 py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-steel-200">
                      <p className="font-bold text-steel-900">{user.name}</p>
                      <p className="text-[11px] text-steel-600 font-mono">{user.phone}</p>
                      <p className="text-[10px] text-steel-500 mt-0.5">Role: <span className="font-bold">{user.role}</span></p>
                    </div>

                    <div className="px-3 py-1.5 text-[10px] font-bold text-steel-500 uppercase tracking-wider">
                      Switch Live Demo Persona
                    </div>
                    <button
                      onClick={() => { quickDemoLogin('CITIZEN'); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-paper-200 flex items-center justify-between text-steel-800 font-medium"
                    >
                      <span>1. Ramesh (Citizen Household)</span>
                      <span className="text-copper-600 font-bold">Switch</span>
                    </button>
                    <button
                      onClick={() => { quickDemoLogin('KABADIWALA'); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-paper-200 flex items-center justify-between text-steel-800 font-medium"
                    >
                      <span>2. Suresh (Collector / कबाड़ीवाला)</span>
                      <span className="text-brass-700 font-bold">Switch</span>
                    </button>
                    <button
                      onClick={() => { quickDemoLogin('RECYCLER'); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-paper-200 flex items-center justify-between text-steel-800 font-medium"
                    >
                      <span>3. EcoRecycle (Aggregator)</span>
                      <span className="text-forest-600 font-bold">Switch</span>
                    </button>
                    <button
                      onClick={() => { quickDemoLogin('ADMIN'); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-paper-200 flex items-center justify-between text-steel-800 font-medium"
                    >
                      <span>4. NDMC / CPCB (EPR Audit)</span>
                      <span className="text-steel-900 font-bold">Switch</span>
                    </button>

                    <div className="border-t border-steel-200 mt-1 pt-1">
                      <button
                        onClick={() => { logout(); setDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-signal-500 hover:bg-signal-500/10 flex items-center space-x-2 font-bold"
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
                className="btn-dhatu-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch Portals</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

