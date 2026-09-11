import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { Capacitor } from '@capacitor/core';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { KabadiwalaDashboard } from './pages/kabadiwala/KabadiwalaDashboard';
import { RecyclerDashboard } from './pages/recycler/RecyclerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { LoginPage } from './pages/auth/LoginPage';
import { LanguageSelectScreen } from './pages/auth/LanguageSelectScreen';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { Role } from './types';

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { language, t } = useLanguage();
  const isNative = Capacitor.isNativePlatform();

  // On native Android APK, first ask language preference, then proceed to login!
  const [currentView, setCurrentView] = useState<string>(() => {
    if (isNative) {
      const hasChosenLanguage = localStorage.getItem('dhatu_language_onboarded') === 'true';
      return hasChosenLanguage ? 'login' : 'language-select';
    }
    return 'home';
  });

  // Track previous view for seamless Back navigation from Settings and Profile pages
  const [previousView, setPreviousView] = useState<string>(() => {
    if (isNative) return 'login';
    return 'home';
  });

  const handleNavigate = (newView: string) => {
    if (newView === 'settings' || newView === 'profile') {
      if (currentView !== 'settings' && currentView !== 'profile') {
        setPreviousView(currentView);
      }
    }
    setCurrentView(newView);
  };

  const handleBack = () => {
    const fallback = user ? user.role.toLowerCase() : (isNative ? 'login' : 'home');
    setCurrentView(previousView || fallback);
  };

  // When user logs in or role changes, redirect to their role's dashboard
  useEffect(() => {
    if (user) {
      if (currentView !== 'settings' && currentView !== 'profile') {
        if (user.role === 'CITIZEN') setCurrentView('citizen');
        else if (user.role === 'KABADIWALA') setCurrentView('kabadiwala');
        else if (user.role === 'RECYCLER') setCurrentView('recycler');
        else if (user.role === 'ADMIN') setCurrentView('admin');
      }
    } else if (isNative) {
      const hasChosenLanguage = localStorage.getItem('dhatu_language_onboarded') === 'true';
      if (currentView !== 'settings' && currentView !== 'profile') {
        setCurrentView(hasChosenLanguage ? 'login' : 'language-select');
      }
    }
  }, [user?.role, user?.id, isNative]);

  const renderActiveView = () => {
    if (loading) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
          <div 
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <p className="text-slate-600 dark:text-slate-300 font-bold font-display text-sm">{t('initializing', 'Initializing Dhatu Ecosystem...')}</p>
        </div>
      );
    }

    if (currentView === 'language-select') {
      return (
        <LanguageSelectScreen
          onComplete={() => setCurrentView('login')}
        />
      );
    }

    if (currentView === 'settings') {
      return (
        <SettingsPage
          onBack={handleBack}
          onOpenProfile={() => handleNavigate('profile')}
        />
      );
    }

    if (currentView === 'profile') {
      return (
        <ProfilePage
          onBack={handleBack}
          onOpenSettings={() => handleNavigate('settings')}
        />
      );
    }

    if (currentView === 'login') {
      return (
        <LoginPage
          onChangeLanguage={() => handleNavigate('language-select')}
          onSuccess={(role: Role) => {
            if (role === 'CITIZEN') setCurrentView('citizen');
            else if (role === 'KABADIWALA') setCurrentView('kabadiwala');
            else if (role === 'RECYCLER') setCurrentView('recycler');
            else if (role === 'ADMIN') setCurrentView('admin');
          }}
        />
      );
    }

    if (currentView === 'citizen') {
      return <CitizenDashboard />;
    }

    if (currentView === 'kabadiwala') {
      return <KabadiwalaDashboard />;
    }

    if (currentView === 'recycler') {
      return <RecyclerDashboard />;
    }

    if (currentView === 'admin') {
      return <AdminDashboard />;
    }

    return (
      <LandingPage
        onNavigatePortal={(portal: string) => handleNavigate(portal)}
      />
    );
  };

  const isFullscreenSubpage = currentView === 'language-select' || currentView === 'settings' || currentView === 'profile';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 font-body antialiased transition-colors duration-200">
      {!isFullscreenSubpage && (
        <Navbar
          currentTab={currentView}
          onTabChange={(tab: string) => handleNavigate(tab)}
        />
      )}

      <main className="flex-1">
        {renderActiveView()}
      </main>

      {/* Modern Material Expressive Footer (Hidden on native Android APK, subpages, & mobile dashboard views) */}
      {!isNative && !isFullscreenSubpage && (
        <footer className={`bg-slate-900 text-slate-300 py-8 border-t border-slate-800 text-sm ${currentView !== 'home' ? 'hidden md:block' : 'pb-20 md:pb-8'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-display font-extrabold text-sm shadow-sm">
                धा
              </div>
              <div>
                <span className="font-display font-bold text-white text-base">Kabadiwala Connect ({language === 'en' ? 'Dhatu' : 'धातु'})</span>
                <span className="text-slate-400 text-xs block sm:inline sm:ml-2">— {t('sihSub', 'Ministry of Mines — Informal e-Waste Integration')}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-slate-400 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">3-Sided Formal Funnel</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">CPCB EPR Compliant</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">Spoken TTS</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">Offline-Tolerant</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
