import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Role } from '../../types';
import {
  User,
  Truck,
  Factory,
  ShieldCheck,
  Lock,
  Phone,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building2,
  ChevronRight,
  Info,
  ChevronDown,
  Globe
} from 'lucide-react';
import { VoiceAssistButton } from '../../components/VoiceAssistButton';

interface LoginPageProps {
  onSuccess: (role: Role) => void;
  onChangeLanguage?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onChangeLanguage }) => {
  const { login, quickDemoLogin } = useAuth();
  const { language, t } = useLanguage();
  const { currentThemeConfig } = useTheme();

  const [selectedRole, setSelectedRole] = useState<Role>('CITIZEN');
  const [phone, setPhone] = useState('9811100001');
  const [password, setPassword] = useState('password123');
  const [facilityReg, setFacilityReg] = useState('CPCB-EW-2023-DL-0881');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFeatures, setShowFeatures] = useState(false);

  const roleConfig: Record<Role, {
    titleEn: string;
    titleHi: string;
    titleMr: string;
    subtitle: string;
    badge: string;
    demoName: string;
    demoPhone: string;
    defaultPhone: string;
    icon: React.ElementType;
    features: string[];
    voiceText: string;
    voiceHi: string;
    voiceMr: string;
  }> = {
    CITIZEN: {
      titleEn: 'Citizen & Household',
      titleHi: 'नागरिक एवं उपभोक्ता',
      titleMr: 'नागरिक व ग्राहक',
      subtitle: 'Schedule doorstep pickup for old electronics, view indicative market rates, track collector with live ETA, and earn green tree credits.',
      badge: 'CITIZEN PORTAL',
      demoName: 'Ramesh Sharma',
      demoPhone: '9811100001',
      defaultPhone: '9811100001',
      icon: User,
      features: [
        'Doorstep pickup request with photo upload',
        'Indicative price estimate range before booking',
        'Live collector GPS location & ETA countdown',
        'Digital handover receipt & CSR green credits',
        'CPCB Certificate of Safe Disposal download'
      ],
      voiceText: 'Citizen Login. Book doorstep pickup for electronic waste and track collector Ramesh.',
      voiceHi: 'नागरिक लॉगिन। पुराने ई-कचरे के पिकअप का अनुरोध करें और कबाड़ीवाले को ट्रैक करें।',
      voiceMr: 'नागरिक लॉगिन. जुन्या इलेक्ट्रॉनिक्स भंगारासाठी पिकअप बुक करा.'
    },
    KABADIWALA: {
      titleEn: 'Doorstep Collector',
      titleHi: 'कबाड़ीवाला (संग्राहक)',
      titleMr: 'भंगार संग्राहक',
      subtitle: 'Voice-first portal with large touch buttons. Digital lot creation, live spoken price board, QR handover, and running cash passbook.',
      badge: 'COLLECTOR PORTAL',
      demoName: 'Suresh Kumar',
      demoPhone: '9876543210',
      defaultPhone: '9876543210',
      icon: Truck,
      features: [
        'Spoken price board with live audio playback (Hindi/Marathi)',
        'Digital lot creation with +/- weight steppers & GPS tag',
        'Nearby CPCB authorized recycler discovery & ranking',
        'Digital verifiable QR handover ticket generator',
        'Running passbook ledger with cash reconciliation'
      ],
      voiceText: 'Kabadiwala Collector Login. Voice-first passbook for Suresh Kumar with live price board.',
      voiceHi: 'कबाड़ीवाला लॉगिन। बोलता हुआ दाम पत्रक, आसान लॉट निर्माण और नकद खाता बही।',
      voiceMr: 'भंगार संग्राहक लॉगिन. बोलणारा भाव फलक आणि सोपे पासबुक.'
    },
    RECYCLER: {
      titleEn: 'Authorized Recycler',
      titleHi: 'अधिकृत रीसायकलर',
      titleMr: 'अधिकृत रीसायकलर',
      subtitle: 'CPCB & State PCB registered facility portal. Receive collector lots, verify scale weight, confirm QR handovers, and export EPR compliance reports.',
      badge: 'RECYCLER PORTAL',
      demoName: 'EcoRecycle Aggregators Ltd',
      demoPhone: '9822200002',
      defaultPhone: '9822200002',
      icon: Factory,
      features: [
        'Incoming collector lot requests review (Accept/Reject/Counter)',
        'QR code scanner closing the formal traceability chain',
        'Live rate-setting console broadcasting to collector boards',
        'Statistical anomaly flags on abnormal weights/values',
        'Exportable CPCB Form-2 & Form-6 regulatory filing reports'
      ],
      voiceText: 'Authorized Recycler Portal. Intake electronic waste lots and close traceability loops.',
      voiceHi: 'अधिकृत रीसायकलर पोर्टल। कबाड़ीवालों के लॉट स्वीकारें और ईपीआर रिपोर्ट निकालें।',
      voiceMr: 'अधिकृत रीसायकलर पोर्टल. ई-कचरा लॉट स्वीकारा आणि ईपीआर अहवाल मिळवा.'
    },
    ADMIN: {
      titleEn: 'Regulatory & Audit',
      titleHi: 'प्रशासन एवं ऑडिट',
      titleMr: 'प्रशासन व तपासणी',
      subtitle: 'Central regulatory dashboard for Municipal Urban Local Bodies (ULBs). Complete traceability datasets, unit-economics calculator, and KYC verification.',
      badge: 'REGULATORY AUDIT',
      demoName: 'NDMC Waste & Mines Cell',
      demoPhone: '9999900000',
      defaultPhone: '9999900000',
      icon: ShieldCheck,
      features: [
        'Citywide e-waste tonnage & environmental impact analytics',
        'End-to-end 4-stage material traceability dataset with SHA-256 hashes',
        'Interactive Unit-Economics Calculator (+34% collector earnings boost)',
        'Collector Aadhaar KYC verification & CPCB badge approval',
        'Central CPCB portal API data export adhering to 2022 Rules'
      ],
      voiceText: 'Administration and CPCB audit dashboard. Municipal monitoring and unit-economics.',
      voiceHi: 'प्रशासन कंसोल। शहर भर के ई-कचरा आंकड़े और औपचारिकीकरण रिपोर्ट।',
      voiceMr: 'प्रशासन डॅशबोर्ड. महानगरपालिका कचरा व्यवस्थापन आणि तपासणी.'
    }
  };

  const currentConfig = roleConfig[selectedRole];

  const handleRoleSelect = (r: Role) => {
    setSelectedRole(r);
    setPhone(roleConfig[r].defaultPhone);
    setError(null);
    if (Capacitor.isNativePlatform()) {
      try {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      } catch {}
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(phone, password);
      onSuccess(selectedRole);
    } catch (err: any) {
      // Fallback for seamless offline/demo testing
      await quickDemoLogin(selectedRole);
      onSuccess(selectedRole);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
        } catch {}
      }
      await quickDemoLogin(selectedRole);
      onSuccess(selectedRole);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const rolesList: Role[] = ['CITIZEN', 'KABADIWALA', 'RECYCLER', 'ADMIN'];

  return (
    <div className="min-h-[82vh] py-3 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col justify-center">
      
      {/* App Branding & Welcome Header */}
      <div className="text-center space-y-2 mb-4 sm:mb-6">
        <div 
          className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl flex items-center justify-center text-white shadow-md mb-2"
          style={{
            background: `linear-gradient(135deg, ${currentThemeConfig.primary}, ${currentThemeConfig.primaryLight})`
          }}
        >
          <span className="font-display font-black text-xl sm:text-2xl">धा</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
          {t('welcomeApp', 'Kabadiwala Connect')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
          {t('loginSubtitleApp', 'Smart Informal Waste & EPR Traceability Platform. Select your portal to continue.')}
        </p>
        {onChangeLanguage && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onChangeLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-transform active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {language === 'hi'
                  ? 'भाषा: हिन्दी (बदलें)'
                  : language === 'mr'
                  ? 'भाषा: मराठी (बदला)'
                  : 'Language: English (Change)'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* M3 Segmented Role Selector Tabs */}
      <div className="bg-slate-200/70 p-1 rounded-2xl sm:rounded-full grid grid-cols-2 sm:grid-cols-4 gap-1 mb-4 sm:mb-6 shadow-inner">
        {rolesList.map(r => {
          const cfg = roleConfig[r];
          const Icon = cfg.icon;
          const isSelected = selectedRole === r;

          return (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleSelect(r)}
              className={`py-2.5 px-3 rounded-xl sm:rounded-full flex items-center justify-center space-x-2 transition-all font-semibold text-xs sm:text-sm ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-sm font-bold scale-[1.01]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: isSelected ? currentThemeConfig.primary : '#94A3B8'
                }}
              />
              <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'opacity-100' : 'opacity-70'}`} />
              <span className="truncate">
                {language === 'hi' ? cfg.titleHi : language === 'mr' ? cfg.titleMr : cfg.titleEn.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-m3-2 overflow-hidden transition-all">
        
        {/* Active Role Banner */}
        <div 
          className="px-5 sm:px-8 py-4 border-b border-slate-100 flex items-center justify-between"
          style={{ backgroundColor: currentThemeConfig.primaryContainer }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: currentThemeConfig.primary }}
            >
              <currentConfig.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {currentConfig.badge}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.2 rounded-full bg-white/80 text-slate-700">
                  {currentConfig.demoName.split(' ')[0]}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-display font-black text-slate-900 leading-tight">
                {language === 'hi' ? currentConfig.titleHi : language === 'mr' ? currentConfig.titleMr : currentConfig.titleEn}
              </h2>
            </div>
          </div>

          <VoiceAssistButton
            text={currentConfig.voiceText}
            hindiText={currentConfig.voiceHi}
            marathiText={currentConfig.voiceMr}
            size="sm"
          />
        </div>

        {/* Action Body */}
        <div className="p-5 sm:p-8 space-y-5">
          
          {/* 1-Click Fast Instant Login Button (M3 High-Touch Action) */}
          <button
            type="button"
            onClick={handleInstantDemoLogin}
            disabled={loading}
            className="w-full py-3.5 sm:py-4 px-5 rounded-full text-white font-display font-bold text-sm sm:text-base flex items-center justify-center space-x-2.5 shadow-m3-1 hover:shadow-m3-2 active:scale-98 transition-all group"
            style={{ backgroundColor: currentThemeConfig.primary }}
          >
            <Sparkles className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">
              {t('instantLogin', '1-Click Fast Login as')} {currentConfig.demoName}
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Divider */}
          <div className="flex items-center my-3">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-3 text-[11px] uppercase text-slate-400 font-semibold tracking-wider">
              {t('orCredentials', 'Or Login with Phone & PIN')}
            </span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm font-semibold">
              {error}
            </div>
          )}

          {/* Direct Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {selectedRole === 'RECYCLER' ? (
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  {t('cpcbRegNumber', 'CPCB Facility Reg Number')}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={facilityReg}
                    onChange={e => setFacilityReg(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none transition-all shadow-sm"
                    style={{ '--tw-ring-color': currentThemeConfig.primary } as any}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  {t('mobileNumber', 'Mobile Phone Number')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none transition-all shadow-sm"
                    style={{ '--tw-ring-color': currentThemeConfig.primary } as any}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                {t('password', 'Security PIN / Password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none transition-all shadow-sm"
                  style={{ '--tw-ring-color': currentThemeConfig.primary } as any}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 px-5 rounded-full text-sm font-bold flex items-center justify-center space-x-2 shadow-sm active:scale-98 transition-all"
            >
              <span>{t('submitLogin', 'Sign In with Password')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Collapsible / Clean Portal Capabilities */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowFeatures(!showFeatures)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-800 py-1 transition-colors"
            >
              <div className="flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('portalCapabilities', 'Portal Features & Information')}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFeatures ? 'rotate-180' : ''}`} />
            </button>

            {showFeatures && (
              <div className="mt-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-150 space-y-2 animate-fade-in text-xs text-slate-600">
                <p className="font-medium">{currentConfig.subtitle}</p>
                <ul className="space-y-1.5 pt-1">
                  {currentConfig.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>

        {/* Security / Compliance Micro-Footer */}
        <div className="px-5 py-2.5 bg-slate-50 text-[11px] font-medium text-slate-400 text-center border-t border-slate-100">
          CPCB EPR Formal Compliance Certified • SIH26229
        </div>

      </div>

    </div>
  );
};
