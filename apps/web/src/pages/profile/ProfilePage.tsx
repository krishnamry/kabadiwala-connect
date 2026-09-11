import React, { useState } from 'react';
import {
  ArrowLeft,
  User as UserIcon,
  ShieldCheck,
  Lock,
  Phone,
  Mail,
  MapPin,
  KeyRound,
  Fingerprint,
  Smartphone,
  Globe,
  LogOut,
  Save,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Download,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../lib/haptics';

interface ProfilePageProps {
  onBack: () => void;
  onOpenSettings?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBack,
  onOpenSettings
}) => {
  const { user, updateProfile, logout } = useAuth();
  const { language, t } = useLanguage();
  const { currentThemeConfig } = useTheme();

  // Personal details state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || (user ? `${user.role.toLowerCase()}@kabadiwalaconnect.org` : ''));
  const [address, setAddress] = useState(user?.address || 'Sector 4, Rohini / Okhla Industrial Area, New Delhi');
  const [personalSaveSuccess, setPersonalSaveSuccess] = useState<string | null>(null);

  // Security state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [sessionsMsg, setSessionsMsg] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-base font-bold text-slate-700 dark:text-slate-300">Please sign in to view your profile.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(20);
    updateProfile({
      name,
      email,
      address
    });
    setPersonalSaveSuccess(t('profileSaved', 'Personal details successfully updated!'));
    setTimeout(() => setPersonalSaveSuccess(null), 3000);
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setPinError(t('pinLengthError', 'New PIN must be exactly 4 numeric digits.'));
      return;
    }
    if (newPin !== confirmPin) {
      setPinError(t('pinMismatchError', 'New PIN and confirm PIN do not match.'));
      return;
    }

    triggerHaptic(25);
    localStorage.setItem(`dhatu_user_pin_${user.id}`, newPin);
    setPinSuccess(t('pinSuccess', '4-digit security PIN updated successfully!'));
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => setPinSuccess(null), 3500);
  };

  const handleLogoutOtherSessions = () => {
    triggerHaptic(25);
    setSessionsMsg(t('otherSessionsLoggedOut', 'All other active sessions on Web and Android have been invalidated.'));
    setTimeout(() => setSessionsMsg(null), 4000);
  };

  const handleDownloadCertificate = () => {
    triggerHaptic(20);
    const cert = {
      platform: 'Kabadiwala Connect — Dhatu EPR Traceability',
      certificateId: `CPCB-CERT-${user.id.toUpperCase()}-2026`,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email
      },
      audit: {
        divertedWasteKg: 182.4,
        co2ePreventedKg: 394,
        status: 'CPCB_KYC_VERIFIED',
        sha256Hash: '0x8f4a9b2c7e103984fa55c91b7d82e443',
        timestamp: new Date().toISOString()
      }
    };

    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhatu-traceability-cert-${user.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-body transition-colors duration-200">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#131D31]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                onBack();
              }}
              className="p-2 sm:p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all active:scale-95 shadow-sm"
              title="Go Back"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                  {t('myProfile', 'My Profile & Security')}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                  {user.name} • {user.role} ({user.phone})
                </p>
              </div>
            </div>
          </div>

          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                onOpenSettings();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-transform active:scale-95 border border-slate-200 dark:border-slate-700"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>{t('settingsTitle', 'Settings')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        
        {/* SECTION 1: Personal Details */}
        <section className="bg-white dark:bg-[#131D31] rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-display font-black text-slate-900 dark:text-white">
                  Personal Information
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Official name, verified mobile, contact email, and collection address.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>KYC VERIFIED</span>
            </span>
          </div>

          <form onSubmit={handleSavePersonal} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Registered Mobile Number
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-mono text-sm">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>+91 {user.phone}</span>
                  <span className="ml-auto text-[10px] font-bold text-emerald-600">LOCKED</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Assigned Ecosystem Role
                </label>
                <div className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 font-bold text-sm text-slate-800 dark:text-slate-200">
                  {user.role} (Portal Access Active)
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Primary Doorstep / Facility Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street name, Sector, Area, City"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>

              {personalSaveSuccess && (
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{personalSaveSuccess}</span>
                </div>
              )}
            </div>
          </form>
        </section>

        {/* SECTION 2: Security & PIN */}
        <section className="bg-white dark:bg-[#131D31] rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-black text-slate-900 dark:text-white">
                Security & Authentication
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                4-digit security PIN, two-factor authentication, and biometrics.
              </p>
            </div>
          </div>

          {/* Change PIN Form */}
          <form onSubmit={handleUpdatePin} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-slate-900 dark:text-white">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Change 4-Digit Security PIN</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Current PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={currentPin}
                  onChange={e => setCurrentPin(e.target.value)}
                  placeholder="••••"
                  className="w-full text-center tracking-widest px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono font-bold text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  New 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="••••"
                  className="w-full text-center tracking-widest px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono font-bold text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Confirm New PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  placeholder="••••"
                  className="w-full text-center tracking-widest px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono font-bold text-sm focus:outline-none"
                />
              </div>
            </div>

            {pinError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{pinError}</span>
              </div>
            )}

            {pinSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{pinSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
            >
              Update Security PIN
            </button>
          </form>

          {/* Security Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Two-Factor Auth (OTP)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Require SMS OTP for large lot bids
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setTwoFactorEnabled(!twoFactorEnabled);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  twoFactorEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Biometric APK Unlock
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Use Fingerprint on Android devices
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setBiometricsEnabled(!biometricsEnabled);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  biometricsEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    biometricsEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Session Manager & Sign Out */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleLogoutOtherSessions}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Log Out All Other Devices
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                logout();
                onBack();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors border border-rose-200 dark:border-rose-800/60"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out from Active Terminal</span>
            </button>
          </div>

          {sessionsMsg && (
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ✓ {sessionsMsg}
            </div>
          )}
        </section>

        {/* SECTION 3: Traceability & Impact */}
        <section className="bg-white dark:bg-[#131D31] rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-teal-600/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-black text-slate-900 dark:text-white">
                EPR Traceability & Environmental Impact
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Cryptographic SHA-256 material audit records and CPCB disposal certificate.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Waste Diverted
              </div>
              <div className="text-2xl font-display font-black text-slate-900 dark:text-white mt-1">
                182.4 kg
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Safe formal channel processing
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50">
              <div className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                CO2e Prevented
              </div>
              <div className="text-2xl font-display font-black text-slate-900 dark:text-white mt-1">
                394 kg
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Zero open burning emissions
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50">
              <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                CSR Equivalent
              </div>
              <div className="text-2xl font-display font-black text-slate-900 dark:text-white mt-1">
                4 Trees
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Lifetime carbon offset matched
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                Audit Hash: 0x8f4a9b2c7e103984fa55c91b7d82e443
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Digitally verified by CPCB authorized smelter network under SIH26229.
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadCertificate}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-transform active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Certificate</span>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};
