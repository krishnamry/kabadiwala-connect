import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { KabadiwalaDashboard } from './pages/kabadiwala/KabadiwalaDashboard';
import { RecyclerDashboard } from './pages/recycler/RecyclerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { LoginPage } from './pages/auth/LoginPage';
import { Role } from './types';

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { language, t } = useLanguage();
  const [currentView, setCurrentView] = useState<string>('home');

  // When user logs in or role changes, redirect to their role's dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'CITIZEN') setCurrentView('citizen');
      else if (user.role === 'KABADIWALA') setCurrentView('kabadiwala');
      else if (user.role === 'RECYCLER') setCurrentView('recycler');
      else if (user.role === 'ADMIN') setCurrentView('admin');
    }
  }, [user?.role, user?.id]);

  const renderActiveView = () => {
    if (loading) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-copper-600 border-t-transparent animate-spin" />
          <p className="text-steel-600 font-bold font-display text-sm">{t('initializing', 'Initializing Dhatu Ecosystem...')}</p>
        </div>
      );
    }

    if (currentView === 'login') {
      return (
        <LoginPage
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
        onNavigatePortal={(portal: string) => setCurrentView(portal)}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper-100 text-steel-800">
      <Navbar
        currentTab={currentView}
        onTabChange={(tab: string) => setCurrentView(tab)}
      />

      <main className="flex-1">
        {renderActiveView()}
      </main>

      {/* Footer — Dhatu Industrial Stamped Style */}
      <footer className="bg-steel-900 text-paper-300 py-10 pb-28 md:pb-10 border-t-2 border-steel-700 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-copper-600 border border-copper-800 flex items-center justify-center text-white font-display font-black text-sm">
              धा
            </div>
            <span className="font-display font-bold text-paper-50">Kabadiwala Connect ({language === 'en' ? 'Dhatu' : 'धातु'})</span>
            <span className="text-paper-400">— {t('sihSub', 'Ministry of Mines — Informal e-Waste Integration')}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-paper-400 font-mono text-[11px]">
            <span>3-Sided Formal Funnel</span>
            <span>CPCB EPR Form-2/6 Compliant</span>
            <span>Spoken Vernacular TTS</span>
            <span>Offline-Tolerant Passbook</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;

