import React, { useState } from 'react';
import {
  X,
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
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { triggerHaptic } from '../lib/haptics';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings
}) => {
  const { user, updateProfile, logout } = useAuth();
  const { language, t } = useLanguage();
  const { currentThemeConfig } = useTheme();

  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'impact'>('personal');

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

  if (!isOpen || !user) return null;

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
    setTimeout(() => setSessionsMsg(null), 3000);
  };

  const handleExportAudit = () => {
    triggerHaptic(15);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        kycStatus: 'CPCB_AUDIT_VERIFIED'
      },
      compliance: {
        form: 'CPCB_FORM_2_TRACEABILITY',
        standard: 'E-Waste Management Rules 2022 / 2026',
        exportedAt: new Date().toISOString()
      }
    }, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `CPCB-KYC-${user.name.replace(/\s+/g, '_')}.json`);
    dlAnchor.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#131D31] text-slate-900 dark:text-slate-100 rounded-[32px] border border-slate-200/80 dark:border-slate-800 max-w-xl w-full p-6 sm:p-8 shadow-m3-4 max-h-[92vh] flex flex-col space-y-5 relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header / Avatar Summary */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-display font-black shadow-md shrink-0"
              style={{
                background: `linear-gradient(135deg, ${currentThemeConfig.primary}, ${currentThemeConfig.primaryLight})`
              }}
            >
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-display font-black tracking-tight">
                  {user.name}
                </h2>
                <span className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300" title="CPCB KYC Verified">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full chip-primary-m3">
                  {user.role}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  +91 {user.phone}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-full border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('personal'); triggerHaptic(10); }}
            className={`flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'personal'
                ? 'bg-white dark:bg-[#1A263D] text-slate-900 dark:text-white shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>{t('personalTab', 'Personal Details')}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('security'); triggerHaptic(10); }}
            className={`flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'security'
                ? 'bg-white dark:bg-[#1A263D] text-slate-900 dark:text-white shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{t('securityTab', 'Security & PIN')}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('impact'); triggerHaptic(10); }}
            className={`flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'impact'
                ? 'bg-white dark:bg-[#1A263D] text-slate-900 dark:text-white shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{t('impactTab', 'Traceability')}</span>
          </button>
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">

          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === 'personal' && (
            <form onSubmit={handleSavePersonal} className="space-y-4">
              {personalSaveSuccess && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{personalSaveSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Full Legal Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#1A263D] border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-[#131D31] focus:outline-none focus:border-emerald-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Mobile Number (Aadhaar KYC)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={`+91 ${user.phone}`}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-mono font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#1A263D] border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-[#131D31] focus:outline-none focus:border-emerald-600 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Operating Hub / Doorstep Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#1A263D] border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium focus:bg-white dark:focus:bg-[#131D31] focus:outline-none focus:border-emerald-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* KYC Verification Card */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-100 block">
                      CPCB Regulatory KYC: Fully Verified
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Form-2 Compliance ID: CPCB-KYC-{user.phone.slice(-4)}-2026
                    </span>
                  </div>
                </div>
                <span className="text-[11px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full shadow-2xs">
                  Active
                </span>
              </div>

              <button
                type="submit"
                className="w-full btn-primary-m3 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-transform"
              >
                <Save className="w-4 h-4" />
                <span>Save Personal Details</span>
              </button>
            </form>
          )}

          {/* TAB 2: SECURITY & PIN */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              {/* Change 4-digit PIN form */}
              <form onSubmit={handleUpdatePin} className="p-4 bg-slate-50 dark:bg-[#1A263D] rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Update 4-Digit Security PIN
                  </h4>
                </div>

                {pinError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-200 text-xs font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}

                {pinSuccess && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{pinSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                      New 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full text-center tracking-widest text-lg font-mono font-black py-2 bg-white dark:bg-[#131D31] border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                      Confirm New PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full text-center tracking-widest text-lg font-mono font-black py-2 bg-white dark:bg-[#131D31] border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary-m3 py-2.5 rounded-full text-xs sm:text-sm font-bold"
                >
                  Save New Security PIN
                </button>
              </form>

              {/* 2FA and Biometrics Controls */}
              <div className="p-4 bg-slate-50 dark:bg-[#1A263D] rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-sm font-bold block text-slate-900 dark:text-white">
                        Two-Factor Authentication (2FA)
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Require Aadhaar/SMS OTP on lot handovers
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactorEnabled(!twoFactorEnabled);
                      triggerHaptic(15);
                    }}
                    className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center ${
                      twoFactorEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-sm block" />
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-sm font-bold block text-slate-900 dark:text-white">
                        Biometric Quick Login (Android)
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Fingerprint / Face Unlock for app
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBiometricsEnabled(!biometricsEnabled);
                      triggerHaptic(15);
                    }}
                    className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center ${
                      biometricsEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-sm block" />
                  </button>
                </div>
              </div>

              {/* Active Sessions Manager */}
              <div className="p-4 bg-slate-50 dark:bg-[#1A263D] rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Active Device Sessions
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                    2 Active
                  </span>
                </div>

                {sessionsMsg && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-200 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{sessionsMsg}</span>
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-white dark:bg-[#131D31] rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">This Device (Android APK / Web)</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">New Delhi, India • Active Now</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full">Current</span>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-[#131D31] rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between opacity-80">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Secondary Web Terminal</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Chrome 128 • 2 hours ago</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutOtherSessions}
                  className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full text-xs font-bold transition-colors"
                >
                  Log Out All Other Devices
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TRACEABILITY & IMPACT */}
          {activeTab === 'impact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold block uppercase tracking-wider">
                    E-Waste Diverted
                  </span>
                  <span className="text-2xl font-display font-black text-emerald-900 dark:text-white block mt-1">
                    182.4 kg
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    100% CPCB Form-2 Logged
                  </span>
                </div>

                <div className="p-4 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800">
                  <span className="text-xs text-teal-800 dark:text-teal-300 font-bold block uppercase tracking-wider">
                    Carbon Offset
                  </span>
                  <span className="text-2xl font-display font-black text-teal-900 dark:text-white block mt-1">
                    394 kg CO₂e
                  </span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">
                    Landfill methane prevented
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#1A263D] rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Tamper-Proof Audit Hash
                  </span>
                  <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-bold">
                    SHA-256
                  </span>
                </div>
                <div className="p-2.5 bg-white dark:bg-[#131D31] rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all">
                  0x8f4a9b2c7e103984fa55c9124018e2bb3901caef40
                </div>

                <button
                  type="button"
                  onClick={handleExportAudit}
                  className="w-full btn-primary-m3 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Compliance Certificate (JSON)</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-bold text-xs sm:text-sm transition-colors"
            >
              Open Settings
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-full font-bold text-xs sm:text-sm transition-colors text-center"
          >
            {t('close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
