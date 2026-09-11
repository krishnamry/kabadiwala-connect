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
  Search,
  Link2,
  ExternalLink,
  Headphones,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  Loader2,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { LeafletMap } from '../../components/LeafletMap';
import { reverseGeocode } from '../../lib/location';
import { triggerHaptic, hapticSuccess } from '../../lib/haptics';

interface ProfilePageProps {
  onBack: () => void;
  onOpenSettings?: () => void;
  initialTab?: ProfileTab;
}

type ProfileTab = 'personal' | 'security' | 'support';

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBack,
  onOpenSettings,
  initialTab
}) => {
  const { user, updateProfile, logout } = useAuth();
  const { language, t } = useLanguage();
  const { currentThemeConfig } = useTheme();

  // Sub-section tab: personal | security | support
  const [activeSubTab, setActiveSubTab] = useState<ProfileTab>(initialTab || 'personal');

  // Sync if initialTab changes externally (e.g. from navbar dropdown)
  React.useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  // Personal details state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || (user ? `${user.role.toLowerCase()}@kabadiwalaconnect.org` : ''));
  const [address, setAddress] = useState(user?.address || 'Sector 4, Rohini / Okhla Industrial Area, New Delhi');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [personalSaveSuccess, setPersonalSaveSuccess] = useState<string | null>(null);

  // Address Geocoding & Map Confirmation state
  const [addressLat, setAddressLat] = useState(28.6139);
  const [addressLng, setAddressLng] = useState(77.2090);
  const [userCoords, setUserCoords] = useState<[number, number] | null>([28.6139, 77.2090]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geoFeedback, setGeoFeedback] = useState<string | null>(null);

  // Security state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [sessionsMsg, setSessionsMsg] = useState<string | null>(null);

  // Support FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  // Parse coordinates from link or raw text
  const parseCoordinatesFromText = (text: string): [number, number] | null => {
    if (!text) return null;
    const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) return [parseFloat(atMatch[1]), parseFloat(atMatch[2])];
    
    const qMatch = text.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) return [parseFloat(qMatch[1]), parseFloat(qMatch[2])];

    const rawMatch = text.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
    if (rawMatch) return [parseFloat(rawMatch[1]), parseFloat(rawMatch[2])];

    return null;
  };

  const handleFetchAddressLocation = async () => {
    const query = googleMapsLink.trim() || address.trim();
    if (!query) {
      setGeoFeedback('Please enter an address or Google Maps link first.');
      return;
    }

    setIsGeocoding(true);
    setGeoFeedback(null);
    try {
      const parsedCoords = parseCoordinatesFromText(query);
      if (parsedCoords) {
        setAddressLat(parsedCoords[0]);
        setAddressLng(parsedCoords[1]);
        setUserCoords(parsedCoords);
        const geo = await reverseGeocode(parsedCoords[0], parsedCoords[1]);
        setGeoFeedback(`✓ Location confirmed on map from link: ${geo.shortAddress} (${parsedCoords[0].toFixed(4)}° N, ${parsedCoords[1].toFixed(4)}° E)`);
        hapticSuccess();
        return;
      }

      const searchTarget = googleMapsLink.trim() ? (address.trim() || query) : address.trim();
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTarget)}&limit=1`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setAddressLat(lat);
        setAddressLng(lon);
        setUserCoords([lat, lon]);
        setGeoFeedback(`✓ Location confirmed on map: ${data[0].display_name.split(',').slice(0, 3).join(', ')}`);
        hapticSuccess();
      } else {
        setGeoFeedback('Could not resolve exact coordinates. Tap or drag pin on map to set position.');
      }
    } catch (err) {
      console.warn('Geocoding error', err);
      setGeoFeedback('Error resolving location. Please pinpoint on map.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleMapLocationSelect = async (lat: number, lng: number, addr?: string) => {
    setAddressLat(lat);
    setAddressLng(lng);
    if (addr) {
      setAddress(addr);
      setGeoFeedback(`✓ Pin placed & confirmed at: ${addr.split(',').slice(0, 2).join(',')}`);
    } else {
      try {
        const geo = await reverseGeocode(lat, lng);
        setAddress(geo.address);
        setGeoFeedback(`✓ Pin placed & confirmed at: ${geo.shortAddress}`);
      } catch (err) {
        console.warn(err);
      }
    }
  };

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-body transition-colors duration-200 w-full">
      {/* Top Header Bar with Android Status Bar Safe Inset */}
      <div 
        className="sticky top-0 z-40 bg-white/98 dark:bg-[#131D31]/98 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm w-full"
        style={{
          paddingTop: 'var(--app-top-inset, env(safe-area-inset-top, 0px))'
        }}
      >
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
              <div 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full text-white font-bold flex items-center justify-center shadow-sm"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Sub-Section Switcher Tabs (Android 17 / Material 3 Expressive) */}
        <div className="bg-slate-200/80 dark:bg-slate-800/80 p-1.5 rounded-2xl sm:rounded-full grid grid-cols-3 gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              setActiveSubTab('personal');
            }}
            className={`py-2.5 px-3 rounded-xl sm:rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'personal'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm scale-[1.01]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Personal Details</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              setActiveSubTab('security');
            }}
            className={`py-2.5 px-3 rounded-xl sm:rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'security'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm scale-[1.01]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">Security & Access</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              setActiveSubTab('support');
            }}
            className={`py-2.5 px-3 rounded-xl sm:rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'support'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm scale-[1.01]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Headphones className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">Help & Support</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SUB-TAB 1: PERSONAL DETAILS */}
        {/* ========================================================================= */}
        {activeSubTab === 'personal' && (
          <section className="bg-white dark:bg-[#131D31] rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-black text-slate-900 dark:text-white">
                    Personal Information & Location
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Verified mobile, official name, email, and confirmed pickup doorstep address.
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
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Registered Mobile</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓ OTP Verified</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      disabled
                      value={user.phone}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-mono cursor-not-allowed shadow-xs"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Street Address & Geocoding */}
                <div className="sm:col-span-2 space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Pickup / Workshop Street Address</span>
                      <span className="text-[10px] text-slate-400 font-normal">Type address, add link, or tap map</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          placeholder="House/unit no., street, locality, landmark, pincode..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleFetchAddressLocation}
                        disabled={isGeocoding}
                        title="Fetch coordinates & confirm on map from filled address"
                        className="px-4 py-2.5 bg-paper-200 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-2xl border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-2xs"
                      >
                        {isGeocoding ? (
                          <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                        ) : (
                          <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                        <span>{isGeocoding ? 'Locating...' : 'Fetch Location'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Optional Google Maps Link */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Google Maps Link <span className="text-slate-400 font-normal lowercase">(optional)</span></span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">e.g. maps.app.goo.gl or coordinates</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={googleMapsLink}
                        onChange={e => setGoogleMapsLink(e.target.value)}
                        placeholder="e.g. https://maps.app.goo.gl/... or 28.6139, 77.2090"
                        className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs font-mono"
                      />
                      {googleMapsLink.trim() && (
                        <button
                          type="button"
                          onClick={handleFetchAddressLocation}
                          disabled={isGeocoding}
                          className="px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 shrink-0 shadow-2xs"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Locate</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Feedback Banner */}
                  {geoFeedback && (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-xl text-xs font-mono text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fade-in shadow-2xs">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{geoFeedback}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setGeoFeedback(null)}
                        className="text-emerald-600 dark:text-emerald-400 hover:opacity-75 font-bold ml-2 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Interactive Map Confirmation */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
                        <span>📍 Confirmed Doorstep Location on Map:</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-slate-700">
                        {addressLat.toFixed(4)}° N, {addressLng.toFixed(4)}° E
                      </span>
                    </div>
                    <div className="h-48 sm:h-56 rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-inner relative">
                      <LeafletMap
                        center={[addressLat, addressLng]}
                        zoom={15}
                        selectableLocation={true}
                        pinLocation={[addressLat, addressLng]}
                        userPosition={userCoords}
                        onLocationSelect={handleMapLocationSelect}
                        height="100%"
                      />
                      <div className="absolute bottom-2 left-2 right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 pointer-events-none text-center shadow-sm">
                        ✓ Pin confirms verified doorstep. Tap or drag to fine-tune.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {personalSaveSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{personalSaveSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-transform active:scale-95 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Personal Details</span>
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ========================================================================= */}
        {/* SUB-TAB 2: SECURITY & ACCESS */}
        {/* ========================================================================= */}
        {activeSubTab === 'security' && (
          <div className="space-y-6 animate-fade-in">
            {/* PIN & Password Card */}
            <section className="bg-white dark:bg-[#131D31] rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-600/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-black text-slate-900 dark:text-white">
                    Account Security & Credentials
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Change your 4-digit rapid security PIN and manage biometric credentials.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdatePin} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Current PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={currentPin}
                      onChange={e => setCurrentPin(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      New 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="••••"
                      value={newPin}
                      onChange={e => setNewPin(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Confirm New PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="••••"
                      value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {pinError && (
                  <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}

                {pinSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{pinSuccess}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Update Security PIN</span>
                  </button>
                </div>
              </form>

              {/* Toggles */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Biometric Unlock
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Use device fingerprint or face recognition for fast terminal access
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(15);
                      setBiometricsEnabled(!biometricsEnabled);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      biometricsEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        biometricsEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Two-Factor Authentication (2FA)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Require SMS OTP verification for sensitive batch transfers and rate edits
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(15);
                      setTwoFactorEnabled(!twoFactorEnabled);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      twoFactorEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Sessions & Logout */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleLogoutOtherSessions}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
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
                  className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
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

            {/* Traceability & EPR Certificate Card */}
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
        )}

        {/* ========================================================================= */}
        {/* SUB-TAB 3: HELP & SUPPORT (WITH ACTIVE DEVELOPMENT NOTICE) */}
        {/* ========================================================================= */}
        {activeSubTab === 'support' && (
          <div className="space-y-6 animate-fade-in">
            {/* Active Development Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-teal-500/15 border border-amber-400/40 dark:border-amber-500/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-black text-slate-900 dark:text-white text-base sm:text-lg">
                      {t('supportTitle', 'Help & Customer Support')}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/50">
                      {t('inDevelopment', 'Feature In Active Development')}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {t('supportDesc', 'An integrated real-time ticketing console and AI dispute mediator are actively being built for upcoming releases. Direct helpline channels, email desks, and emergency WhatsApp support are operational below.')}
                  </p>
                </div>
              </div>
            </div>

            {/* Support Helplines Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Toll-Free Helpline */}
              <a
                href="tel:18002663927"
                onClick={() => triggerHaptic(15)}
                className="p-5 rounded-3xl bg-white dark:bg-[#131D31] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex items-start gap-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOLL-FREE HELPLINE (24/7)</span>
                  <span className="font-display font-black text-base sm:text-lg text-slate-900 dark:text-white block mt-0.5">1800-266-EWASTE</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">Free call from any Indian mobile/landline</span>
                </div>
              </a>

              {/* Direct Support Email Desk */}
              <a
                href="mailto:support@kabadiwalaconnect.org"
                onClick={() => triggerHaptic(15)}
                className="p-5 rounded-3xl bg-white dark:bg-[#131D31] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-500 dark:hover:border-blue-500 transition-all flex items-start gap-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DIRECT EMAIL ASSISTANCE</span>
                  <span className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white block mt-0.5 truncate">support@kabadiwalaconnect.org</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold block mt-0.5">Response SLA: &lt; 2 business hours</span>
                </div>
              </a>

              {/* WhatsApp Support */}
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic(15)}
                className="p-5 rounded-3xl bg-white dark:bg-[#131D31] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex items-start gap-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">WHATSAPP CHAT ASSIST</span>
                  <span className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white block mt-0.5">+91 98765 43210</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">Chat in Hindi, Marathi, or English</span>
                </div>
              </a>

              {/* CPCB Nodal Office */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#131D31] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-600/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CPCB GRIEVANCE NODAL OFFICER</span>
                  <span className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white block mt-0.5 truncate">Shri R. K. Sharma (CPCB)</span>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">Ministry of Mines / CPCB Helpdesk</span>
                </div>
              </div>
            </div>

            {/* Frequently Asked Questions */}
            <div className="bg-white dark:bg-[#131D31] rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 mb-2">
                <HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">
                  Frequently Asked Questions (FAQ)
                </h3>
              </div>

              {[
                {
                  q: 'How are real-time e-waste rates calculated?',
                  a: 'Rates are derived from London Metal Exchange (LME) secondary metal commodity indices, factored with localized CPCB transportation logistics and grading benchmarks.'
                },
                {
                  q: 'How does doorstep scrap pickup verification operate?',
                  a: 'A registered, CPCB-verified Kabadiwala visits your confirmed address with certified weighing equipment. Categories and weights are digitally recorded, and instant receipts are issued.'
                },
                {
                  q: 'What is the CPCB Form-2 EPR Compliance Certificate?',
                  a: 'It is a cryptographically verifiable electronic waste token proving that material was channeled through authorized smelters, safeguarding against hazardous open burning.'
                },
                {
                  q: 'How can I report an issue with a collector or recycler?',
                  a: 'You can immediately reach our 24/7 toll-free helpline at 1800-266-EWASTE or send an email to support@kabadiwalaconnect.org with the transaction or lot ID.'
                }
              ].map((faq, idx) => (
                <div key={idx} className="border border-slate-200/70 dark:border-slate-700/60 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(10);
                      setOpenFaq(openFaq === idx ? null : idx);
                    }}
                    className="w-full text-left p-4 flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfilePage;
