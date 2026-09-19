import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../lib/haptics';
import {
  UserPlus,
  LogIn,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Globe,
  CheckCircle2,
  Lock,
  Flame,
  Truck,
  Building2
} from 'lucide-react';

interface AuthChoicePageProps {
  onSelectSignUp: () => void;
  onSelectLogin: () => void;
  onChangeLanguage: () => void;
}

export const AuthChoicePage: React.FC<AuthChoicePageProps> = ({
  onSelectSignUp,
  onSelectLogin,
  onChangeLanguage
}) => {
  const { language, t } = useLanguage();
  const { currentThemeConfig } = useTheme();

  return (
    <div
      className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 transition-colors duration-200"
      style={{
        paddingTop: 'max(1rem, var(--app-top-inset, env(safe-area-inset-top, 0px)))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))'
      }}
    >
      {/* Top Bar with Language Selector Button */}
      <header className="w-full max-w-lg mx-auto px-4 pt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-sm shadow-emerald-600/30">
            ♻
          </div>
          <span className="font-display font-black text-sm tracking-tight text-slate-900 dark:text-white">
            Kabadiwala<span className="text-emerald-600 dark:text-emerald-400">Connect</span>
          </span>
        </div>

        <button
          onClick={() => {
            triggerHaptic(15);
            onChangeLanguage();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{language === 'hi' ? 'हिन्दी' : language === 'mr' ? 'मराठी' : 'English'}</span>
          <span className="text-[10px] text-slate-400 font-normal underline">
            {language === 'hi' ? 'बदलें' : language === 'mr' ? 'बदला' : 'Change'}
          </span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-lg mx-auto px-4 py-4 sm:py-6 flex flex-col justify-center flex-1">
        {/* Brand Emblem & Welcome Subtitle */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>SIH 2026 • CPCB E-Waste Formalization</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {language === 'hi'
              ? 'डिजिटल कबाड़ीवाला एवं ई-कचरा मंच'
              : language === 'mr'
              ? 'डिजिटल कबाडीवाला आणि ई-कचरा व्यासपीठ'
              : 'Smart Informal Waste & EPR Platform'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            {language === 'hi'
              ? 'नागरिकों, कबाड़ीवालों और अधिकृत पुनर्चक्रणकर्ताओं के लिए पारदर्शी मूल्य, आधार-सत्यापित केवाईसी एवं सुरक्षित डिजिटल भुगतान।'
              : language === 'mr'
              ? 'नागरिक, कबाडीवाले आणि अधिकृत पुनर्वापरकर्त्यांसाठी पारदर्शक दर, आधार पडताळणी आणि सुरक्षित डिजिटल व्यवहार.'
              : 'Transparent market rates, verified regulatory KYC, live tracking, and digital passbook for India’s recycling ecosystem.'}
          </p>
        </div>

        {/* Action Choice Container */}
        <div className="space-y-4">
          {/* OPTION 1: SIGN UP (Top, prominent) */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <button
              onClick={() => {
                triggerHaptic(25);
                onSelectSignUp();
              }}
              className="relative w-full text-left p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 hover:border-emerald-500 shadow-lg shadow-emerald-950/5 dark:shadow-emerald-950/20 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-sm">
                  <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{language === 'hi' ? 'नया खाता' : language === 'mr' ? 'नवीन खाते' : 'New User'}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white">
                {language === 'hi' ? 'नया खाता बनाएं (Sign Up)' : language === 'mr' ? 'नवीन खाते तयार करा (Sign Up)' : 'Create an Account (Sign Up)'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {language === 'hi'
                  ? 'नागरिक, कबाड़ीवाला या रीसाइक्लर के रूप में पंजीकरण करें एवं आधार/पैन से तुरंत सत्यापित हों।'
                  : language === 'mr'
                  ? 'नागरिक, कबाडीवाला किंवा रीसायकलर म्हणून नोंदणी करा आणि आधार/पॅनद्वारे पडताळणी करा.'
                  : 'Register as Citizen, Door-to-Door Collector, or Recycler with quick Aadhaar/PAN KYC.'}
              </p>

              {/* Bullet highlights */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>{language === 'hi' ? '3 भूमिकाएं उपलब्ध' : language === 'mr' ? '३ भूमिका उपलब्ध' : '3 Tailored Roles'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>{language === 'hi' ? 'आधार/पैन केवाईसी' : language === 'mr' ? 'आधार/पॅन केवायसी' : 'Aadhaar / PAN KYC'}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center my-2">
            <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
            <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {language === 'hi' ? 'या पहले से खाता है' : language === 'mr' ? 'किंवा आधीच खाते आहे' : 'Or Already Registered'}
            </span>
            <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* OPTION 2: LOG IN (Below) */}
          <div className="relative group">
            <button
              onClick={() => {
                triggerHaptic(20);
                onSelectLogin();
              }}
              className="w-full text-left p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm active:scale-[0.99] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <LogIn className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>{language === 'hi' ? 'साइन इन' : language === 'mr' ? 'साइन इन' : 'Sign In'}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white">
                {language === 'hi' ? 'खाते में लॉग इन करें (Log In)' : language === 'mr' ? 'खात्यात लॉगिन करा (Log In)' : 'Log In to Account'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {language === 'hi'
                  ? 'अपने पंजीकृत मोबाइल नंबर एवं पासवर्ड से अपने पोर्टल में प्रवेश करें।'
                  : language === 'mr'
                  ? 'आपल्या नोंदणीकृत मोबाइल नंबर आणि पासवर्डद्वारे डॅशबोर्डमध्ये प्रवेश करा.'
                  : 'Enter with your registered mobile phone and password.'}
              </p>

              {/* Bullet highlights */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{language === 'hi' ? 'पासवर्ड भूल गए? रिकवरी उपलब्ध' : language === 'mr' ? 'पासवर्ड विसरलात? पुनर्प्राप्ती उपलब्ध' : 'Forgot password recovery available'}</span>
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                  {language === 'hi' ? 'लॉग इन करें →' : language === 'mr' ? 'लॉगिन करा →' : 'Sign In →'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Trust & Compliance Footer */}
      <footer className="w-full max-w-lg mx-auto px-4 pt-2 text-center text-[11px] text-slate-400 dark:text-slate-500 space-y-1">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-bold text-slate-600 dark:text-slate-400">
            CPCB EPR Regulation Compliance 2026
          </span>
        </div>
        <div>
          {language === 'hi'
            ? 'सुरक्षित एन्क्रिप्शन • 100% नि:शुल्क पंजीकरण • औपचारिक ई-कचरा प्रबंधन'
            : language === 'mr'
            ? 'सुरक्षित एन्क्रिप्शन • १००% मोफत नोंदणी • औपचारिक ई-कचरा व्यवस्थापन'
            : 'End-to-end encrypted • 100% Free Registration • Official SIH 2026 Prototype'}
        </div>
      </footer>
    </div>
  );
};
