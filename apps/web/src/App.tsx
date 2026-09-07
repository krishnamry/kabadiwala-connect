import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { KabadiwalaDashboard } from './pages/kabadiwala/KabadiwalaDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { LoginPage } from './pages/auth/LoginPage';
import { Role } from './types';
import { Sparkles, Recycle } from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');

  // When user logs in or role changes, redirect to their role's dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'CITIZEN') setCurrentView('citizen');
      else if (user.role === 'KABADIWALA') setCurrentView('kabadiwala');
      else if (user.role === 'ADMIN') setCurrentView('admin');
    }
  }, [user?.role, user?.id]);

  const renderActiveView = () => {
    if (loading) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Initializing Kabadiwala Connect...</p>
        </div>
      );
    }

    if (currentView === 'login') {
      return (
        <LoginPage
          onSuccess={(role: Role) => {
            if (role === 'CITIZEN') setCurrentView('citizen');
            else if (role === 'KABADIWALA') setCurrentView('kabadiwala');
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
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      <Navbar
        currentTab={currentView}
        onTabChange={(tab: string) => setCurrentView(tab)}
      />

      <main className="flex-1">
        {renderActiveView()}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              ♻️
            </div>
            <span className="font-bold text-slate-200">Kabadiwala Connect</span>
            <span>— Smart India Hackathon (SIH 2026) Prototype</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400">
            <span>Role-based Responsive Web App</span>
            <span>Leaflet Maps</span>
            <span>FastAPI ML Classifier</span>
            <span>CPCB EPR Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

export default App;
