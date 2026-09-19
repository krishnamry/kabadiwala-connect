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
import { AuthChoicePage } from './pages/auth/AuthChoicePage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { LanguageSelectScreen } from './pages/auth/LanguageSelectScreen';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { ChatsPage } from './pages/chats/ChatsPage';
import { DesignPreviewPage } from './pages/design-preview/DesignPreviewPage';
import { Role } from './types';
import { storage } from './lib/storage';

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { language, t } = useLanguage();
  const isNative = Capacitor.isNativePlatform();

  // Navigation flow:
  // - If user is logged in: direct to dashboard (avoid onboarding / language selection)
  // - If user is NOT logged in: First screen is Language Selection
  const [currentView, setCurrentView] = useState<string>(() => {
    const existingUser = storage.getCurrentUser();
    if (existingUser) {
      return existingUser.role.toLowerCase();
    }
    return 'language-select';
  });

  // Track sub-section when navigating to profile (personal, security, support)
  const [profileInitialSection, setProfileInitialSection] = useState<'personal' | 'security' | 'support'>('personal');

  // Track optional context when navigating directly to chat (e.g. from pickup/lot)
  const [activeChatContext, setActiveChatContext] = useState<{
    contextType: 'LOT' | 'PICKUP';
    contextId: string;
    partnerId?: string;
    title?: string;
  } | null>(null);

  // Track previous view for seamless Back navigation from Settings, Profile, Notifications, and Chats pages
  const [previousView, setPreviousView] = useState<string>('login');

  const handleNavigate = (
    newView: string,
    section?: 'personal' | 'security' | 'support',
    chatContext?: {
      contextType: 'LOT' | 'PICKUP';
      contextId: string;
      partnerId?: string;
      title?: string;
    }
  ) => {
    if (section) {
      setProfileInitialSection(section);
    }
    if (chatContext) {
      setActiveChatContext(chatContext);
    } else if (newView !== 'chats') {
      setActiveChatContext(null);
    }
    if (
      newView === 'settings' ||
      newView === 'profile' ||
      newView === 'notifications' ||
      newView === 'chats'
    ) {
      if (
        currentView !== 'settings' &&
        currentView !== 'profile' &&
        currentView !== 'notifications' &&
        currentView !== 'chats'
      ) {
        setPreviousView(currentView);
      }
    }
    setCurrentView(newView);
  };

  const handleBack = () => {
    const fallback = user ? user.role.toLowerCase() : 'login';
    setCurrentView(previousView || fallback);
  };

  // When user logs in or role changes, redirect to their role's dashboard
  useEffect(() => {
    if (user) {
      if (
        currentView !== 'settings' &&
        currentView !== 'profile' &&
        currentView !== 'notifications' &&
        currentView !== 'chats'
      ) {
        setCurrentView(user.role.toLowerCase());
      }
    } else {
      if (
        currentView !== 'settings' &&
        currentView !== 'profile' &&
        currentView !== 'notifications' &&
        currentView !== 'chats' &&
        currentView !== 'login' &&
        currentView !== 'signup' &&
        currentView !== 'auth-choice' &&
        currentView !== 'language-select'
      ) {
        setCurrentView('language-select');
      }
    }
  }, [user?.role, user?.id]);

  const renderActiveView = () => {
    if (loading) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
          <div 
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <p className="text-slate-600 dark:text-slate-300 font-bold font-display text-sm">
            {t('initializing', 'Initializing Dhatu Ecosystem...')}
          </p>
        </div>
      );
    }

    // Step 1: Language Selection screen (First in navigation flow for unauthenticated users)
    if (currentView === 'language-select') {
      return (
        <LanguageSelectScreen
          onComplete={() => setCurrentView('auth-choice')}
        />
      );
    }

    // Step 2: Auth Gateway screen (Sign Up on top, Log In below)
    if (currentView === 'auth-choice') {
      return (
        <AuthChoicePage
          onSelectSignUp={() => setCurrentView('signup')}
          onSelectLogin={() => setCurrentView('login')}
          onChangeLanguage={() => setCurrentView('language-select')}
        />
      );
    }

    // Step 3a: Sign Up Wizard with Role Selection, 2x Password, & Aadhaar/PAN KYC
    if (currentView === 'signup') {
      return (
        <SignUpPage
          onBack={() => setCurrentView('auth-choice')}
          onGoToLogin={() => setCurrentView('login')}
          onSuccess={(role: Role) => {
            setCurrentView(role.toLowerCase());
          }}
        />
      );
    }

    // Step 3b: Log In page with Role switcher, Forgot Password recovery, & Quick Demo tabs
    if (currentView === 'login') {
      return (
        <LoginPage
          onBack={() => setCurrentView('auth-choice')}
          onGoToSignUp={() => setCurrentView('signup')}
          onChangeLanguage={() => setCurrentView('language-select')}
          onSuccess={(role: Role) => {
            setCurrentView(role.toLowerCase());
          }}
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
          initialTab={profileInitialSection}
        />
      );
    }

    if (currentView === 'notifications') {
      return (
        <NotificationsPage
          onBack={handleBack}
          onNavigateTab={(tab) => handleNavigate(tab)}
        />
      );
    }

    if (currentView === 'chats') {
      return (
        <ChatsPage
          onBack={handleBack}
          initialContext={activeChatContext}
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

    if (currentView === 'design-preview' || currentView === 'preview') {
      return (
        <DesignPreviewPage
          onBackToApp={handleBack}
        />
      );
    }

    return (
      <LandingPage
        onNavigatePortal={(portal: string) => handleNavigate(portal)}
      />
    );
  };

  const isFullscreenSubpage =
    currentView === 'language-select' ||
    currentView === 'auth-choice' ||
    currentView === 'signup' ||
    currentView === 'login' ||
    currentView === 'settings' ||
    currentView === 'profile' ||
    currentView === 'notifications' ||
    currentView === 'chats' ||
    currentView === 'design-preview' ||
    currentView === 'preview';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 font-body antialiased transition-colors duration-200 w-full">
      {!isFullscreenSubpage && (
        <Navbar
          currentTab={currentView}
          onTabChange={(tab: string, section?: 'personal' | 'security' | 'support') => handleNavigate(tab, section)}
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

            <div className="flex wrap items-center gap-3 text-slate-400 text-xs">
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
